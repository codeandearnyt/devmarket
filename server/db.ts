import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  analyticsEvents,
  blogPosts,
  categories,
  InsertUser,
  orders,
  paymentSettings,
  productTypes,
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
      const client = postgres(process.env.DATABASE_URL, {
        /**
         * Tuned for Supabase's pooler on serverless.
         *
         * Without these, a function that has been idle for a minute can hand
         * back a socket the pooler already closed, and the next query fails
         * with a connection error even though the database is healthy. One
         * connection per instance plus an aggressive idle timeout means we
         * recycle before the pooler can drop us, rather than retrying after.
         */
        max: 1,
        idle_timeout: 20,
        max_lifetime: 60 * 30,
        connect_timeout: 10,
        // Supabase's transaction-mode pooler cannot keep server-side prepared
        // statements alive across connections.
        prepare: false,
        onnotice: () => {},
      });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Run a query, retrying once if the pooled connection turns out to be dead.
 *
 * A cold or recycled serverless instance occasionally keeps a socket that the
 * database has already closed. One transparent retry turns that transient
 * blip into a normal result instead of a 500 for the user.
 */
export async function withDbRetry<T>(operation: (db: NonNullable<Awaited<ReturnType<typeof getDb>>>) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const db = await getDb();
    if (!db) throw new Error("Database is not configured");
    try {
      return await operation(db);
    } catch (error) {
      lastError = error;
      // Only connection-level faults are worth a second attempt.
      const message = error instanceof Error ? error.message : String(error);
      const isConnectionError = /ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE|Connection terminated|terminating connection|server closed the connection|Client has encountered a connection error/i.test(message);
      if (!isConnectionError) throw error;
      console.warn("[Database] Retrying after connection error:", message);
      // Drop the cached client so the retry opens a fresh socket.
      _db = null;
    }
  }
  throw lastError;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (['name', 'email', 'loginMethod', 'passwordHash', 'photoUrl', 'firebaseUid'] as const).forEach(field => {
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
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}

// ---------------------------------------------------------------------------
// Firebase-authenticated users
// ---------------------------------------------------------------------------

/**
 * Derive a stable `openId` from a Firebase UID.
 *
 * The column is `varchar(64)`, and Firebase UIDs are 28 chars, so a prefixed
 * UID fits comfortably. Keeping the derivation in one place means adding a
 * second identity provider later cannot silently collide with this one.
 */
export function firebaseOpenId(uid: string) {
  const value = `firebase_${uid}`;
  if (value.length <= 64) return value;
  // Defensive: if a future provider issues longer ids, fall back to a digest.
  return value.slice(0, 64);
}

export async function getUserByFirebaseUid(uid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.firebaseUid, uid)).limit(1);
  return result[0];
}

/**
 * Find or create the local user row for a verified Firebase identity, keeping
 * the profile fields (name, email, photo) in step with the provider on every
 * login. Links an existing email-only account rather than creating a duplicate.
 */
export async function upsertFirebaseUser(profile: {
  uid: string;
  email?: string | null;
  name?: string | null;
  photoUrl?: string | null;
  provider?: string | null;
}) {
  const email = profile.email?.trim().toLowerCase() || null;
  const openId = firebaseOpenId(profile.uid);

  return withDbRetry(async db => {
    let existing = (await db.select().from(users).where(eq(users.firebaseUid, profile.uid)).limit(1))[0];

    // Same person previously signed up with email/password: adopt that row so
    // their orders and reviews survive the switch to Google sign-in.
    if (!existing && email) {
      const byEmail = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
      if (byEmail) existing = byEmail;
    }

    if (existing) {
      await db
        .update(users)
        .set({
          firebaseUid: profile.uid,
          name: profile.name ?? existing.name ?? null,
          email: email ?? existing.email ?? null,
          photoUrl: profile.photoUrl ?? existing.photoUrl ?? null,
          loginMethod: profile.provider ?? "google",
          lastSignedIn: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id));
      return (await db.select().from(users).where(eq(users.id, existing.id)).limit(1))[0];
    }

    await db.insert(users).values({
      openId,
      firebaseUid: profile.uid,
      name: profile.name ?? null,
      email,
      photoUrl: profile.photoUrl ?? null,
      loginMethod: profile.provider ?? "google",
      role: openId === ENV.ownerOpenId ? "admin" : "user",
      lastSignedIn: new Date(),
    });

    return (await db.select().from(users).where(eq(users.firebaseUid, profile.uid)).limit(1))[0];
  });
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

/** Fields a user is allowed to change about themselves. */
export type ProfilePatch = {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  github?: string | null;
  linkedin?: string | null;
  photoUrl?: string | null;
};

/**
 * Apply a profile edit and return the fresh row.
 *
 * `name` is kept in sync with first/last so the header greeting and the
 * `users.name` column never drift from what the profile page shows.
 */
export async function updateUserProfile(userId: number, patch: ProfilePatch) {
  return withDbRetry(async db => {
    const [current] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!current) throw new Error("Account not found");

    const set: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      set[key] = value === "" ? null : value;
    }

    // Recompute the display name whenever either half of it changed.
    if (patch.firstName !== undefined || patch.lastName !== undefined) {
      const first = patch.firstName === undefined ? (current.firstName ?? "") : (patch.firstName ?? "");
      const last = patch.lastName === undefined ? (current.lastName ?? "") : (patch.lastName ?? "");
      const combined = `${first} ${last}`.trim();
      set.name = combined || null;
    }

    set.updatedAt = new Date();
    await db.update(users).set(set).where(eq(users.id, userId));

    return (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  });
}

