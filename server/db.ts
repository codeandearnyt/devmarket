import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  analyticsEvents,
  blogPosts,
  categories,
  InsertUser,
  orders,
  paymentSettings,
  products,
  reviews,
  subscribers,
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
  (['name', 'email', 'loginMethod', 'passwordHash'] as const).forEach(field => {
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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createCredentialUser(data: { openId: string; email: string; name: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(users).values({ ...data, loginMethod: "email" });
  return getUserByOpenId(data.openId);
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

export async function listProductReviews(productId: number) {
  const db = await getDb();
  if (!db) return { average: 0, count: 0, reviews: [] };
  const [rows, summary] = await Promise.all([
    db.select({ review: reviews, buyerName: users.name }).from(reviews).innerJoin(users, eq(reviews.userId, users.id)).where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true))).orderBy(desc(reviews.createdAt)),
    db.select({ average: sql<number>`coalesce(avg(${reviews.rating}), 0)`, count: sql<number>`count(*)` }).from(reviews).where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true))),
  ]);
  return { average: Number(summary[0]?.average ?? 0), count: Number(summary[0]?.count ?? 0), reviews: rows };
}

export async function getVerifiedPurchase(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.userId, userId), eq(orders.productId, productId), or(eq(orders.status, "PAID"), eq(orders.status, "DELIVERED")))).limit(1);
  return result[0];
}

export async function createReview(data: typeof reviews.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(reviews).values(data);
  const result = await db.select().from(reviews).where(and(eq(reviews.userId, data.userId), eq(reviews.productId, data.productId))).orderBy(desc(reviews.createdAt)).limit(1);
  return result[0];
}

export async function subscribeEmail(email: string, source = "journal") {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.insert(subscribers).values({ email, source, isActive: true }).onDuplicateKeyUpdate({ set: { isActive: true, source } });
  return { success: true as const };
}

export async function listSubscribers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
}

export async function listAllReviews() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ review: reviews, buyerName: users.name, buyerEmail: users.email, productTitle: products.title })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .innerJoin(products, eq(reviews.productId, products.id))
    .orderBy(desc(reviews.createdAt));
}

export async function setReviewApproval(id: number, isApproved: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(reviews).set({ isApproved }).where(eq(reviews.id, id));
  const result = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  return result[0];
}

export async function setReviewReply(id: number, adminReply: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.update(reviews).set({ adminReply, repliedAt: adminReply ? new Date() : null }).where(eq(reviews.id, id));
  const result = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  return result[0];
}

export async function recordAnalyticsEvent(data: typeof analyticsEvents.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(analyticsEvents).values(data);
}

export async function getAdminAnalytics() {
  const db = await getDb();
  if (!db) return { filterInteractions: 0, articleViews: 0, topArticles: [], topProducts: [], daily: [] };
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [events, sales] = await Promise.all([
    db.select().from(analyticsEvents).where(sql`${analyticsEvents.createdAt} >= ${since}`).orderBy(desc(analyticsEvents.createdAt)).limit(5000),
    db.select({ productTitle: products.title, amount: orders.amount, createdAt: orders.createdAt }).from(orders).innerJoin(products, eq(orders.productId, products.id)).where(or(eq(orders.status, "PAID"), eq(orders.status, "DELIVERED"))).orderBy(desc(orders.createdAt)).limit(5000),
  ]);
  const articleCounts = new Map<string, number>();
  const productSales = new Map<string, { sales: number; revenue: number }>();
  const daily = new Map<string, { events: number; revenue: number }>();
  for (const event of events) {
    const day = event.createdAt.toISOString().slice(0, 10);
    const dayRow = daily.get(day) ?? { events: 0, revenue: 0 };
    dayRow.events += 1;
    daily.set(day, dayRow);
    if (event.eventName === "article_view") {
      const slug = typeof event.metadata === "object" && event.metadata && "slug" in event.metadata ? String((event.metadata as { slug?: unknown }).slug ?? "unknown") : "unknown";
      articleCounts.set(slug, (articleCounts.get(slug) ?? 0) + 1);
    }
  }
  for (const sale of sales) {
    const item = productSales.get(sale.productTitle) ?? { sales: 0, revenue: 0 };
    item.sales += 1;
    item.revenue += Number(sale.amount ?? 0);
    const day = sale.createdAt.toISOString().slice(0, 10);
    const dayRow = daily.get(day) ?? { events: 0, revenue: 0 };
    dayRow.revenue += Number(sale.amount ?? 0);
    daily.set(day, dayRow);
  }
  return { filterInteractions: events.filter(event => event.eventName === "catalog_filter_changed").length, articleViews: events.filter(event => event.eventName === "article_view").length, topArticles: Array.from(articleCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([slug, views]) => ({ slug, views })), topProducts: Array.from(productSales.entries()).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5).map(([title, value]) => ({ title, ...value })), daily: Array.from(daily.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-14).map(([date, value]) => ({ date, ...value })) };
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

export async function listPublishedBlogPostsPage(page = 1, pageSize = 6) {
  const db = await getDb();
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(24, Math.max(1, pageSize));
  if (!db) return { posts: [], total: 0, page: safePage, pageSize: safePageSize, totalPages: 0 };
  const where = eq(blogPosts.status, "PUBLISHED");
  const [posts, countRows] = await Promise.all([
    db.select().from(blogPosts).where(where).orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt)).limit(safePageSize).offset((safePage - 1) * safePageSize),
    db.select({ count: sql<number>`count(*)` }).from(blogPosts).where(where),
  ]);
  const total = Number(countRows[0]?.count ?? 0);
  return { posts, total, page: safePage, pageSize: safePageSize, totalPages: Math.ceil(total / safePageSize) };
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
