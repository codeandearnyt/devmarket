import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import type { AdCreative } from "@/lib/blogAds";

/**
 * Sponsored placement for the sidebar. Deliberately quiet: a hairline border,
 * a small label, and no imagery competing with the article. Renders nothing
 * when no eligible creative exists.
 */
export default function SponsoredToolCard({ creative }: { creative?: AdCreative }) {
  if (!creative) return null;

  return (
    <aside
      aria-label={creative.label}
      data-ad-placement="sidebar"
      className="min-h-[15rem] rounded-2xl border border-[#d7e8eb] bg-[#f8ffff] p-5"
    >
      <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#8a97b5]">{creative.label}</p>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[.16em] text-[#13b8b0]">{creative.eyebrow}</p>
      <h3 className="mt-2 font-display text-lg font-semibold leading-tight tracking-[-.03em] text-[#172039]">{creative.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#53617d]">{creative.description}</p>
      <Link
        href={creative.href}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#172039] transition hover:text-[#13b8b0]"
      >
        {creative.ctaLabel} <ArrowUpRight size={14} />
      </Link>
    </aside>
  );
}