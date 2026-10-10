import { Fragment, type RefObject, useMemo } from "react";
import { Streamdown } from "streamdown";
import { BlogBlocks } from "@/components/BlogBlocks";
import InArticleAd from "@/components/blog/InArticleAd";
import { inArticleSlots, type AdCreative } from "@/lib/blogAds";
import type { ArticleSection } from "@/lib/blogContent";

/**
 * Article body.
 *
 * Content is rendered section by section and a placement is inserted only on a
 * boundary between two complete sections. Because the placement is a sibling of
 * the sections — never a child of a paragraph, list, quote or code block — it
 * can never break prose formatting, and a short article simply renders with no
 * placement at all.
 */
export default function BlogPostContent({
  sections,
  words,
  ads,
  contentRef,
}: {
  sections: ArticleSection[];
  words: number;
  ads: AdCreative[];
  contentRef: RefObject<HTMLElement | null>;
}) {
  const placements = useMemo(() => {
    const slots = inArticleSlots(sections.length, words);
    const map = new Map<number, AdCreative>();
    slots.forEach((sectionIndex, position) => {
      const creative = ads[position];
      if (creative) map.set(sectionIndex, creative);
    });
    return map;
  }, [sections.length, words, ads]);

  return (
    <article
      ref={contentRef}
      className="prose prose-lg max-w-none text-[#53617d] prose-headings:scroll-mt-32 prose-headings:font-display prose-headings:text-[#172039] prose-headings:tracking-[-.04em] prose-a:text-[#13b8b0]"
    >
      {sections.map((section, index) => (
        <Fragment key={index}>
          {section.kind === "blocks" ? (
            <BlogBlocks blocks={section.blocks} />
          ) : (
            <Streamdown>{section.markdown}</Streamdown>
          )}
          {placements.has(index) ? <InArticleAd creative={placements.get(index)} /> : null}
        </Fragment>
      ))}
    </article>
  );
}