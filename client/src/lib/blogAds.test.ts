import { describe, expect, it } from "vitest";
import { adConfig, inArticleSlots, rotateCreatives } from "./blogAds";

describe("in-article placement rules", () => {
  it("places nothing in a short article", () => {
    expect(inArticleSlots(8, 200)).toEqual([]);
  });

  it("places nothing when the article has too few sections", () => {
    expect(inArticleSlots(2, 5000)).toEqual([]);
  });

  it("never places before the third section or after the last one", () => {
    const slots = inArticleSlots(6, 4000);
    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) {
      expect(slot).toBeGreaterThanOrEqual(adConfig.inArticle.firstAdAfterSection - 1);
      expect(slot).toBeLessThanOrEqual(4); // sectionCount - 2
    }
  });

  it("keeps whole sections between two placements", () => {
    const slots = inArticleSlots(12, 9000);
    for (let index = 1; index < slots.length; index += 1) {
      expect(slots[index] - slots[index - 1]).toBeGreaterThan(adConfig.inArticle.minSectionsBetweenAds);
    }
  });

  it("scales the number of placements with the article length", () => {
    const short = inArticleSlots(12, 900);
    const long = inArticleSlots(12, 8000);
    expect(short.length).toBeLessThan(long.length);
    expect(long.length).toBeLessThanOrEqual(adConfig.inArticle.maxAds);
  });
});

describe("creative rotation", () => {
  it("returns the same selection for the same page-view seed", () => {
    const first = rotateCreatives("sidebar", 1, 42).map(creative => creative.id);
    const again = rotateCreatives("sidebar", 1, 42).map(creative => creative.id);
    expect(again).toEqual(first);
  });

  it("only returns creatives for the requested placement", () => {
    const sidebar = rotateCreatives("sidebar", 3, 7);
    const inArticle = rotateCreatives("in-article", 3, 7);
    expect(sidebar.every(creative => creative.slot === "sidebar")).toBe(true);
    expect(inArticle.every(creative => creative.slot === "in-article")).toBe(true);
  });

  it("never repeats a creative within one page view", () => {
    const picked = rotateCreatives("in-article", 3, 99);
    expect(new Set(picked.map(creative => creative.id)).size).toBe(picked.length);
  });
});