import {
  boolean,
  integer,
  serial,
  text,
  timestamp,
  varchar,
  jsonb as json,
  pgEnum,
  pgTable,
} from "drizzle-orm/pg-core";

const roleEnum = pgEnum("role", ["user", "admin"]);
const typeEnum = pgEnum("type", ["SOURCE_CODE", "PROMPT", "PROJECT"]);
const paymentMethodEnum = pgEnum("paymentMethod", ["RAZORPAY", "MANUAL_QR"]);
const orderStatusEnum = pgEnum("orderStatus", ["PENDING", "PAID", "FAILED", "REJECTED", "DELIVERED"]);
const blogStatusEnum = pgEnum("status", ["DRAFT", "PUBLISHED"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  isDisabled: boolean("isDisabled").default(false).notNull(),
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
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 220 }).notNull(),
  slug: varchar("slug", { length: 240 }).notNull().unique(),
  description: text("description").notNull(),
  shortDescription: varchar("shortDescription", { length: 320 }).notNull(),
  type: typeEnum("type").notNull(),
  categoryId: integer("categoryId").notNull(),
  price: integer("price").notNull(),
  discountPrice: integer("discountPrice"),
  thumbnailUrl: text("thumbnailUrl").notNull(),
  previewImages: json("previewImages"),
  demoUrl: text("demoUrl"),
  techStack: json("techStack"),
  fileUrl: text("fileUrl").notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});



export const blogPosts = pgTable("blogPosts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 220 }).notNull(),
  slug: varchar("slug", { length: 240 }).notNull().unique(),
  excerpt: varchar("excerpt", { length: 320 }).notNull(),
  content: text("content").notNull(),
  coverImageUrl: text("coverImageUrl"),
  category: varchar("category", { length: 120 }).notNull(),
  tags: json("tags"),
  authorName: varchar("authorName", { length: 160 }).notNull(),
  status: blogStatusEnum("status").default("DRAFT").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("productId").notNull(),
  userId: integer("userId").notNull(),
  rating: integer("rating").notNull(),
  review: text("review").notNull(),
  adminReply: text("adminReply"),
  repliedAt: timestamp("repliedAt"),
  isApproved: boolean("isApproved").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  source: varchar("source", { length: 64 }).default("journal").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const analyticsEvents = pgTable("analyticsEvents", {
  id: serial("id").primaryKey(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  userId: integer("userId"),
  sessionId: varchar("sessionId", { length: 64 }),
  payload: json("payload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
