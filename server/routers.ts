import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import Razorpay from "razorpay";
import { z } from "zod";
import { categories, orders, paymentSettings, products, users } from "../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createOrder,
  getDashboardStats,
  getDb,
  getOrderForUser,
  getPaymentSettings,
  getProductBySlug,
  listAdminOrders,
  listCategories,
  listFeaturedProducts,
  listOrdersForUser,
  listProducts,
  updateOrderStatus,
} from "./db";
import { sendDeliveryEmail } from "./email";
import { storagePut } from "./storage";

const productInput = z.object({
  title: z.string().min(3).max(220), slug: z.string().min(3).max(240), description: z.string().min(10), shortDescription: z.string().min(5).max(320),
  type: z.enum(["SOURCE_CODE", "PROMPT", "PROJECT"]), categoryId: z.number().int().positive(), price: z.number().int().nonnegative(), discountPrice: z.number().int().nonnegative().nullable().optional(),
  thumbnailUrl: z.string().min(1), previewImages: z.array(z.string()).optional(), demoUrl: z.string().nullable().optional(), techStack: z.array(z.string()).optional(), fileUrl: z.string().min(1), isPublished: z.boolean().optional(), isFeatured: z.boolean().optional(),
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
  if (!secret) return signature === "demo_signature";
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
    products: publicProcedure.input(z.object({ categoryId: z.number().optional(), type: z.enum(["SOURCE_CODE", "PROMPT", "PROJECT"]).optional(), search: z.string().optional(), sort: z.enum(["newest", "price", "popular"]).optional() }).optional()).query(({ input }) => listProducts(input)),
    productBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => getProductBySlug(input.slug)),
    settings: publicProcedure.query(() => getPaymentSettings()),
  }),
  orders: router({
    myOrders: protectedProcedure.query(({ ctx }) => listOrdersForUser(ctx.user.id)),
    createManual: protectedProcedure.input(z.object({ productId: z.number().int().positive(), screenshotUrl: z.string().min(1), manualPaymentNote: z.string().min(4).max(120) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const product = (await db.select().from(products).where(eq(products.id, input.productId)).limit(1))[0];
      if (!product) throw new Error("Product not found");
      const amount = product.discountPrice ?? product.price;
      const proofUrl = await uploadDataUrl(input.screenshotUrl, `devmarket/payment-proof/${ctx.user.id}`);
      return createOrder({ orderNumber: orderNumber(), userId: ctx.user.id, productId: product.id, amount, currency: "INR", paymentMethod: "MANUAL_QR", status: "PENDING", qrScreenshotUrl: proofUrl, manualPaymentNote: input.manualPaymentNote });
    }),
    createRazorpay: protectedProcedure.input(z.object({ productId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const product = (await db.select().from(products).where(eq(products.id, input.productId)).limit(1))[0];
      if (!product) throw new Error("Product not found");
      const localOrderId = orderNumber();
      const amount = product.discountPrice ?? product.price;
      const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET }) : null;
      const gatewayOrder = razorpay ? await razorpay.orders.create({ amount: amount * 100, currency: "INR", receipt: localOrderId }) : null;
      const order = await createOrder({ orderNumber: localOrderId, userId: ctx.user.id, productId: product.id, amount, currency: "INR", paymentMethod: "RAZORPAY", status: "PENDING", razorpayOrderId: gatewayOrder?.id ?? `demo_rzp_${localOrderId}` });
      return { order, checkout: { keyId: process.env.RAZORPAY_KEY_ID ?? "demo_key", amount: amount * 100, currency: "INR", name: "DevMarket", description: product.title } };
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
      return { success: true, status: "DELIVERED" as const };
    }),
    download: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const owned = await getOrderForUser(input.id, ctx.user.id);
      if (!owned || !["PAID", "DELIVERED"].includes(owned.order.status)) throw new Error("Download is only available after payment approval");
      return { url: owned.product.fileUrl, productTitle: owned.product.title };
    }),
  }),
  admin: router({
    stats: adminProcedure.query(() => getDashboardStats()),
    orders: adminProcedure.query(() => listAdminOrders()),
    approveOrder: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const updated = await updateOrderStatus(input.id, "DELIVERED", ctx.user.id);
      const rows = await listAdminOrders();
      const row = rows.find(item => item.order.id === input.id);
      if (row) await sendDeliveryEmail(row.buyer.email, row.product.title, row.product.fileUrl);
      return updated;
    }),
    rejectOrder: adminProcedure.input(z.object({ id: z.number().int().positive(), reason: z.string().min(4).max(500) })).mutation(async ({ ctx, input }) => updateOrderStatus(input.id, "REJECTED", ctx.user.id, input.reason)),
    products: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(products).orderBy(products.createdAt);
    }),
    createProduct: adminProcedure.input(productInput).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      await db.insert(products).values({ ...input, discountPrice: input.discountPrice ?? null, previewImages: input.previewImages ?? [], techStack: input.techStack ?? [], isPublished: input.isPublished ?? true, isFeatured: input.isFeatured ?? false });
      return { success: true };
    }),
    updateProduct: adminProcedure.input(productInput.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      const { id, ...values } = input;
      await db.update(products).set({ ...values, discountPrice: values.discountPrice ?? null, previewImages: values.previewImages ?? [], techStack: values.techStack ?? [] }).where(eq(products.id, id));
      return { success: true };
    }),
    deleteProduct: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database is not configured");
      await db.delete(products).where(eq(products.id, input.id));
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
      return { success: true };
    }),
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
