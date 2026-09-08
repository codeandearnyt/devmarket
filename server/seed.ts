/**
 * Deliberately disabled in production. Real catalog, administrator, payment,
 * and product records must be created through the secured admin workflow.
 *
 * The old demo fixtures were removed so `pnpm seed` can never silently create
 * placeholder marketplace data.
 */
if (process.env.SEED_DEMO_DATA === "true") {
  console.error("Demo fixture seeding is intentionally unavailable in this production build.");
  process.exit(1);
}

console.log("No seed data inserted. Configure real catalog and payment settings through the admin workflow.");
