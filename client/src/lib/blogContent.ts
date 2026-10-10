import type { BlogBlock } from "@/components/BlogBlocks";

/**
 * Article content helpers shared by the blog post template.
 *
 * A post arrives either as structured blocks (what the block editor writes) or
 * as a markdown mirror for older posts. Both are normalised into *sections* so
 * the layout, the table of contents and the in-article ad placement all reason
 * about the same structure: an ad can only ever sit on a section boundary.
 */
export type ArticleSection =
  | { kind: "blocks"; heading: string | null; blocks: BlogBlock[] }
  | { kind: "markdown"; heading: string | null; markdown: string };

export type ArticleLike = {
  content?: string | null;
  blocks?: unknown;
};

/** True when a post carries structured blocks rather than legacy markdown. */
export function hasArticleBlocks(blocks: unknown): blocks is BlogBlock[] {
  return Array.isArray(blocks) && blocks.length > 0;
}

/** Split block content so every H2 heading block starts a new section. */
export function splitBlocksIntoSections(blocks: BlogBlock[]): ArticleSection[] {
  const sections: ArticleSection[] = [];
  let current: BlogBlock[] = [];
  let heading: string | null = null;

  for (const block of blocks) {
    if (block.type === "heading") {
      if (current.length) sections.push({ kind: "blocks", heading, blocks: current });
      current = [];
      heading = block.text;
    }
    current.push(block);
  }
  if (current.length) sections.push({ kind: "blocks", heading, blocks: current });

  return sections;
}

/** Split markdown so every `## ` line starts a new section (`###` stays nested). */
export function splitMarkdownIntoSections(content: string): ArticleSection[] {
  const sections: ArticleSection[] = [];
  let buffer: string[] = [];
  let heading: string | null = null;

  const flush = () => {
    const markdown = buffer.join("\n").trim();
    if (markdown) sections.push({ kind: "markdown", heading, markdown });
    heading = null;
    buffer = [];
  };

  for (const line of content.split(/\r?\n/)) {
    const match = /^##(?!#)\s+(.*)$/.exec(line.trim());
    if (match) {
      flush();
      heading = match[1].trim();
      buffer.push(line);
      continue;
    }
    buffer.push(line);
  }
  flush();

  return sections;
}

export function articleSections(article: ArticleLike): ArticleSection[] {
  if (hasArticleBlocks(article.blocks)) return splitBlocksIntoSections(article.blocks);
  return splitMarkdownIntoSections(article.content ?? "");
}

/** Strip markdown syntax so a word count reflects prose, not punctuation. */
export function countWords(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~\-|]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

export function sectionText(section: ArticleSection) {
  return section.kind === "blocks"
    ? section.blocks.map(block => ("text" in block ? block.text : "")).join(" ")
    : section.markdown;
}

export function articleWordCount(sections: ArticleSection[]) {
  return sections.reduce((total, section) => total + countWords(sectionText(section)), 0);
}

/** Reading time in whole minutes, floored at one. */
export function readingMinutes(sections: ArticleSection[]) {
  return Math.max(1, Math.round(articleWordCount(sections) / 200));
}

/** Stable, URL-safe anchor id for a heading. */
export function headingId(text: string, fallback: string) {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
  return slug || fallback;
}

export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type RelatedCandidate = {
  slug: string;
  title: string;
  category: string;
  tags?: string[] | null;
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
};

/**
 * Rank other posts for the sidebar: same category first, then shared tags,
 * then recency. The current post is always excluded.
 */
export function pickRelatedPosts<T extends RelatedCandidate>(
  posts: T[],
  current: { slug: string; category?: string; tags?: string[] | null },
  limit = 4,
): T[] {
  const tags = (current.tags ?? []).map(tag => tag.toLowerCase());
  return posts
    .filter(post => post.slug !== current.slug)
    .map(post => {
      const overlap = (post.tags ?? []).filter(tag => tags.includes(tag.toLowerCase())).length;
      const sameCategory = post.category && post.category === current.category ? 3 : 0;
      const recency = post.publishedAt ?? post.createdAt ? new Date(post.publishedAt ?? post.createdAt!).getTime() : 0;
      return { post, score: sameCategory + overlap, recency };
    })
    .sort((a, b) => b.score - a.score || b.recency - a.recency)
    .slice(0, limit)
    .map(entry => entry.post);
}