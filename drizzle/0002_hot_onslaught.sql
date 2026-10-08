ALTER TABLE "users" ADD COLUMN "username" varchar(40);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "firstName" varchar(80);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lastName" varchar(80);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "location" varchar(120);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "github" varchar(120);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "linkedin" varchar(160);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");