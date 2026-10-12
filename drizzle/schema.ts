import {
  boolean,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

const roleEnum = pgEnum("role", ["user", "admin"]);
const paymentMethodEnum = pgEnum("paymentMethod", ["RAZORPAY", "MANUAL_QR", "FREE"]);
const orderStatusEnum = pgEnum("orderStatus", ["PENDING", "PAID", "FAILED", "REJECTED", "DELIVERED"]);
const blogStatusEnum = pgEnum("status", ["DRAFT", "PUBLISHED"]);

/** Ad placement slots */
export const adSlotEnum = pgEnum("adSlot", ["sidebar", "in-article", "banner-top", "banner-bottom"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 320 }).unique(),
  name: varchar("name", { length: 160 }),
  username: varchar("username", { length: 40 }),
  photoUrl: text("photoUrl"),
  role: roleEnum("role").default("user").notNull(),
  isDisabled: boolean("isDisabled").default(false).notNull(),
  loginMethod: varchar("loginMethod", { length: 20 }).default("email").notNull(),
  passwordHash: text("passwordHash"),
  firebaseUid: varchar("firebaseUid", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const productTypes = pgTable("productTypes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  description: varchar("description", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 220 }).notNull(),
  slug: varchar("slug", { length: 240 }).notNull().unique(),
  shortDescription: varchar("shortDescription", { length: 320 }).notNull(),
  description: text("description").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  categoryId: integer("categoryId").notNull(),
  price: integer("price").notNull(),
  discountPrice: integer("discountPrice"),
  thumbnailUrl: text("thumbnailUrl").notNull(),
  previewImages: json("previewImages"),
  techStack: json("techStack"),
  fileUrl: text("fileUrl").notNull(),
  isPublished: boolean("isPublished").default(false).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  salesCount: integer("salesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("orderNumber", { length: 40 }).notNull().unique(),
  userId: integer("userId").notNull(),
  productId: integer("productId").notNull(),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  paymentMethod: paymentMethodEnum("paymentMethod").notNull(),
  status: orderStatusEnum("status").default("PENDING").notNull(),
  razorpayOrderId: varchar("razorpayOrderId", { length: 100 }),
  razorpayPaymentId: varchar("razorpayPaymentId", { length: 100 }),
  razorpaySignature: varchar("razorpaySignature", { length: 180 }),
  qrScreenshotUrl: text("qrScreenshotUrl"),
  manualPaymentNote: varchar("manualPaymentNote", { length: 120 }),
  adminReviewedBy: integer("adminReviewedBy"),
  adminReviewedAt: timestamp("adminReviewedAt"),
  adminRejectionReason: text("adminRejectionReason"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const paymentSettings = pgTable("paymentSettings", {
  id: serial("id").primaryKey(),
  qrCodeImageUrl: text("qrCodeImageUrl"),
  upiId: varchar("upiId", { length: 160 }),
  payeeName: varchar("payeeName", { length: 160 }),
  isRazorpayEnabled: boolean("isRazorpayEnabled").default(true).notNull(),
  isManualQrEnabled: boolean("isManualQrEnabled").default(true).notNull(),
  /** Razorpay credentials (stored server-side only) */
  razorpayKeyId: varchar("razorpayKeyId", { length: 100 }),
  razorpayKeySecret: varchar("razorpayKeySecret", { length: 100 }),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/** Ad management table */
export const ads = pgTable("ads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slot: adSlotEnum("slot").notNull(),
  /** Ad type: "html" for custom HTML/AdSense, "internal" for internal promo */
  type: varchar("type", { length: 20 }).notNull().default("html"),
  /** HTML/JS snippet for AdSense or custom ad code */
  snippet: text("snippet"),
  /** Meta tags for SEO/verification */
  metaTags: text("metaTags"),
  /** AdSense client ID (ca-pub-xxxxx) */
  adSenseClientId: varchar("adSenseClientId", { length: 50 }),
  /** AdSense slot ID */
  adSenseSlotId: varchar("adSenseSlotId", { length: 50 }),
  /** Internal promo: title */
  promoTitle: varchar("promoTitle", { length: 200 }),
  /** Internal promo: description */
  promoDescription: text("promoDescription"),
  /** Internal promo: CTA text */
  promoCtaText: varchar("promoCtaText", { length: 50 }),
  /** Internal promo: CTA link */
  promoCtaLink: varchar("promoCtaLink", { length: 500 }),
  /** Internal promo: image URL */
  promoImageUrl: text("promoImageUrl"),
  /** Display order */
  sortOrder: integer("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("productId").notNull(),
  userId: integer("userId").notNull(),
  rating: integer("rating").notNull(),
  review: text("review").notNull(),
  isApproved: boolean("isApproved").default(false).notNull(),
  adminReply: text("adminReply"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  source: varchar("source", { length: 80 }).default("storefront").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const analyticsEvents = pgTable("analyticsEvents", {
  id: serial("id").primaryKey(),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  sessionId: varchar("sessionId", { length: 64 }),
  payload: json("payload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const blogPosts = pgTable("blogPosts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 220 }).notNull(),
  slug: varchar("slug", { length: 240 }).notNull().unique(),
  excerpt: varchar("excerpt", { length: 320 }).notNull(),
  content: text("content").notNull(),
  coverImageUrl: text("coverImageUrl"),
  /** Structured blocks (heading / paragraph / image / iframe) written by the
   *  block editor. `content` stays a markdown mirror for legacy readers. */
  blocks: json("blocks"),
  category: varchar("category", { length: 120 }).notNull(),
  tags: json("tags"),
  authorName: varchar("authorName", { length: 160 }).notNull(),
  status: blogStatusEnum("status").default("DRAFT").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type PaymentSetting = typeof paymentSettings.$inferSelect;
export type Ad = typeof ads.$inferSelect;
export type NewAd = typeof ads.$inferInsert;