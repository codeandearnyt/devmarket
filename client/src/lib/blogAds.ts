/**
 * Advertising and promotion configuration for blog posts.
 *
 * Every placement in the template reads from this file, so switching inventory
 * (house promotions today, a network feed later) is a data change rather than a
 * code change. Placement rules live here too: ads may only ever land on a
 * section boundary, never next to the headline, never inside prose, and never
 * twice in quick succession.
 */
export type AdSlot = "sidebar" | "in-article";

export type AdCreative = {
  id: string;
  slot: AdSlot;
  /** Rendered verbatim so paid placement is always distinguishable from editorial. */
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
};

export const adConfig = {
  enabled: true,
  sidebar: {
    maxSlots: 1,
  },
  inArticle: {
    /** Below this many words an article carries no in-article placement at all. */
    minWords: 450,
    /** Never place before the third complete section has been read. */
    firstAdAfterSection: 3,
    /** Complete sections required between two placements. */
    minSectionsBetweenAds: 2,
    /** Hard ceiling per article, regardless of length. */
    maxAds: 3,
    /** Length scaling: one placement per this many words. */
    wordsPerAd: 700,
  },
} as const;

/** House inventory. Swap these entries for network creatives when one exists. */
export const adInventory: AdCreative[] = [
  {
    id: "devmarket-library",
    slot: "sidebar",
    label: "Sponsored",
    eyebrow: "DevMarket library",
    title: "Ship the boring parts for free.",
    description: "Starter kits, prompts and full projects built by developers who already made the mistakes.",
    ctaLabel: "Browse the library",
    href: "/",
  },
  {
    id: "devmarket-starter-kit",
    slot: "in-article",
    label: "Advertisement",
    eyebrow: "Sponsored by DevMarket",
    title: "A production Next.js starter that already has auth, billing and admin.",
    description: "One zip, one afternoon, and every boring decision already made.",
    ctaLabel: "See what is inside",
    href: "/",
  },
  {
    id: "devmarket-prompts",
    slot: "in-article",
    label: "Advertisement",
    eyebrow: "Sponsored by DevMarket",
    title: "Prompt packs for teams that actually ship.",
    description: "Reviewed, versioned prompts for planning, review and debugging.",
    ctaLabel: "Open the prompt packs",
    href: "/",
  },
];

/** Small deterministic PRNG so a seed always yields the same rotation. */
function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Choose the creatives for one page view. The caller passes a seed it generates
 * once per mount, so the selection is stable while the reader scrolls and
 * rotates the next time the page is opened.
 */
export function rotateCreatives(slot: AdSlot, count: number, seed: number): AdCreative[] {
  if (!adConfig.enabled || count <= 0) return [];
  const eligible = adInventory.filter(creative => creative.slot === slot);
  if (!eligible.length) return [];

  const random = mulberry32(seed ^ (slot === "sidebar" ? 0x9e3779b9 : 0x85ebca6b));
  const shuffled = [...eligible];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled.slice(0, count);
}

/**
 * Section indexes after which an in-article placement is allowed.
 *
 * Rules: nothing before the third section, nothing after the final section
 * (the article ending stays clean), a minimum number of whole sections between
 * placements, and a length-scaled cap. Returns indexes into the section list.
 */
export function inArticleSlots(sectionCount: number, words: number): number[] {
  const rules = adConfig.inArticle;
  if (!adConfig.enabled || sectionCount < 3 || words < rules.minWords) return [];

  const cap = Math.min(rules.maxAds, Math.floor(words / rules.wordsPerAd));
  if (cap <= 0) return [];

  const slots: number[] = [];
  let lastSlot = -Infinity;
  const firstIndex = Math.max(0, rules.firstAdAfterSection - 1);

  for (let index = firstIndex; index <= sectionCount - 2; index += 1) {
    if (slots.length >= cap) break;
    if (index - lastSlot <= rules.minSectionsBetweenAds) continue;
    slots.push(index);
    lastSlot = index;
  }

  return slots;
}