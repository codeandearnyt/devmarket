import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import Razorpay from "razorpay";
import { z } from "zod";
import { blogPosts, categories, orders, paymentSettings, products, users } from "../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createBlogPost,
  createOrder,
  createReview,
  deleteBlogPost,
  getAdminAnalytics,
  getDashboardStats,
  getDb,
  getVerifiedPurchase,
  getOrderForUser,
  getPaymentSettings,
  getPublishedBlogPostBySlug,
  getProductBySlug,
  listAdminOrders,
  listAdminBlogPosts,
  listAllReviews,
  listCategories,
  listFeaturedProducts,
  listOrdersForUser,
  listProducts,
  listPublishedBlogPosts,
  listPublishedBlogPostsPage,
  listProductReviews,
  listSubscribers,
  recordAnalyticsEvent,
  subscribeEmail,
  setReviewApproval,
  updateBlogPost,
  updateOrderStatus,
} from "./db";
import { sendDeliveryEmail } from "./email";
import { storagePut } from "./storage";
import { publishRealtime } from "./realtime";

const productInput = z.object({
  title: z.string().min(3).max(220), slug: z.string().min(3).max(240), description: z.string().min(10), shortDescription: z.string().min(5).max(320),
  type: z.enum(["SOURCE_CODE", "PROMPT", "PROJECT"]), categoryId: z.number().int().positive(), price: z.number().int().nonnegative(), discountPrice: z.number().int().nonnegative().nullable().optional(),
  thumbnailUrl: z.string().min(1), previewImages: z.array(z.string()).optional(), demoUrl: z.string().nullable().optional(), techStack: z.array(z.string()).optional(), fileUrl: z.string().min(1), isPublished: z.boolean().optional(), isFeatured: z.boolean().optional(),
});

const blogInput = z.object({
  title: z.string().min(5).max(220), slug: z.string().min(3).max(240).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().min(20).max(320), content: z.string().min(80), coverImageUrl: z.string().url().nullable().optional(),
  category: z.string().min(2).max(120), tags: z.array(z.string().min(1).max(40)).max(8).optional(), authorName: z.string().min(2).max(160), status: z.enum(["DRAFT", "PUBLISHED"]),
});

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

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalog: router({
    categories: publicProcedure.query(() => listCategories()),
    featured: publicProcedure.query(() => listFeaturedProducts()),
    products: publicProcedure.input(z.object({ categoryId: z.number().optional(), type: z.enum(["SOURCE_CODE", "PROMPT", "PROJECT"]).optional(), search: z.string().optional(), minPrice: z.number().int().nonnegative().optional(), maxPrice: z.number().int().nonnegative().optional(), sort: z.enum(["newest", "price", "popular"]).optional() }).optional()).query(({ input }) => listProducts(input)),
    productBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => getProductBySlug(input.slug)),
    reviews: publicProcedure.input(z.object({ productId: z.number().int().positive() })).query(({ input }) => listProductReviews(input.productId)),
    settings: publicProcedure.query(() => getPaymentSettings()),
  }),
  blog: router({
    list: publicProcedure.input(z.object({ page: z.number().int().positive().optional(), pageSize: z.number().int().positive().max(24).optional() }).optional()).query(({ input }) => listPublishedBlogPostsPage(input?.page ?? 1, input?.pageSize ?? 6)),
    bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => getPublishedBlogPostBySlug(input.slug)),
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
    track: publicProcedure.input(z.object({ eventName: z.enum(["catalog_filter_changed", "article_view"]), path: z.string().max(320).optional(), metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional() })).mutation(({ input }) => recordAnalyticsEvent(input)),
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
    categories: adminProcedure.query(() => listCategories()),
    createCategory: adminProcedure.input(z.object({ name: z.string().min(2), slug: z.string().min(2), description: z.string().optional() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      await db.insert(categories).values(input);
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
      const post = await createBlogPost({ ...input, coverImageUrl: input.coverImageUrl ?? null, tags: input.tags ?? [], publishedAt: input.status === "PUBLISHED" ? new Date() : null });
      publishRealtime({ type: "blog.updated", scope: "public", data: { action: "created", slug: input.slug } });
      return post;
    }),
    updateBlog: adminProcedure.input(blogInput.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const { id, ...values } = input;
      const post = await updateBlogPost(id, { ...values, coverImageUrl: values.coverImageUrl ?? null, tags: values.tags ?? [], publishedAt: values.status === "PUBLISHED" ? new Date() : null });
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
      return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, isDisabled: users.isDisabled, createdAt: users.createdAt }).from(users).orderBy(users.createdAt);
    }),
    toggleUser: adminProcedure.input(z.object({ id: z.number().int().positive(), isDisabled: z.boolean() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      await db.update(users).set({ isDisabled: input.isDisabled }).where(eq(users.id, input.id));
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