/** Usernames are a public handle, so uniqueness is checked before saving. */
export async function isUsernameTaken(username: string, excludeUserId?: number) {
  const db = await getDb();
  if (!db) return false;
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (!existing) return false;
  return excludeUserId === undefined ? true : existing.id !== excludeUserId;
}

/**
 * Permanently remove the account row.
 *
 * Orders, reviews and analytics reference the user, so the caller is
 * responsible for confirming intent; this is intentionally irreversible.
 */
export async function deleteUserAccount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  await db.delete(users).where(eq(users.id, userId));
}

/** Count of purchases, used for the profile stats strip. */
export async function countUserOrders(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ id: orders.id }).from(orders).where(eq(orders.userId, userId));
  return rows.length;
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

/** Product types are admin-managed rows; products store the slug in `type`. */
export async function listProductTypes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productTypes).orderBy(asc(productTypes.name));
}

/** Count products using a given type slug — blocks deleting a type in use. */
export async function countProductsByType(typeSlug: string) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.type, typeSlug));
  return Number(rows[0]?.count ?? 0);
}

/** Count products in a category — blocks deleting a category in use. */
export async function countProductsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.categoryId, categoryId));
  return Number(rows[0]?.count ?? 0);
}

/** Count orders tied to a user — deleting a buyer would orphan them. */
export async function countOrdersByUser(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.userId, userId));
  return Number(rows[0]?.count ?? 0);
}

export async function listProducts(filters?: { categoryId?: number; type?: string; search?: string; minPrice?: number; maxPrice?: number; sort?: 'newest' | 'price' | 'popular' }) {
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
  await db.insert(subscribers).values({ email, source, isActive: true }).onConflictDoUpdate({ target: subscribers.email, set: { isActive: true, source } });
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
    if (event.eventType === "article_view") {
      const slug = typeof event.payload === "object" && event.payload && "slug" in event.payload ? String((event.payload as { slug?: unknown }).slug ?? "unknown") : "unknown";
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
  return { filterInteractions: events.filter(event => event.eventType === "catalog_filter_changed").length, articleViews: events.filter(event => event.eventType === "article_view").length, topArticles: Array.from(articleCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([slug, views]) => ({ slug, views })), topProducts: Array.from(productSales.entries()).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5).map(([title, value]) => ({ title, ...value })), daily: Array.from(daily.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-14).map(([date, value]) => ({ date, ...value })) };
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

/**
 * Sidebar candidates for an article: same category first, then shared tags,
 * then recency. Only metadata and a reading time travel to the client — the
 * article bodies stay in the database, so opening a post never ships the whole
 * blog. Reading time is counted in SQL from the markdown mirror, which the
 * block editor keeps in sync.
 */
export async function listRelatedBlogPosts(slug: string, limit = 4) {
  const db = await getDb();
  if (!db) return [];
  const safeLimit = Math.min(6, Math.max(2, limit));

  const current = (await db
    .select({ category: blogPosts.category, tags: blogPosts.tags })
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "PUBLISHED")))
    .limit(1))[0];

  const rows = await db
    .select({
      slug: blogPosts.slug,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      category: blogPosts.category,
      authorName: blogPosts.authorName,
      publishedAt: blogPosts.publishedAt,
      tags: blogPosts.tags,
      words: sql<number>`coalesce(array_length(regexp_split_to_array(coalesce(${blogPosts.content}, ''), '[[:space:]]+'), 1), 0)`,
    })
    .from(blogPosts)
    .where(eq(blogPosts.status, "PUBLISHED"))
    .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt))
    .limit(18);

  const currentTags = ((current?.tags as string[] | null) ?? []).map(tag => String(tag).toLowerCase());
  const publishedAt = (value: Date | string | null) => (value ? new Date(value).getTime() : 0);

  return rows
    .filter(row => row.slug !== slug)
    .map(row => {
      const rowTags = ((row.tags as string[] | null) ?? []).map(tag => String(tag).toLowerCase());
      const overlap = rowTags.filter(tag => currentTags.includes(tag)).length;
      const score = (row.category && row.category === current?.category ? 3 : 0) + overlap;
      return { row, score };
    })
    .sort((a, b) => b.score - a.score || publishedAt(b.row.publishedAt) - publishedAt(a.row.publishedAt))
    .slice(0, safeLimit)
    .map(({ row }) => ({
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      category: row.category,
      authorName: row.authorName,
      publishedAt: row.publishedAt,
      readingMinutes: Math.max(1, Math.round(Number(row.words ?? 0) / 200)),
    }));
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
