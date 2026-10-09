-- Product types move from a Postgres enum to a table so the admin console can
-- add, rename and delete them without a migration. Existing rows keep working:
-- the old enum values are rewritten to the seeded slugs.
CREATE TABLE IF NOT EXISTS "productTypes" (
  "id" serial PRIMARY KEY,
  "name" varchar(120) NOT NULL,
  "slug" varchar(140) NOT NULL UNIQUE,
  "description" text,
  "createdAt" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
INSERT INTO "productTypes" ("name", "slug", "description") VALUES
  ('Source Code', 'source-code', 'Production-ready source code you can download and ship.'),
  ('AI Prompt', 'ai-prompt', 'Curated prompts and prompt packs for real workflows.'),
  ('Full Project', 'full-project', 'Complete projects with setup guides and included assets.')
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "type" TYPE varchar(64) USING "type"::text;--> statement-breakpoint
DROP TYPE IF EXISTS "type";--> statement-breakpoint
UPDATE "products" SET "type" = 'source-code' WHERE "type" = 'SOURCE_CODE';--> statement-breakpoint
UPDATE "products" SET "type" = 'ai-prompt' WHERE "type" = 'PROMPT';--> statement-breakpoint
UPDATE "products" SET "type" = 'full-project' WHERE "type" = 'PROJECT';--> statement-breakpoint
-- Blog posts gain a structured block list; `content` stays as the markdown
-- mirror so older posts and any markdown readers keep working.
ALTER TABLE "blogPosts" ADD COLUMN IF NOT EXISTS "blocks" jsonb;
