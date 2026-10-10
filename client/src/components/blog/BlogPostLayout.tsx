import { useMemo, type ReactNode, type RefObject } from "react";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogTableOfContents from "@/components/blog/BlogTableOfContents";
import NewsletterCard from "@/components/blog/NewsletterCard";
import RelatedPosts from "@/components/blog/RelatedPosts";
import SponsoredToolCard from "@/components/blog/SponsoredToolCard";
import { adConfig, rotateCreatives, type AdCreative } from "@/lib/blogAds";

/**
 * Shared blog post template.
 *
 * One two-column grid: the article on the left, a sticky sidebar on the right.
 * Below the large breakpoint the grid stacks, the contents collapse under the
 * header, and the sidebar widgets follow the article. Each slot renders nothing
 * when it has nothing to show, so a short article simply produces a shorter
 * page rather than empty furniture.
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
  /** Receives the creatives chosen for this page view and renders the body. */
  content: (ads: AdCreative[]) => ReactNode;
  footer: ReactNode;
}) {
  const sidebarAd = useMemo(
    () => rotateCreatives("sidebar", adConfig.sidebar.maxSlots, seed)[0],
    [seed],
  );
  const inArticleAds = useMemo(
    () => rotateCreatives("in-article", adConfig.inArticle.maxAds, seed),
    [seed],
  );

  return (
    <div className="mx-auto max-w-[1180px] px-5 pb-24 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_296px] lg:gap-14">
        {/* The reading surface keeps body copy legible over the ambient scene
            behind it, while the sidebar stays on the page background. */}
        <div className="glass-surface min-w-0 rounded-[2rem] px-5 py-8 md:px-10 md:py-11">
          {header}
          <BlogTableOfContents containerRef={contentRef} version={version} variant="collapsible" />
          <div className="mt-10">{content(inArticleAds)}</div>
          {footer}
        </div>

        <BlogSidebar>
          <BlogTableOfContents containerRef={contentRef} version={version} variant="sidebar" />
          <SponsoredToolCard creative={sidebarAd} />
          <RelatedPosts slug={slug} />
          {showNewsletter ? <NewsletterCard /> : null}
        </BlogSidebar>
      </div>
    </div>
  );
}