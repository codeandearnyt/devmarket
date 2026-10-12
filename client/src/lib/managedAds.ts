/**
 * Bridge between the admin-managed ad rows and the blog template.
 *
 * Placement rules still live in `blogAds.ts` — this module only decides *what*
 * fills a slot. Managed rows win; when a slot has no active row we fall back
 * to the hardcoded house inventory so the template never renders a gap.
 */

export type ManagedSlot = "sidebar" | "in-article" | "banner-top" | "banner-bottom";

/** Shape of an `ads` row as returned by `admin.activeAdsBySlot`. */
export type ManagedAd = {
  id: number;
  name: string;
  slot: string;
  /** `varchar` on the row, so the wire type is a plain string. */
  type: string;
  snippet: string | null;
  metaTags: string | null;
  adSenseClientId: string | null;
  adSenseSlotId: string | null;
  promoTitle: string | null;
  promoDescription: string | null;
  promoCtaText: string | null;
  promoCtaLink: string | null;
  promoImageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

export const MANAGED_SLOTS: ManagedSlot[] = ["sidebar", "in-article", "banner-top", "banner-bottom"];

/**
 * Build the AdSense unit markup from the stored ids.
 *
 * Returns an empty string when either id is missing — a half-configured unit
 * would render an "Invalid publisher ID" frame, which is worse than no ad.
 */
export function buildAdSenseUnit(clientId?: string | null, slotId?: string | null): string {
  const client = clientId?.trim();
  const slot = slotId?.trim();
  if (!client || !slot) return "";
  return [
    `<ins class="adsbygoogle" style="display:block"`,
    `     data-ad-client="${escapeAttr(client)}"`,
    `     data-ad-slot="${escapeAttr(slot)}"`,
    `     data-ad-format="auto"`,
    `     data-full-width-responsive="true"></ins>`,
  ].join("\n");
}

/** The loader AdSense expects once per page. */
export function buildAdSenseLoader(clientId?: string | null): string {
  const client = clientId?.trim();
  if (!client) return "";
  return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}" crossorigin="anonymous"></script>`;
}

/** The push call that hands the freshly rendered unit to the AdSense runtime. */
export const ADSENSE_PUSH = "window.adsbygoogle = window.adsbygoogle || []; window.adsbygoogle.push({});";

/** Markup that actually goes into the page for a managed ad row. */
export function managedMarkup(ad: ManagedAd): string {
  if (ad.type === "internal") return "";
  return ad.snippet?.trim() || buildAdSenseUnit(ad.adSenseClientId, ad.adSenseSlotId);
}

/**
 * Split a snippet into the markup React can render and the scripts that have to
 * be injected afterwards.
 *
 * `dangerouslySetInnerHTML` deliberately does not execute `<script>`, so an
 * AdSense unit pasted as one blob would render its `<ins>` but never register
 * with the ads runtime. Pulling the scripts out and appending them as real
 * elements is what makes pasted snippets behave like hand-written ones.
 */
export function splitSnippet(snippet: string): { html: string; scripts: string[] } {
  const scripts: string[] = [];
  const html = snippet.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (_match, body: string) => {
    // A body-less tag (`<script src=…>`) is a loader, not code. Re-injecting it
    // as an empty element does nothing, so drop it — external loaders belong
    // in `metaTags` / the client id, which `useAdSenseLoader` handles.
    const code = body.trim();
    if (code) scripts.push(code);
    return "";
  });
  return { html: html.trim(), scripts };
}

/**
 * Head-level tags (the `adsbygoogle.js` loader) for the active ads.
 *
 * De-duplicated by the loader URL: the same script may be configured on several
 * slots and the browser only needs it once.
 */
export function managedHeadTags(ads: ManagedAd[]): string[] {
  const tags = new Set<string>();
  for (const ad of ads) {
    const explicit = ad.metaTags?.trim();
    if (explicit) tags.add(explicit);
    const generated = buildAdSenseLoader(ad.adSenseClientId);
    if (generated) tags.add(generated);
  }
  return Array.from(tags);
}

/** Managed rows for one slot, in the order the console sorts them. */
export function adsForSlot(rows: ManagedAd[] | undefined, slot: ManagedSlot): ManagedAd[] {
  if (!rows?.length) return [];
  return rows.filter(ad => ad.slot === slot && ad.isActive).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}