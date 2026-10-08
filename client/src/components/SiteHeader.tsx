import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import DevMarketIcon from "@/assets/dev-market-icon.png";
import HeaderAvatar from "@/components/HeaderAvatar";

/**
 * The single source of truth for the top navigation bar.
 *
 * Every route renders the same header, so the DevMarket logo, the back link and
 * the circular avatar can never drift apart between pages. `linkLabel` is the
 * only per-page variation.
 */
export default function SiteHeader({ linkLabel = "Back to marketplace", linkHref = "/" }: { linkLabel?: string; linkHref?: string }) {
  return (
    <header className="site-header">
      <div className="site-nav-pill mx-auto flex max-w-[1080px] items-center justify-between px-4 py-3 lg:px-5">
        <Link href="/" className="flex items-center gap-3" aria-label="DevMarket home">
          <img src={DevMarketIcon} alt="DevMarket" className="h-9 w-9 rounded-lg object-contain" />
          <span className="font-display text-xl font-bold tracking-[-.05em]">dev<span className="text-[#13b8b0]">market</span></span>
        </Link>
        <Link href={linkHref} className="inline-flex items-center gap-2 text-sm font-semibold text-[#53617d] transition hover:text-[#13b8b0]">
          <ArrowLeft size={15} /> {linkLabel}
        </Link>
        <HeaderAvatar />
      </div>
    </header>
  );
}