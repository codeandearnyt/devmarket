import { useEffect, useMemo, type ReactNode, type RefObject } from "react";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogTableOfContents from "@/components/blog/BlogTableOfContents";
import ManagedAd, { ManagedSidebarAd } from "@/components/blog/ManagedAd";
import NewsletterCard from "@/components/blog/NewsletterCard";
import RelatedPosts from "@/components/blog/RelatedPosts";
import SponsoredToolCard from "@/components/blog/SponsoredToolCard";
import { adConfig, rotateCreatives, type AdCreative } from "@/lib/blogAds";
import type { ManagedAd as ManagedAdRow } from "@/lib/managedAds";
import { useManagedAds } from "@/hooks/useManagedAds";

/**
 * Shared blog post template.
 *
 * One two-column grid: the article on the left, a sticky sidebar on the right.
 * Below the large breakpoint the grid stacks, the contents collapse under the
 * header, and the sidebar widgets follow the article. Each slot renders nothing
 * when it has nothing to show, so a short article simply produces a shorter
 * page rather than empty furniture.
 *
 * Inventory resolution, in order:
 *  1. Admin-managed rows for the slot (the Ads console). These can be AdSense
 *     units or house promos and they replace the built-in creative entirely.
 *  2. The hardcoded house inventory in `lib/blogAds`, so an article is never
 *     left with a visibly empty slot just because the console is empty.
 */
export default function BlogPostLayout({
  slug,
  version,
  seed,
  contentRef,
  showNewsletter = true,
  header,
  content,
  footer,
}: {
  slug: string;
  /** Changes whenever the rendered article changes, to rebuild the contents. */
  version: string | number;
  /** Fixed for one page view, so the rotation is stable while the reader scrolls. */
  seed: number;
  contentRef: RefObject<HTMLElement | null>;
  showNewsletter?: boolean;
  header: ReactNode;
  /**
   * Renders the body. Receives the built-in creatives chosen for this page view
   * plus any admin-managed units for the `in-article` slot; `BlogPostContent`
   * interleaves them on the same section boundaries.
   */
  content: (ads: AdCreative[], managedAds: ManagedAdRow[]) => ReactNode;
  footer: ReactNode;
}) {
  const managed = useManagedAds();

  const managedSidebar = managed.sidebar;
  const managedInArticle = managed.inArticle;

  const sidebarAd = useMemo(
    () => (managedSidebar.length ? undefined : rotateCreatives("sidebar", adConfig.sidebar.maxSlots, seed)[0]),
    [seed, managedSidebar.length],
  );
  const inArticleAds = useMemo(
    () => (managedInArticle.length ? [] : rotateCreatives("in-article", adConfig.inArticle.maxAds, seed)),
    [seed, managedInArticle.length],
  );

  // Managed in-article units take the earliest boundaries; `BlogPostContent`
  // owns the section math and fills any remaining position with a house
  // creative, so both inventories follow the same editorial rules.
  const managedPlacements = managedInArticle;

  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-24 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_296px] lg:gap-14">
        {/* The reading surface keeps body copy legible over the ambient scene
            behind it, while the sidebar stays on the page background. */}
        <div className="glass-surface min-w-0 rounded-[2rem] px-5 py-8 md:px-10 md:py-11">
          {header}
          <BlogTableOfContents containerRef={contentRef} version={version} variant="collapsible" />
          <div className="mt-10">{content(inArticleAds, managedPlacements)}</div>
          {footer}
        </div>

        <BlogSidebar>
          <BlogTableOfContents containerRef={contentRef} version={version} variant="sidebar" />
          {managedSidebar[0] ? <ManagedSidebarAd ad={managedSidebar[0]} /> : <SponsoredToolCard creative={sidebarAd} />}
          <RelatedPosts slug={slug} />
          {showNewsletter ? <NewsletterCard /> : null}
        </BlogSidebar>
      </div>
    </div>
  );
}