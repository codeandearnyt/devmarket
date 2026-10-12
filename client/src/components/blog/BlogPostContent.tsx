import { Fragment, type RefObject, useMemo } from "react";
import { Streamdown } from "streamdown";
import { BlogBlocks } from "@/components/BlogBlocks";
import InArticleAd from "@/components/blog/InArticleAd";
import ManagedAd from "@/components/blog/ManagedAd";
import { inArticleSlots, type AdCreative } from "@/lib/blogAds";
import type { ManagedAd as ManagedAdRow } from "@/lib/managedAds";
import type { ArticleSection } from "@/lib/blogContent";

/**
 * Article body.
 *
 * Content is rendered section by section and a placement is inserted only on a
 * boundary between two complete sections. Because the placement is a sibling of
 * the sections — never a child of a paragraph, list, quote or code block — it
 * can never break prose formatting, and a short article simply renders with no
 * placement at all.
 *
 * Both inventories obey the same boundaries. `managedAds` (from the admin Ads
 * console) takes precedence; the built-in house creatives fill any remaining
 * position. That keeps the editorial placement rules — never after the first
 * two sections, never on the final section, minimum spacing — applying
 * identically no matter where the inventory came from.
 */
export default function BlogPostContent({
  sections,
  words,
  ads,
  managedAds = [],
  contentRef,
}: {
  sections: ArticleSection[];
  words: number;
  ads: AdCreative[];
  /** Admin-managed units for the `in-article` slot, already sorted. */
  managedAds?: ManagedAdRow[];
  contentRef: RefObject<HTMLElement | null>;
}) {
  const placements = useMemo(() => {
    const slots = inArticleSlots(sections.length, words);
    const map = new Map<number, AdCreative | ManagedAdRow>();
    slots.forEach((sectionIndex, position) => {
      // Managed units win the earliest boundaries; house creatives fill the rest.
      const managed = managedAds[position];
      const house = ads[Math.max(0, position - managedAds.length)];
      const chosen = managed ?? house;
      if (chosen) map.set(sectionIndex, chosen);
    });
    return map;
  }, [sections.length, words, ads, managedAds]);

  return (
    <article
      ref={contentRef}
      className="prose prose-lg max-w-none text-[#53617d] prose-headings:scroll-mt-32 prose-headings:font-display prose-headings:text-[#172039] prose-headings:tracking-[-.04em] prose-a:text-[#13b8b0]"
    >
      {sections.map((section, index) => {
        const placement = placements.get(index);
        return (
          <Fragment key={index}>
            {section.kind === "blocks" ? (
              <BlogBlocks blocks={section.blocks} />
            ) : (
              <Streamdown>{section.markdown}</Streamdown>
            )}
            {placement ? (
              isManaged(placement)
                ? <ManagedAd ad={placement} placement="in-article" />
                : <InArticleAd creative={placement} />
            ) : null}
          </Fragment>
        );
      })}
    </article>
  );
}

/** A managed row has no `ctaLabel`/`href`; the house creative always does. */
function isManaged(value: AdCreative | ManagedAdRow): value is ManagedAdRow {
  return typeof (value as ManagedAdRow).type === "string";
}