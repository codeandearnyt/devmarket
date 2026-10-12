import { useEffect, useMemo, useRef } from "react";
import type { ManagedAd } from "@/lib/managedAds";
import { ADSENSE_PUSH, managedMarkup, splitSnippet } from "@/lib/managedAds";

/**
 * Render one admin-managed ad.
 *
 * Two paths:
 *  - `internal` → a house promo card. No admin HTML is rendered, so this is
 *    always safe.
 *  - `html`     → the admin's snippet. `dangerouslySetInnerHTML` paints the
 *    markup but does not run `<script>`, so any scripts inside the snippet are
 *    extracted and injected as real elements on mount. That is what lets a
 *    pasted AdSense unit actually register with the ads runtime.
 *
 * Scripts are injected into `<body>`, not in place, because AdSense's unit must
 * already exist in the DOM before the push runs.
 */
export default function ManagedAd({ ad, placement }: { ad: ManagedAd; placement: string }) {
  const scriptsRef = useRef<string[]>([]);

  const rendered = useMemo(() => {
    if (ad.type === "internal") return null;
    const markup = managedMarkup(ad);
    if (!markup) return null;
    const { html, scripts } = splitSnippet(markup);
    // The AdSense runtime needs the unit in the DOM before it is handed over,
    // so the push is appended after any script the admin wrote.
    scriptsRef.current = [...scripts, ADSENSE_PUSH];
    return html;
  }, [ad]);

  useEffect(() => {
    const bodies = scriptsRef.current;
    if (!rendered || !bodies.length) return;
    const nodes = bodies.map(body => {
      const element = document.createElement("script");
      element.text = body;
      return element;
    });
    const host = document.body;
    nodes.forEach(node => host.appendChild(node));
    return () => nodes.forEach(node => node.remove());
  }, [rendered]);

  if (ad.type === "internal") {
    const title = ad.promoTitle?.trim() || ad.name;
    const cta = ad.promoCtaText?.trim() || "Learn more";
    const href = ad.promoCtaLink?.trim() || "/";
    return (
      <aside
        aria-label={`Sponsored: ${ad.name}`}
        data-ad-placement={placement}
        className="not-prose my-12 min-h-[9rem] rounded-2xl border border-dashed border-[#b9d6db] bg-[#f8ffff] px-6 py-7"
      >
        <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#8a97b5]">Sponsored</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0 max-w-xl">
            <h3 className="font-display text-xl font-semibold tracking-[-.04em] text-[#172039]">{title}</h3>
            {ad.promoDescription ? <p className="mt-2 text-sm leading-6 text-[#53617d]">{ad.promoDescription}</p> : null}
          </div>
          <a href={href} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#172039] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#13b8b0]">
            {cta}
          </a>
        </div>
      </aside>
    );
  }

  if (!rendered) return null;

  return (
    <aside
      aria-label={`Advertisement: ${ad.name}`}
      data-ad-placement={placement}
      className="not-prose my-12 min-h-[9rem] overflow-hidden rounded-2xl border border-[#e2ecee] bg-[#f8ffff] px-4 py-5"
    >
      <p className="mb-3 font-mono text-[9px] uppercase tracking-[.2em] text-[#8a97b5]">Advertisement</p>
      <div dangerouslySetInnerHTML={{ __html: rendered }} />
    </aside>
  );
}

/** Sidebar variant — no vertical margins, and it fills the rail. */
export function ManagedSidebarAd({ ad }: { ad: ManagedAd }) {
  const scriptsRef = useRef<string[]>([]);

  const rendered = useMemo(() => {
    if (ad.type === "internal") return null;
    const markup = managedMarkup(ad);
    if (!markup) return null;
    const { html, scripts } = splitSnippet(markup);
    scriptsRef.current = [...scripts, ADSENSE_PUSH];
    return html;
  }, [ad]);

  useEffect(() => {
    const bodies = scriptsRef.current;
    if (!rendered || !bodies.length) return;
    const nodes = bodies.map(body => {
      const element = document.createElement("script");
      element.text = body;
      return element;
    });
    document.body.append(...nodes);
    return () => nodes.forEach(node => node.remove());
  }, [rendered]);

  if (ad.type === "internal") {
    return (
      <div data-ad-placement="sidebar" className="rounded-2xl border border-[#d7e8eb] bg-[#f8ffff] p-5">
        <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#8a97b5]">Sponsored</p>
        <h3 className="mt-3 font-display text-lg font-semibold leading-snug tracking-[-.03em] text-[#172039]">
          {ad.promoTitle?.trim() || ad.name}
        </h3>
        {ad.promoDescription ? <p className="mt-2 text-sm leading-6 text-[#53617d]">{ad.promoDescription}</p> : null}
        {ad.promoImageUrl ? <img src={ad.promoImageUrl} alt="" className="mt-4 w-full rounded-xl object-cover" /> : null}
        <a href={ad.promoCtaLink?.trim() || "/"} className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#172039] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#13b8b0]">
          {ad.promoCtaText?.trim() || "Learn more"}
        </a>
      </div>
    );
  }

  if (!rendered) return null;

  return (
    <div data-ad-placement="sidebar" className="overflow-hidden rounded-2xl border border-[#e2ecee] bg-[#f8ffff] p-4">
      <p className="mb-2 font-mono text-[9px] uppercase tracking-[.2em] text-[#8a97b5]">Advertisement</p>
      <div dangerouslySetInnerHTML={{ __html: rendered }} />
    </div>
  );
}