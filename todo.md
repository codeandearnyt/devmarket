# DevMarket feature tracker

## Completed

- [x] Production marketplace schema, authentication, catalog, orders, payment settings, and secure delivery.
- [x] Razorpay and manual QR payment flows with server-side verification and admin approval.
- [x] Realtime SSE updates for catalog, payment, order, and blog changes.
- [x] Aqua liquid-morphism visual system with centered auto-hiding pill navigation and mobile two-line trigger.
- [x] Nitin Sharma developer profile with supplied portrait and interactive portfolio.
- [x] Public About, Privacy, Terms, Contact, Journal, article, and developer pages.
- [x] SEO metadata, robots policy, dynamic sitemap, clean public routes, and route code splitting.
- [x] Catalog filtering by type, category, search, price range, and sort order.
- [x] Public Journal pagination, cover uploads, Markdown preview, local draft autosave, and admin Blog CMS CRUD.
- [x] Privacy-conscious analytics events for catalog filters and article views.
- [x] Verified product reviews with buyer-only submission and public product ratings.
- [x] Admin review moderation with publish/hide controls and realtime public invalidation.
- [x] Newsletter signup with duplicate-safe subscriber storage.
- [x] Admin Insights dashboard for revenue, article reach, product sales, filters, and subscribers.
- [x] Admin subscriber CSV export.
- [x] Two-option product pricing: Free ($0, unlocks without payment) or a custom amount, with "Free" shown everywhere a price appears.
- [x] Free claim flow: one-click unlock recorded as a `FREE`/`DELIVERED` order, idempotent for buyers who already own the product.
- [x] Product images from a URL or a browsed local file (stored inline), with a dedicated main image and a re-orderable preview gallery.
- [x] Reusable blog post template: two-column spread, automatic table of contents with scroll-spy, sticky sidebar, related reading, newsletter card and share actions.
- [x] Configurable in-article and sidebar placements that only land on section boundaries, are labelled as paid, rotate per page view and disappear when the inventory is empty.
- [x] Article metadata (description, canonical, Open Graph) applied per route and cleaned up on navigation.
- [x] Seed catalogue of ten Drive-hosted bundles across starter kits, full projects and AI prompt packs.

## Validation

- [x] Drizzle migrations generated and applied for blog, reviews, subscribers, and analytics tables.
- [x] TypeScript check passes.
- [x] Vitest suite passes: 29 tests across 8 files, including blog placement rules and section splitting.
- [x] Production build passes.
- [x] Live dev server is healthy with no current TypeScript/LSP errors.
- [x] Storefront, Journal, developer, product, and admin routes visually reviewed.
- [x] Final files and production artifacts verified before checkpointing.
- [x] Free pricing, free claim, URL and browsed product images verified end to end in the browser.
- [x] Blog template reviewed at desktop and mobile widths on a long article, a short article, a block-editor article and with placements disabled.
