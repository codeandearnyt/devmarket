-- Ads + AdSense inventory, and the Razorpay credentials the admin console writes.
--
-- Written by hand rather than generated, and written to be re-runnable. The
-- generated diff for this change also wanted to recreate `productTypes` and
-- drop the `users` unique constraints, both of which are already applied here
-- by an earlier hand-written migration that is not in the journal. Applying
-- that file would fail with `42P07 duplicate_object`, so every statement below
-- is guarded and only the genuinely missing pieces are touched.
CREATE TYPE IF NOT EXISTS "adSlot" AS ENUM('sidebar', 'in-article', 'banner-top', 'banner-bottom');--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "ads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"slot" "adSlot" NOT NULL,
	"type" varchar(20) DEFAULT 'html' NOT NULL,
	"snippet" text,
	"metaTags" text,
	"adSenseClientId" varchar(50),
	"adSenseSlotId" varchar(50),
	"promoTitle" varchar(200),
	"promoDescription" text,
	"promoCtaText" varchar(50),
	"promoCtaLink" varchar(500),
	"promoImageUrl" text,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Admin-configured Razorpay key pair. The secret is read only on the server and
-- is deliberately excluded from the public `catalog.settings` payload.
ALTER TABLE "paymentSettings" ADD COLUMN IF NOT EXISTS "razorpayKeyId" varchar(100);--> statement-breakpoint
ALTER TABLE "paymentSettings" ADD COLUMN IF NOT EXISTS "razorpayKeySecret" varchar(100);