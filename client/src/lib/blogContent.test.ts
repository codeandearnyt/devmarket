import { describe, expect, it } from "vitest";
import type { BlogBlock } from "@/components/BlogBlocks";
import {
  articleSections,
  countWords,
  headingId,
  pickRelatedPosts,
  readingMinutes,
  splitBlocksIntoSections,
  splitMarkdownIntoSections,
} from "./blogContent";

describe("section splitting", () => {
  it("starts a section at every H2 and keeps H3 nested", () => {
    const sections = splitMarkdownIntoSections(
      ["Intro paragraph.", "## First", "Body.", "### Nested", "More.", "## Second", "Tail."].join("\n\n"),
    );
    expect(sections).toHaveLength(3);
    expect(sections[0].heading).toBeNull();
    expect(sections.map(section => section.heading)).toEqual([null, "First", "Second"]);
    expect(sections[1].markdown).toContain("### Nested");
  });

  it("keeps a post with no headings as a single section", () => {
    expect(splitMarkdownIntoSections("Just prose.")).toHaveLength(1);
  });

  it("splits block content on heading blocks", () => {
    const blocks: BlogBlock[] = [
      { type: "paragraph", text: "Intro" },
      { type: "heading", text: "One" },
      { type: "paragraph", text: "Body" },
      { type: "heading", text: "Two" },
      { type: "paragraph", text: "More" },
    ];
    const sections = splitBlocksIntoSections(blocks);
    expect(sections).toHaveLength(3);
    expect(sections.map(section => section.heading)).toEqual([null, "One", "Two"]);
  });

  it("prefers blocks over the markdown mirror", () => {
    const sections = articleSections({ content: "## Ignored", blocks: [{ type: "paragraph", text: "Real" }] });
    expect(sections).toHaveLength(1);
    expect(sections[0].kind).toBe("blocks");
  });
});

describe("reading time", () => {
  it("ignores code fences and markdown punctuation", () => {
    expect(countWords("```ts\nconst a = 1;\n```\nOne two three")).toBe(3);
  });

  it("never reports less than a minute", () => {
    expect(readingMinutes(splitMarkdownIntoSections("Short."))).toBe(1);
  });

  it("counts roughly two hundred words per minute", () => {
    const words = Array.from({ length: 400 }, () => "word").join(" ");
    expect(readingMinutes(splitMarkdownIntoSections(words))).toBe(2);
  });
});

describe("heading anchors", () => {
  it("produces stable url-safe ids", () => {
    expect(headingId("Pick boring infrastructure", "fallback")).toBe("pick-boring-infrastructure");
    expect(headingId("Ship it: fast & cheap", "fallback")).toBe("ship-it-fast-cheap");
  });

  it("falls back when a heading has no usable characters", () => {
    expect(headingId("!!!", "section-3")).toBe("section-3");
  });
});

describe("related posts", () => {
  const posts = [
    { slug: "current", title: "Now", category: "Engineering", tags: ["shipping"] },
    { slug: "same-category", title: "A", category: "Engineering", tags: [] },
    { slug: "shared-tag", title: "B", category: "Design", tags: ["shipping"] },
    { slug: "unrelated", title: "C", category: "Design", tags: ["type"] },
  ];

  it("excludes the current post and ranks by category then tags", () => {
    const related = pickRelatedPosts(posts, { slug: "current", category: "Engineering", tags: ["shipping"] }, 3);
    expect(related.map(post => post.slug)).toEqual(["same-category", "shared-tag", "unrelated"]);
  });
});