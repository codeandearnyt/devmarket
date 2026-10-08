ALTER TABLE "users" ADD COLUMN "firebaseUid" varchar(128);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "photoUrl" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_firebaseUid_unique" UNIQUE("firebaseUid");