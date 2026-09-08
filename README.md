# DevMarket

DevMarket is a full-stack digital marketplace for production-ready source code, AI prompt systems, and complete projects. Buyers can browse a curated catalog, pay through Razorpay or submit a UPI/QR payment proof for admin approval, then access only the files they have purchased.

## Runtime architecture

This project runs on the managed WebDev full-stack runtime and uses the scaffold’s supported stack: **React 19 + Vite + TypeScript + Tailwind CSS** for the client, **Express + tRPC** for the server API, **Drizzle ORM** for the managed MySQL/TiDB database, Manus OAuth for the authenticated session, and the built-in S3-compatible storage helper for uploaded files. This is the deployable equivalent of the original Next.js + Express + Prisma brief while keeping the required secure payment and delivery behavior.

The public experience is available at `/`. The buyer library is at `/dashboard`, and the protected admin command center is at `/admin`.

## Local setup

```bash
pnpm install
pnpm db:push
pnpm seed
pnpm dev
```

The development server runs on port `3000`.

## Environment variables

The managed project provides the database and Manus auth variables automatically. For live payment/email integrations, add the following server-side values through the project environment configuration rather than committing a `.env` file:

```env
DATABASE_URL=
JWT_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

`RAZORPAY_KEY_SECRET` is never returned to the client. The current preview supports a safe demo Razorpay path when no secret is configured; once a secret is present, the server validates the HMAC-SHA256 signature for `razorpayOrderId|razorpayPaymentId` before changing an order to `DELIVERED`.

## Data model

The Drizzle schema in `drizzle/schema.ts` contains `users`, `categories`, `products`, `orders`, and `paymentSettings`. Orders carry the payment method, review metadata, Razorpay identifiers, proof URL, rejection reason, and delivery timestamp. Product `fileUrl` values are not exposed through the public catalog.

Generate a migration after schema changes:

```bash
pnpm drizzle-kit generate
pnpm db:push
```

The seed script adds three categories, three sample products, one admin record (`admin@devmarket.local`), and default UPI display settings:

```bash
pnpm seed
```

## API capabilities

The tRPC API is organized under `server/routers.ts`:

- `catalog.categories`, `catalog.featured`, `catalog.products`, `catalog.productBySlug`, and `catalog.settings` are public.
- `orders.createRazorpay`, `orders.verifyRazorpay`, `orders.createManual`, `orders.myOrders`, and `orders.download` are buyer-protected.
- `admin.stats`, `admin.orders`, `admin.approveOrder`, `admin.rejectOrder`, product/category management, payment settings, and user management are admin-protected.

Manual proofs are uploaded from the checkout screen as data URLs in the preview flow; production uploads should be routed through `storagePut()` in `server/storage.ts` and the returned `/manus-storage/...` reference stored in `qrScreenshotUrl`. Deliverable files use the same storage abstraction.

## Security notes

The admin router uses a dedicated role middleware. Download access requires an owned order for the exact product and a `PAID` or `DELIVERED` status. Razorpay success is not trusted from the browser; the server verifies the signature. Product secrets and payment credentials remain server-side. The schema uses typed Drizzle queries rather than interpolated SQL.

## Validation

```bash
pnpm check
pnpm test
pnpm build
```

The test suite covers the auth cookie flow and buyer/admin role boundaries. The live preview was also checked at desktop and mobile widths for the storefront, product detail, checkout, buyer library, and admin routes.
