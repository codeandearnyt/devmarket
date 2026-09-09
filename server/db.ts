import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  blogPosts,
  categories,
  InsertUser,
  orders,
  paymentSettings,
  products,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (['name', 'email', 'loginMethod'] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function listProducts(filters?: { categoryId?: number; type?: 'SOURCE_CODE' | 'PROMPT' | 'PROJECT'; search?: string; minPrice?: number; maxPrice?: number; sort?: 'newest' | 'price' | 'popular' }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(products.isPublished, true)];
  if (filters?.categoryId) conditions.push(eq(products.categoryId, filters.categoryId));
  if (filters?.type) conditions.push(eq(products.type, filters.type));
  if (filters?.search) conditions.push(or(like(products.title, `%${filters.search}%`), like(products.shortDescription, `%${filters.search}%`))!);
  if (filters?.minPrice !== undefined) conditions.push(sql`coalesce(${products.discountPrice}, ${products.price}) >= ${filters.minPrice}`);
  if (filters?.maxPrice !== undefined) conditions.push(sql`coalesce(${products.discountPrice}, ${products.price}) <= ${filters.maxPrice}`);
  const orderBy = filters?.sort === 'price'
    ? asc(sql`coalesce(${products.discountPrice}, ${products.price})`)
    : filters?.sort === 'popular'
      ? desc(products.salesCount)
      : desc(products.createdAt);
  return db.select().from(products).where(and(...conditions)).orderBy(orderBy);
}

export async function listFeaturedProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.isPublished, true), eq(products.isFeatured, true))).orderBy(desc(products.salesCount)).limit(6);
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(and(eq(products.slug, slug), eq(products.isPublished, true))).limit(1);
  return result[0];
}

export async function createOrder(data: typeof orders.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error('Database is not configured');
  await db.insert(orders).values(data);
  const result = await db.select().from(orders).where(eq(orders.orderNumber, data.orderNumber)).limit(1);
  return result[0];
}

export async function listOrdersForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ order: orders, product: products }).from(orders).innerJoin(products, eq(orders.productId, products.id)).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function listAdminOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ order: orders, product: products, buyer: users }).from(orders).innerJoin(products, eq(orders.productId, products.id)).innerJoin(users, eq(orders.userId, users.id)).orderBy(desc(orders.createdAt));
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalSales: 0, revenue: 0, pendingApprovals: 0, totalProducts: 0 };
  const [sales, pending, productCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)`, revenue: sql<number>`coalesce(sum(${orders.amount}), 0)` }).from(orders).where(or(eq(orders.status, 'PAID'), eq(orders.status, 'DELIVERED'))),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(and(eq(orders.paymentMethod, 'MANUAL_QR'), eq(orders.status, 'PENDING'))),
    db.select({ count: sql<number>`count(*)` }).from(products),
  ]);
  return { totalSales: Number(sales[0]?.count ?? 0), revenue: Number(sales[0]?.revenue ?? 0), pendingApprovals: Number(pending[0]?.count ?? 0), totalProducts: Number(productCount[0]?.count ?? 0) };
}

export async function getPaymentSettings() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(paymentSettings).limit(1);
  return result[0];
}

export async function listPublishedBlogPosts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogPosts).where(eq(blogPosts.status, "PUBLISHED")).orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt));
}

export async function getPublishedBlogPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(blogPosts).where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "PUBLISHED"))).limit(1);
  return result[0];
}

export async function listAdminBlogPosts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogPosts).orderBy(desc(blogPosts.updatedAt), desc(blogPosts.createdAt));
}

export async function createBlogPost(data: typeof blogPosts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(blogPosts).values(data);
  const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, data.slug)).limit(1);
  return result[0];
}

export async function updateBlogPost(id: number, data: Partial<typeof blogPosts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(blogPosts).set(data).where(eq(blogPosts.id, id));
  const result = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  return result[0];
}

export async function deleteBlogPost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
}

export async function updateOrderStatus(id: number, status: 'PAID' | 'DELIVERED' | 'REJECTED', adminId: number, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error('Database is not configured');
  await db.update(orders).set({ status: status, adminReviewedBy: adminId, adminReviewedAt: new Date(), adminRejectionReason: reason ?? null, deliveredAt: status === 'DELIVERED' ? new Date() : null }).where(eq(orders.id, id));
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function getOrderForUser(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ order: orders, product: products }).from(orders).innerJoin(products, eq(orders.productId, products.id)).where(and(eq(orders.id, id), eq(orders.userId, userId))).limit(1);
  return result[0];
}
