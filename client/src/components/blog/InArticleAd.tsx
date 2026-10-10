import type { AdCreative } from "@/lib/blogAds";

/**
 * In-article placement.
 *
 * This is only ever rendered between two complete content sections — never
 * inside a paragraph, list, quote or code block, and never directly under the
 * headline. A reserved min-height keeps the surrounding text from jumping as
 * the card paints.
 */
export default function InArticleAd({ creative }: { creative?: AdCreative }) {
  if (!creative) return null;

  return (
    <aside
      aria-label={creative.label}
      data-ad-placement="in-article"
      className="not-prose my-12 min-h-[11rem] rounded-2xl border border-dashed border-[#b9d6db] bg-[#f8ffff] px-6 py-7"
    >
      <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#8a97b5]">{creative.label}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0 max-w-xl">
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#13b8b0]">{creative.eyebrow}</p>
          <h3 className="mt-2 font-display text-xl font-semibold tracking-[-.04em] text-[#172039]">{creative.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#53617d]">{creative.description}</p>
        </div>
        <a
          href={creative.href}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#172039] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#13b8b0]"
        >
          {creative.ctaLabel}
        </a>
      </div>
    </aside>
  );
}