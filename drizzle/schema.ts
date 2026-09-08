import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isDisabled: boolean("isDisabled").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 220 }).notNull(),
  slug: varchar("slug", { length: 240 }).notNull().unique(),
  description: text("description").notNull(),
  shortDescription: varchar("shortDescription", { length: 320 }).notNull(),
  type: mysqlEnum("type", ["SOURCE_CODE", "PROMPT", "PROJECT"]).notNull(),
  categoryId: int("categoryId").notNull(),
  price: int("price").notNull(),
  discountPrice: int("discountPrice"),
  thumbnailUrl: text("thumbnailUrl").notNull(),
  previewImages: json("previewImages"),
  demoUrl: text("demoUrl"),
  techStack: json("techStack"),
  fileUrl: text("fileUrl").notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  salesCount: int("salesCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const paymentMethod = mysqlEnum("paymentMethod", ["RAZORPAY", "MANUAL_QR"]);
export const orderStatus = mysqlEnum("orderStatus", ["PENDING", "PAID", "FAILED", "REJECTED", "DELIVERED"]);

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 40 }).notNull().unique(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  paymentMethod: paymentMethod.notNull(),
  status: orderStatus.default("PENDING").notNull(),
  razorpayOrderId: varchar("razorpayOrderId", { length: 100 }),
  razorpayPaymentId: varchar("razorpayPaymentId", { length: 100 }),
  razorpaySignature: varchar("razorpaySignature", { length: 180 }),
  qrScreenshotUrl: text("qrScreenshotUrl"),
  manualPaymentNote: varchar("manualPaymentNote", { length: 120 }),
  adminReviewedBy: int("adminReviewedBy"),
  adminReviewedAt: timestamp("adminReviewedAt"),
  adminRejectionReason: text("adminRejectionReason"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const paymentSettings = mysqlTable("paymentSettings", {
  id: int("id").autoincrement().primaryKey(),
  qrCodeImageUrl: text("qrCodeImageUrl"),
  upiId: varchar("upiId", { length: 160 }),
  payeeName: varchar("payeeName", { length: 160 }),
  isRazorpayEnabled: boolean("isRazorpayEnabled").default(true).notNull(),
  isManualQrEnabled: boolean("isManualQrEnabled").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type PaymentSettings = typeof paymentSettings.$inferSelect;
