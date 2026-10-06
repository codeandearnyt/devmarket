CREATE TYPE "role" AS ENUM ('user', 'admin');
--> statement-breakpoint
CREATE TYPE "type" AS ENUM ('SOURCE_CODE', 'PROMPT', 'PROJECT');
--> statement-breakpoint
CREATE TYPE "paymentMethod" AS ENUM ('RAZORPAY', 'MANUAL_QR');
--> statement-breakpoint
CREATE TYPE "orderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REJECTED', 'DELIVERED');
--> statement-breakpoint
CREATE TYPE "status" AS ENUM ('DRAFT', 'PUBLISHED');
--> statement-breakpoint
CREATE TABLE "analyticsEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"eventType" varchar(64) NOT NULL,
	"userId" integer,
	"sessionId" varchar(64),
	"payload" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blogPosts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(220) NOT NULL,
	"slug" varchar(240) NOT NULL,
	"excerpt" varchar(320) NOT NULL,
	"content" text NOT NULL,
	"coverImageUrl" text,
	"category" varchar(120) NOT NULL,
	"tags" jsonb,
	"authorName" varchar(160) NOT NULL,
	"status" "status" DEFAULT 'DRAFT' NOT NULL,
	"publishedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blogPosts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderNumber" varchar(40) NOT NULL,
	"userId" integer NOT NULL,
	"productId" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"paymentMethod" "paymentMethod" NOT NULL,
	"status" "orderStatus" DEFAULT 'PENDING' NOT NULL,
	"razorpayOrderId" varchar(100),
	"razorpayPaymentId" varchar(100),
	"razorpaySignature" varchar(180),
	"qrScreenshotUrl" text,
	"manualPaymentNote" varchar(120),
	"adminReviewedBy" integer,
	"adminReviewedAt" timestamp,
	"adminRejectionReason" text,
	"deliveredAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_orderNumber_unique" UNIQUE("orderNumber")
);
--> statement-breakpoint
CREATE TABLE "paymentSettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"qrCodeImageUrl" text,
	"upiId" varchar(160),
	"payeeName" varchar(160),
	"isRazorpayEnabled" boolean DEFAULT true NOT NULL,
	"isManualQrEnabled" boolean DEFAULT true NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(220) NOT NULL,
	"slug" varchar(240) NOT NULL,
	"description" text NOT NULL,
	"shortDescription" varchar(320) NOT NULL,
	"type" "type" NOT NULL,
	"categoryId" integer NOT NULL,
	"price" integer NOT NULL,
	"discountPrice" integer,
	"thumbnailUrl" text NOT NULL,
	"previewImages" jsonb,
	"demoUrl" text,
	"techStack" jsonb,
	"fileUrl" text NOT NULL,
	"isPublished" boolean DEFAULT true NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"salesCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer NOT NULL,
	"userId" integer NOT NULL,
	"rating" integer NOT NULL,
	"review" text NOT NULL,
	"adminReply" text,
	"repliedAt" timestamp,
	"isApproved" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"source" varchar(64) DEFAULT 'journal' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"passwordHash" text,
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"isDisabled" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
