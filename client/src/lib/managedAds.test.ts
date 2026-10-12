import { describe, expect, it } from "vitest";
import {
  ADSENSE_PUSH,
  adsForSlot,
  buildAdSenseLoader,
  buildAdSenseUnit,
  managedHeadTags,
  managedMarkup,
  splitSnippet,
  type ManagedAd,
} from "./managedAds";

function ad(overrides: Partial<ManagedAd> = {}): ManagedAd {
  return {
    id: 1,
    name: "Sidebar unit",
    slot: "sidebar",
    type: "html",
    snippet: null,
    metaTags: null,
    adSenseClientId: "ca-pub-1234567890123456",
    adSenseSlotId: "9876543210",
    promoTitle: null,
    promoDescription: null,
    promoCtaText: null,
    promoCtaLink: null,
    promoImageUrl: null,
    sortOrder: 0,
    isActive: true,
    ...overrides,
  };
}

describe("buildAdSenseUnit", () => {
  it("emits an ins tag carrying both ids", () => {
    const unit = buildAdSenseUnit("ca-pub-abc", "12345");
    expect(unit).toContain('data-ad-client="ca-pub-abc"');
    expect(unit).toContain('data-ad-slot="12345"');
    expect(unit).toContain('class="adsbygoogle"');
  });

  it("returns nothing when either id is missing", () => {
    // A half-configured unit renders Google's "Invalid publisher ID" frame,
    // which is worse for the operator than showing no ad at all.
    expect(buildAdSenseUnit(null, "12345")).toBe("");
    expect(buildAdSenseUnit("ca-pub-abc", null)).toBe("");
    expect(buildAdSenseUnit("  ", "  ")).toBe("");
  });

  it("escapes quotes so an id cannot break out of the attribute", () => {
    const unit = buildAdSenseUnit('ca-pub-a" onload="alert(1)', "1");
    expect(unit).not.toContain('onload="alert(1)"');
    expect(unit).toContain("&quot;");
  });
});

describe("buildAdSenseLoader", () => {
  it("points the loader at the configured client", () => {
    expect(buildAdSenseLoader("ca-pub-abc")).toContain("client=ca-pub-abc");
    expect(buildAdSenseLoader("ca-pub-a b")).toContain("client=ca-pub-a%20b");
  });

  it("returns nothing without a client id", () => {
    expect(buildAdSenseLoader(null)).toBe("");
  });
});

describe("splitSnippet", () => {
  it("lifts script bodies out of the markup React renders", () => {
    // dangerouslySetInnerHTML does not execute scripts, so an AdSense unit
    // pasted as one blob would paint but never register with the runtime.
    const { html, scripts } = splitSnippet(
      `<ins class="adsbygoogle"></ins><script>window.a = 1;</script>`,
    );
    expect(html).toBe(`<ins class="adsbygoogle"></ins>`);
    expect(html).not.toContain("script");
    expect(scripts).toEqual(["window.a = 1;"]);
  });

  it("drops a body-less loader tag but keeps the ads push", () => {
    const { html, scripts } = splitSnippet(
      `<script src="https://x"></script><script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`,
    );
    // `<script src>` has no body: re-injecting it as an empty element would do
    // nothing, and the loader is handled separately via the client id.
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toContain("adsbygoogle");
    expect(html).toBe("");
  });

  it("tolerates multiline and attribute-laden scripts", () => {
    const { html, scripts } = splitSnippet(
      `<ins data-x="1"></ins>\n<script async crossorigin="anonymous">\n  a();\n</script>`,
    );
    expect(html).toContain("data-x");
    expect(scripts[0]).toBe("a();");
  });
});

describe("managedMarkup", () => {
  it("prefers an explicit snippet over the generated unit", () => {
    const markup = managedMarkup(ad({ snippet: "<b>custom</b>" }));
    expect(markup).toBe("<b>custom</b>");
  });

  it("generates the unit from the ids when no snippet is set", () => {
    expect(managedMarkup(ad())).toContain("adsbygoogle");
  });

  it("renders nothing for an internal promo", () => {
    // Internal promos are rendered as a card from discrete fields, never as
    // admin-supplied markup.
    expect(managedMarkup(ad({ type: "internal" }))).toBe("");
  });
});

describe("managedHeadTags", () => {
  it("de-duplicates the loader when several slots share a client", () => {
    const tags = managedHeadTags([ad({ id: 1 }), ad({ id: 2 }), ad({ id: 3 })]);
    expect(tags.filter(t => t.includes("pagead2")).length).toBe(1);
  });

  it("passes an explicit head snippet through", () => {
    const tags = managedHeadTags([ad({ metaTags: '<script id="x"></script>' })]);
    expect(tags).toContain('<script id="x"></script>');
  });

  it("returns nothing when no ad configures a client", () => {
    expect(managedHeadTags([ad({ adSenseClientId: null })])).toEqual([]);
  });
});

describe("adsForSlot", () => {
  const rows = [
    ad({ id: 1, slot: "sidebar", sortOrder: 2 }),
    ad({ id: 2, slot: "sidebar", sortOrder: 1 }),
    ad({ id: 3, slot: "in-article" }),
    ad({ id: 4, slot: "sidebar", sortOrder: 0, isActive: false }),
  ];

  it("keeps only the requested slot, active, in sort order", () => {
    expect(adsForSlot(rows, "sidebar").map(a => a.id)).toEqual([2, 1]);
  });

  it("falls back to an empty list for an empty or missing set", () => {
    expect(adsForSlot(rows, "banner-top")).toEqual([]);
    expect(adsForSlot(undefined, "sidebar")).toEqual([]);
  });

  it("never exposes an inactive ad to the storefront", () => {
    expect(adsForSlot(rows, "sidebar").some(a => a.id === 4)).toBe(false);
  });
});

describe("ADSENSE_PUSH", () => {
  it("queues the unit against the ads runtime idempotently", () => {
    // Runs in the browser where `window` exists; here we only pin the shape,
    // because the guard is what makes a re-run (React strict mode, a slot that
    // re-mounts) harmless.
    expect(ADSENSE_PUSH).toContain("window.adsbygoogle = window.adsbygoogle || []");
    expect(ADSENSE_PUSH).toContain("push({})");
  });
});