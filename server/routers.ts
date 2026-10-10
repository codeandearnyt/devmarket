import crypto from "node:crypto";
import { and, eq, or } from "drizzle-orm";
import Razorpay from "razorpay";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { blogPosts, categories, orders, paymentSettings, productTypes, products, users, type User } from "../drizzle/schema";
import { ADMIN_COOKIE_NAME, COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createBlogPost,
  createOrder,
  createReview,
  countUserOrders,
  deleteBlogPost,
  deleteUserAccount,
  getAdminAnalytics,
  getDashboardStats,
  getDb,
  getUserByEmail,
  getUserByFirebaseUid,
  getUserByOpenId,
  getVerifiedPurchase,
  getOrderForUser,
  getPaymentSettings,
  getPublishedBlogPostBySlug,
  getProductBySlug,
  isUsernameTaken,
  listAdminOrders,
  listAdminBlogPosts,
  listAllReviews,
  listCategories,
  listFeaturedProducts,
  listOrdersForUser,
  listProductTypes,
  countProductsByType,
  countProductsByCategory,
  countOrdersByUser,
  listProducts,
  listPublishedBlogPosts,
  listPublishedBlogPostsPage,
  listRelatedBlogPosts,
  listProductReviews,
  listSubscribers,
  recordAnalyticsEvent,
  subscribeEmail,
  setReviewApproval,
  setReviewReply,
  updateBlogPost,
  updateOrderStatus,
  updateUserProfile,
} from "./db";
import { sendDeliveryEmail } from "./email";
import { storagePut } from "./storage";
import { hashPassword } from "./credentials";
import { publishRealtime } from "./realtime";
import { authenticateFirebaseUser, createCredentialSession } from "./credentials";
import { exchangeCredentialsForIdToken, verifyFirebaseIdToken } from "./_core/firebase";

const productInput = z.object({
  title: z.string().min(3).max(220), slug: z.string().min(3).max(240), description: z.string().min(10), shortDescription: z.string().min(5).max(320),
  type: z.string().min(2).max(64), categoryId: z.number().int().positive(), price: z.number().int().nonnegative(), discountPrice: z.number().int().nonnegative().nullable().optional(),
  thumbnailUrl: z.string().min(1), previewImages: z.array(z.string()).optional(), demoUrl: z.string().nullable().optional(), techStack: z.array(z.string()).optional(), fileUrl: z.string().min(1), isPublished: z.boolean().optional(), isFeatured: z.boolean().optional(),
});

/**
 * The block editor writes structured content. `content` stays a markdown mirror
 * (derived here when blocks are supplied) so older posts and any markdown
 * reader keep working; `excerpt` is likewise derived from the first paragraph.
 */
const blogBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), text: z.string().min(1).max(200) }),
  z.object({ type: z.literal("paragraph"), text: z.string().min(1).max(20000) }),
  z.object({ type: z.literal("image"), src: z.string().min(4).max(2_000_000).refine(value => /^(https?:\/\/|data:image\/)/i.test(value), "Image must be an https URL or an inline image"), alt: z.string().max(200).optional() }),
  z.object({ type: z.literal("iframe"), src: z.string().min(8).max(2000).url("Embed must be a URL").refine(value => /^https?:\/\//i.test(value), "Embed must be an http(s) URL") }),
]);

const blogObject = z.object({
  title: z.string().min(5).max(220), slug: z.string().min(3).max(240).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().max(320).optional(), content: z.string().max(60000).optional(),
  coverImageUrl: z.string().max(2_000_000).nullable().optional(),
  category: z.string().min(2).max(120), tags: z.array(z.string().min(1).max(40)).max(8).optional(), authorName: z.string().min(2).max(160), status: z.enum(["DRAFT", "PUBLISHED"]),
  blocks: z.array(blogBlockSchema).min(1).max(100).optional(),
});

// A post needs either structured blocks or the legacy markdown pair. Kept as a
// shared predicate so create and update enforce the exact same rule.
const hasBody = (data: z.infer<typeof blogObject>) =>
  Boolean(data.blocks?.length) || (Boolean(data.excerpt) && Boolean(data.content));

const blogInput = blogObject.refine(hasBody, { message: "Provide blocks or both excerpt and content" });
const blogUpdateInput = blogObject.extend({ id: z.number().int().positive() }).refine(hasBody, { message: "Provide blocks or both excerpt and content" });

/** Serialize blocks to the markdown mirror stored in `content`. */
function blocksToMarkdown(blocks: z.infer<typeof blogBlockSchema>[]) {
  return blocks
    .map(block => {
      if (block.type === "heading") return `## ${block.text}`;
      if (block.type === "image") return `![${block.alt ?? "Image"}](${block.src})`;
      if (block.type === "iframe") return `<iframe src="${block.src}" title="Embedded content" class="w-full aspect-video rounded-2xl border-0" allowfullscreen loading="lazy"></iframe>`;
      return block.text;
    })
    .join("\n\n");
}

/** First paragraph as plain text, truncated to the excerpt column width. */
function blocksToExcerpt(blocks: z.infer<typeof blogBlockSchema>[], fallback = "") {
  const paragraph = blocks.find(block => block.type === "paragraph");
  const raw = paragraph?.type === "paragraph" ? paragraph.text : "";
  const text = raw
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  // The column is NOT NULL, so never return an empty string.
  return (text || fallback.replace(/\s+/g, " ").trim()).slice(0, 320);
}

const orderNumber = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `ORD-${date}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
};

const uploadDataUrl = async (dataUrl: string, prefix: string) => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return dataUrl;
  const [, contentType, encoded] = match;
  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
  const result = await storagePut(`${prefix}-${Date.now()}.${ext}`, Buffer.from(encoded, "base64"), contentType);
  return result.url;
};

const publicUser = (user: User | null | undefined) => {
  if (!user) return null;
  const { passwordHash: _passwordHash, firebaseUid: _firebaseUid, ...safeUser } = user;
  return safeUser;
};

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => publicUser(opts.ctx.user)),

    /**
     * Exchange a client-issued Firebase ID token for a DevMarket session cookie.
     *
     * The client signs in with the Firebase Web SDK (Google popup or
     * email/password), then posts the resulting ID token here. The token is
     * verified server-side against Google's public keys, the user row is
     * upserted into Supabase, and an httpOnly session cookie is issued.
     */
    session: publicProcedure
      .input(z.object({ idToken: z.string().min(20).max(4096) }))
      .mutation(async ({ ctx, input }) => {
        const user = await authenticateFirebaseUser(input.idToken);
        const token = await createCredentialSession(user);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });
        return publicUser(user);
      }),

    /**
     * Unlock the admin console with operator credentials.
     *
     * Deliberately independent of whatever session the browser already holds:
     * a visitor signed in with Google is *not* admin just because they browsed
     * to /admin. The password is checked by Firebase, the resulting ID token is
     * verified against Google's keys, and only an account whose role is
     * `admin` receives a session cookie.
     */
    adminLogin: publicProcedure
      .input(
        z.object({
          email: z.string().trim().email().max(320),
          password: z.string().min(1).max(1024),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const idToken = await exchangeCredentialsForIdToken(input.email.toLowerCase(), input.password);
        if (!idToken) {
          // UNAUTHORIZED (not INTERNAL) so the message reaches the form and
          // tRPC does not mask it as a generic 500. Kept vague so the form
          // cannot be used to discover which emails exist or which are admins.
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Those admin credentials are not valid" });
        }

        const claims = await verifyFirebaseIdToken(idToken);
        if (!claims?.user_id) throw new TRPCError({ code: "UNAUTHORIZED", message: "Those admin credentials are not valid" });

        const row =
          (await getUserByFirebaseUid(claims.user_id)) ??
          (claims.email ? await getUserByEmail(claims.email.toLowerCase()) : undefined);

        if (!row || row.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "That account does not have console access" });
        }
        if (row.isDisabled) throw new TRPCError({ code: "FORBIDDEN", message: "This administrator account has been disabled" });

        const session = await createCredentialSession(row);
        // A dedicated cookie, so unlocking the console never overwrites (or
        // hijacks) the storefront session the browser already holds.
        ctx.res.cookie(ADMIN_COOKIE_NAME, session, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });

        return publicUser(row);
      }),

    /** Who is behind the admin cookie? Null when the console is locked. */
    adminMe: publicProcedure.query(opts => publicUser(opts.ctx.adminUser)),

    /** Drop the session issued by `adminLogin`. */
    adminLogout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(ADMIN_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    /**
     * Save profile edits.
     *
     * Only the fields the visitor actually sent are written, so a partial
     * update never blanks out the rest of the profile.
     */
    updateProfile: protectedProcedure
      .input(
        z.object({
          firstName: z.string().trim().max(80).optional(),
          lastName: z.string().trim().max(80).optional(),
          username: z
            .string()
            .trim()
            .max(40)
            .regex(/^[a-zA-Z0-9_.-]+$/, "Use letters, numbers, dots, dashes or underscores only")
            .optional(),
          bio: z.string().trim().max(500).optional(),
          location: z.string().trim().max(120).optional(),
          website: z.string().trim().max(300).optional(),
          github: z.string().trim().max(120).optional(),
          linkedin: z.string().trim().max(160).optional(),
          photoUrl: z.string().trim().max(1000).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user as NonNullable<typeof ctx.user>;

        // Normalise a handle to lower case so "Nitin" and "nitin" cannot both exist.
        if (input.username) {
          const username = input.username.toLowerCase();
          if (await isUsernameTaken(username, user.id)) {
            throw new Error("That username is already taken");
          }
          await updateUserProfile(user.id, { ...input, username });
        } else {
          await updateUserProfile(user.id, input);
        }

        const [refreshed] = await Promise.all([getUserByOpenId(user.openId)]);
        return publicUser(refreshed ?? user);
      }),

    /** Availability check so the UI can warn before the user hits save. */
    usernameAvailable: protectedProcedure
      .input(z.object({ username: z.string().trim().max(40) }))
      .query(async ({ ctx, input }) => {
        const user = ctx.user as NonNullable<typeof ctx.user>;
        const username = input.username.toLowerCase();
        if (!username) return { available: false };
        return { available: !(await isUsernameTaken(username, user.id)) };
      }),

    /** Lifetime purchase count for the profile stats strip. */
    stats: protectedProcedure.query(async ({ ctx }) => {
      const user = ctx.user as NonNullable<typeof ctx.user>;
      return {
        orders: await countUserOrders(user.id),
        memberSince: user.createdAt,
        role: user.role,
      };
    }),

    /**
     * Delete the local account row and clear the session.
     *
     * The Firebase identity is removed separately by the client, which is the
     * only holder of the credentials needed to call Firebase's delete API.
     */
    deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
      const user = ctx.user as NonNullable<typeof ctx.user>;
      await deleteUserAccount(user.id);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalog: router({
    categories: publicProcedure.query(() => listCategories()),
    types: publicProcedure.query(() => listProductTypes()),
    featured: publicProcedure.query(() => listFeaturedProducts()),
    products: publicProcedure.input(z.object({ categoryId: z.number().optional(), type: z.string().optional(), search: z.string().optional(), minPrice: z.number().int().nonnegative().optional(), maxPrice: z.number().int().nonnegative().optional(), sort: z.enum(["newest", "price", "popular"]).optional() }).optional()).query(({ input }) => listProducts(input)),
    productBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => getProductBySlug(input.slug)),
    reviews: publicProcedure.input(z.object({ productId: z.number().int().positive() })).query(({ input }) => listProductReviews(input.productId)),
    settings: publicProcedure.query(() => getPaymentSettings()),
  }),
  blog: router({
    list: publicProcedure.input(z.object({ page: z.number().int().positive().optional(), pageSize: z.number().int().positive().max(24).optional() }).optional()).query(({ input }) => listPublishedBlogPostsPage(input?.page ?? 1, input?.pageSize ?? 6)),
    bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => getPublishedBlogPostBySlug(input.slug)),
    related: publicProcedure.input(z.object({ slug: z.string(), limit: z.number().int().positive().max(6).optional() })).query(({ input }) => listRelatedBlogPosts(input.slug, input.limit ?? 4)),
  }),
  orders: router({
    myOrders: protectedProcedure.query(({ ctx }) => listOrdersForUser(ctx.user.id)),
    submitReview: protectedProcedure.input(z.object({ productId: z.number().int().positive(), rating: z.number().int().min(1).max(5), review: z.string().min(10).max(1000) })).mutation(async ({ ctx, input }) => {
      const purchase = await getVerifiedPurchase(ctx.user.id, input.productId);
      if (!purchase) throw new Error("Reviews are available after a verified purchase");
      return createReview({ productId: input.productId, userId: ctx.user.id, rating: input.rating, review: input.review, isApproved: true });
    }),
    createManual: protectedProcedure.input(z.object({ productId: z.number().int().positive(), screenshotUrl: z.string().min(1), manualPaymentNote: z.string().min(4).max(120) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const product = (await db.select().from(products).where(eq(products.id, input.productId)).limit(1))[0];
      if (!product) throw new Error("Product not found");
      const amount = product.discountPrice ?? product.price;
      const proofUrl = await uploadDataUrl(input.screenshotUrl, `devmarket/payment-proof/${ctx.user.id}`);
      const order = await createOrder({ orderNumber: orderNumber(), userId: ctx.user.id, productId: product.id, amount, currency: "INR", paymentMethod: "MANUAL_QR", status: "PENDING", qrScreenshotUrl: proofUrl, manualPaymentNote: input.manualPaymentNote });
      publishRealtime({ type: "order.updated", scope: "admin", data: { orderId: order?.id, status: "PENDING", paymentMethod: "MANUAL_QR" } });
      return order;
    }),
    createRazorpay: protectedProcedure.input(z.object({ productId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const product = (await db.select().from(products).where(eq(products.id, input.productId)).limit(1))[0];
      if (!product) throw new Error("Product not found");
      const localOrderId = orderNumber();
      const amount = product.discountPrice ?? product.price;
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) throw new Error("Razorpay is not configured");
      const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      const gatewayOrder = await razorpay.orders.create({ amount: amount * 100, currency: "INR", receipt: localOrderId });
      const order = await createOrder({ orderNumber: localOrderId, userId: ctx.user.id, productId: product.id, amount, currency: "INR", paymentMethod: "RAZORPAY", status: "PENDING", razorpayOrderId: gatewayOrder.id });
      publishRealtime({ type: "order.updated", scope: "buyer", userId: ctx.user.id, data: { orderId: order?.id, status: "PENDING", paymentMethod: "RAZORPAY" } });
      return { order, checkout: { keyId: process.env.RAZORPAY_KEY_ID, amount: amount * 100, currency: "INR", name: "DevMarket", description: product.title } };
    }),
    createFree: protectedProcedure.input(z.object({ productId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const product = (await db.select().from(products).where(eq(products.id, input.productId)).limit(1))[0];
      if (!product) throw new Error("Product not found");
      const amount = product.discountPrice ?? product.price;
      if (amount !== 0) throw new Error("This product is not free");
      // A free claim unlocks immediately, but never duplicates an order the
      // buyer already owns (they may have paid before the price dropped).
      const owned = (await db.select({ id: orders.id }).from(orders).where(and(eq(orders.userId, ctx.user.id), eq(orders.productId, product.id), or(eq(orders.status, "PAID"), eq(orders.status, "DELIVERED")))).limit(1))[0];
      if (owned) return { order: owned, alreadyOwned: true };
      const order = await createOrder({ orderNumber: orderNumber(), userId: ctx.user.id, productId: product.id, amount: 0, currency: "INR", paymentMethod: "FREE", status: "DELIVERED", deliveredAt: new Date() });
      await db.update(products).set({ salesCount: (product.salesCount ?? 0) + 1 }).where(eq(products.id, product.id));
      publishRealtime({ type: "payment.updated", scope: "buyer", userId: ctx.user.id, data: { orderId: order?.id, status: "DELIVERED" } });
      publishRealtime({ type: "catalog.updated", scope: "public", data: { productId: product.id } });
      return { order, alreadyOwned: false };
    }),
    verifyRazorpay: protectedProcedure.input(z.object({ orderId: z.number().int().positive(), razorpayOrderId: z.string(), razorpayPaymentId: z.string(), razorpaySignature: z.string() })).mutation(async ({ ctx, input }) => {
      const owned = await getOrderForUser(input.orderId, ctx.user.id);
      if (!owned || owned.order.paymentMethod !== "RAZORPAY") throw new Error("Order not found");
      const valid = verifyRazorpaySignature(input.razorpayOrderId, input.razorpayPaymentId, input.razorpaySignature);
      if (!valid) {
        const db = await getDb();
        if (db) await db.update(orders).set({ status: "FAILED", razorpayPaymentId: input.razorpayPaymentId, razorpaySignature: input.razorpaySignature }).where(eq(orders.id, input.orderId));
        throw new Error("Payment signature could not be verified");
      }
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      await db.update(orders).set({ status: "DELIVERED", razorpayPaymentId: input.razorpayPaymentId, razorpaySignature: input.razorpaySignature, deliveredAt: new Date() }).where(eq(orders.id, input.orderId));
      await db.update(products).set({ salesCount: (owned.product.salesCount ?? 0) + 1 }).where(eq(products.id, owned.product.id));
      await sendDeliveryEmail(ctx.user.email, owned.product.title, owned.product.fileUrl);
      publishRealtime({ type: "payment.updated", scope: "buyer", userId: ctx.user.id, data: { orderId: input.orderId, status: "DELIVERED" } });
      publishRealtime({ type: "catalog.updated", scope: "public", data: { productId: owned.product.id } });
      return { success: true, status: "DELIVERED" as const };
    }),
    download: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const owned = await getOrderForUser(input.id, ctx.user.id);
      if (!owned || !["PAID", "DELIVERED"].includes(owned.order.status)) throw new Error("Download is only available after payment approval");
      return { url: owned.product.fileUrl, productTitle: owned.product.title };
    }),
  }),
  newsletter: router({
    subscribe: publicProcedure.input(z.object({ email: z.string().email().max(320), source: z.string().max(80).optional() })).mutation(({ input }) => subscribeEmail(input.email.toLowerCase(), input.source ?? "journal")),
  }),
  analytics: router({
    track: publicProcedure.input(z.object({ eventName: z.enum(["catalog_filter_changed", "article_view"]), path: z.string().max(320).optional(), metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional() })).mutation(({ input }) => recordAnalyticsEvent({ eventType: input.eventName, sessionId: typeof sessionStorage === "undefined" ? undefined : sessionStorage.getItem("devmarket_session") ?? undefined, payload: { ...(input.metadata ?? {}), ...(input.path ? { path: input.path } : {}) } })),
  }),
  admin: router({
    stats: adminProcedure.query(() => getDashboardStats()),
    analytics: adminProcedure.query(() => getAdminAnalytics()),
    subscribers: adminProcedure.query(() => listSubscribers()),
    reviews: adminProcedure.query(() => listAllReviews()),
    setReviewApproval: adminProcedure.input(z.object({ id: z.number().int().positive(), isApproved: z.boolean() })).mutation(async ({ input }) => {
      const review = await setReviewApproval(input.id, input.isApproved);
      publishRealtime({ type: "catalog.updated", scope: "public", data: { action: "review-moderated", reviewId: input.id } });
      return review;
    }),
    setReviewReply: adminProcedure.input(z.object({ id: z.number().int().positive(), reply: z.string().max(1200) })).mutation(async ({ input }) => {
      const review = await setReviewReply(input.id, input.reply.trim() || null);
      publishRealtime({ type: "catalog.updated", scope: "public", data: { action: "review-replied", reviewId: input.id } });
      return review;
    }),
    orders: adminProcedure.query(() => listAdminOrders()),
    approveOrder: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const updated = await updateOrderStatus(input.id, "DELIVERED", ctx.user.id);
      const rows = await listAdminOrders();
      const row = rows.find(item => item.order.id === input.id);
      if (row) await sendDeliveryEmail(row.buyer.email, row.product.title, row.product.fileUrl);
      publishRealtime({ type: "payment.updated", scope: "buyer", userId: row?.order.userId, data: { orderId: input.id, status: "DELIVERED" } });
      publishRealtime({ type: "order.updated", scope: "admin", data: { orderId: input.id, status: "DELIVERED" } });
      return updated;
    }),
    rejectOrder: adminProcedure.input(z.object({ id: z.number().int().positive(), reason: z.string().min(4).max(500) })).mutation(async ({ ctx, input }) => {
      const updated = await updateOrderStatus(input.id, "REJECTED", ctx.user.id, input.reason);
      publishRealtime({ type: "payment.updated", scope: "buyer", userId: updated?.userId, data: { orderId: input.id, status: "REJECTED" } });
      publishRealtime({ type: "order.updated", scope: "admin", data: { orderId: input.id, status: "REJECTED" } });
      return updated;
    }),
    products: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(products).orderBy(products.createdAt);
    }),
    createProduct: adminProcedure.input(productInput).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      await db.insert(products).values({ ...input, discountPrice: input.discountPrice ?? null, previewImages: input.previewImages ?? [], techStack: input.techStack ?? [], isPublished: input.isPublished ?? true, isFeatured: input.isFeatured ?? false });
      publishRealtime({ type: "catalog.updated", scope: "public", data: { action: "created" } });
      return { success: true };
    }),
    updateProduct: adminProcedure.input(productInput.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const { id, ...values } = input;
      await db.update(products).set({ ...values, discountPrice: values.discountPrice ?? null, previewImages: values.previewImages ?? [], techStack: values.techStack ?? [] }).where(eq(products.id, id));
      publishRealtime({ type: "catalog.updated", scope: "public", data: { action: "updated", productId: id } });
      return { success: true };
    }),
    deleteProduct: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      await db.delete(products).where(eq(products.id, input.id));
      publishRealtime({ type: "catalog.updated", scope: "public", data: { action: "deleted", productId: input.id } });
      return { success: true };
    }),
    uploadProductImage: adminProcedure.input(z.object({ dataUrl: z.string().regex(/^data:image\//) })).mutation(async ({ ctx, input }) => ({ url: await uploadDataUrl(input.dataUrl, `devmarket/product-images/${ctx.user.id}`) })),

    // -- Type management -------------------------------------------------------
    // Types are table-backed so admins can rename or add them without a DB
    // migration. Products store the slug in `type`.
    productTypes: adminProcedure.query(() => listProductTypes()),
    createProductType: adminProcedure.input(z.object({ name: z.string().min(2).max(120), slug: z.string().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().max(500).optional() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      await db.insert(productTypes).values(input);
      return { success: true };
    }),
    updateProductType: adminProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().min(2).max(120), slug: z.string().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().max(500).optional() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const { id, slug: newSlug, ...values } = input;
      const existing = (await db.select().from(productTypes).where(eq(productTypes.id, id)).limit(1))[0];
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Type not found" });
      await db.update(productTypes).set({ name: values.name, slug: newSlug, description: values.description ?? null }).where(eq(productTypes.id, id));
      // Products store the slug, so a rename has to follow it onto every row.
      if (existing.slug !== newSlug) await db.update(products).set({ type: newSlug }).where(eq(products.type, existing.slug));
      return { success: true };
    }),
    deleteProductType: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const existing = (await db.select().from(productTypes).where(eq(productTypes.id, input.id)).limit(1))[0];
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Type not found" });
      const inUse = await countProductsByType(existing.slug);
      if (inUse > 0) throw new TRPCError({ code: "CONFLICT", message: `${inUse} product${inUse === 1 ? "" : "s"} ${inUse === 1 ? "uses" : "use"} this type — reassign them first` });
      await db.delete(productTypes).where(eq(productTypes.id, input.id));
      return { success: true };
    }),
    categories: adminProcedure.query(() => listCategories()),
    createCategory: adminProcedure.input(z.object({ name: z.string().min(2), slug: z.string().min(2), description: z.string().optional() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      await db.insert(categories).values(input);
      return { success: true };
    }),
    updateCategory: adminProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().min(2).max(120), slug: z.string().min(2).max(140), description: z.string().max(500).optional() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const { id, ...values } = input;
      await db.update(categories).set(values).where(eq(categories.id, id));
      return { success: true };
    }),
    deleteCategory: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const inUse = await countProductsByCategory(input.id);
      if (inUse > 0) throw new TRPCError({ code: "CONFLICT", message: `Category still holds ${inUse} product${inUse === 1 ? "" : "s"} — move them first` });
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      await db.delete(categories).where(eq(categories.id, input.id));
      return { success: true };
    }),
    settings: adminProcedure.query(() => getPaymentSettings()),
    updateSettings: adminProcedure.input(z.object({ upiId: z.string().optional(), payeeName: z.string().optional(), qrCodeImageUrl: z.string().optional(), isRazorpayEnabled: z.boolean(), isManualQrEnabled: z.boolean() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const existing = await getPaymentSettings();
      if (existing) await db.update(paymentSettings).set(input).where(eq(paymentSettings.id, existing.id));
      else await db.insert(paymentSettings).values(input);
      publishRealtime({ type: "catalog.updated", scope: "public", data: { action: "payment-settings-updated" } });
      return { success: true };
    }),
    blogs: adminProcedure.query(() => listAdminBlogPosts()),
    createBlog: adminProcedure.input(blogInput).mutation(async ({ input }) => {
      // The block editor is the source of truth; markdown and the excerpt are
      // derived so listings and legacy readers see the same article.
      const blocks = input.blocks ?? null;
      const post = await createBlogPost({
        ...input,
        blocks,
        content: blocks ? blocksToMarkdown(blocks) : input.content ?? input.title,
        excerpt: blocks ? blocksToExcerpt(blocks, input.title) : input.excerpt ?? input.title,
        coverImageUrl: input.coverImageUrl ?? null,
        tags: input.tags ?? [],
        publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      });
      publishRealtime({ type: "blog.updated", scope: "public", data: { action: "created", slug: input.slug } });
      return post;
    }),
    updateBlog: adminProcedure.input(blogUpdateInput).mutation(async ({ input }) => {
      const { id, ...values } = input;
      const blocks = values.blocks ?? null;
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const existing = (await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1))[0];
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
      const post = await updateBlogPost(id, {
        ...values,
        blocks,
        content: blocks ? blocksToMarkdown(blocks) : values.content ?? values.title,
        excerpt: blocks ? blocksToExcerpt(blocks, values.title) : values.excerpt ?? values.title,
        coverImageUrl: values.coverImageUrl ?? null,
        tags: values.tags ?? [],
        // Keep the original publish date once an article is live — only a
        // fresh publish (draft → published) stamps the current time.
        publishedAt: values.status === "PUBLISHED" ? existing.publishedAt ?? new Date() : null,
      });
      publishRealtime({ type: "blog.updated", scope: "public", data: { action: "updated", id } });
      return post;
    }),
    deleteBlog: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      await deleteBlogPost(input.id);
      publishRealtime({ type: "blog.updated", scope: "public", data: { action: "deleted", id: input.id } });
      return { success: true } as const;
    }),
    uploadBlogCover: adminProcedure.input(z.object({ dataUrl: z.string().regex(/^data:image\//) })).mutation(async ({ ctx, input }) => ({ url: await uploadDataUrl(input.dataUrl, `devmarket/blog-cover/${ctx.user.id}`) })),
    users: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select({ id: users.id, name: users.name, email: users.email, username: users.username, role: users.role, isDisabled: users.isDisabled, loginMethod: users.loginMethod, createdAt: users.createdAt }).from(users).orderBy(users.createdAt);
    }),
    toggleUser: adminProcedure.input(z.object({ id: z.number().int().positive(), isDisabled: z.boolean() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      await db.update(users).set({ isDisabled: input.isDisabled }).where(eq(users.id, input.id));
      return { success: true };
    }),

    // -- User management -------------------------------------------------------
    createUser: adminProcedure.input(z.object({
      name: z.string().min(2).max(160),
      email: z.string().trim().email().max(320),
      username: z.string().min(3).max(40).regex(/^[a-zA-Z0-9_.-]+$/).optional(),
      role: z.enum(["user", "admin"]).default("user"),
      password: z.string().min(8).max(128).optional(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const email = input.email.toLowerCase();
      const existing = await getUserByEmail(email);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists" });
      if (input.username) {
        const taken = await isUsernameTaken(input.username);
        if (taken) throw new TRPCError({ code: "CONFLICT", message: "That username is taken" });
      }
      // Manually provisioned accounts are adopted automatically the first time
      // their owner signs in with Google using the same email.
      await db.insert(users).values({
        openId: `manual_${crypto.randomBytes(16).toString("hex")}`,
        email,
        name: input.name,
        username: input.username ?? null,
        role: input.role,
        passwordHash: input.password ? await hashPassword(input.password) : null,
        loginMethod: "manual",
        lastSignedIn: new Date(),
      });
      return { success: true };
    }),
    updateUser: adminProcedure.input(z.object({
      id: z.number().int().positive(),
      name: z.string().min(2).max(160).optional(),
      email: z.string().trim().email().max(320).optional(),
      username: z.string().min(3).max(40).regex(/^[a-zA-Z0-9_.-]+$/).nullable().optional(),
      role: z.enum(["user", "admin"]).optional(),
      isDisabled: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const target = (await db.select().from(users).where(eq(users.id, input.id)).limit(1))[0];
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      if (target.id === ctx.user.id && (input.role !== undefined && input.role !== target.role || input.isDisabled !== undefined && input.isDisabled)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot change your own role or disable your own account" });
      }
      const { id, ...values } = input;
      if (values.username) {
        // Exclude the target user so an unchanged username still passes.
        const taken = await isUsernameTaken(values.username, id);
        if (taken) throw new TRPCError({ code: "CONFLICT", message: "That username is taken" });
      }
      await db.update(users).set(values).where(eq(users.id, id));
      return { success: true };
    }),
    deleteUser: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      if (input.id === ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You cannot delete your own account" });
      const orderCount = await countOrdersByUser(input.id);
      if (orderCount > 0) throw new TRPCError({ code: "CONFLICT", message: `This user has ${orderCount} order${orderCount === 1 ? "" : "s"} — disable the account instead` });
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      await db.delete(users).where(eq(users.id, input.id));
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
