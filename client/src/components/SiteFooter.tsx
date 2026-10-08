import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import DevMarketIcon from "@/assets/dev-market-icon.png";

const primaryLinks = [
  ["Explore", "/#explore"],
  ["How it works", "/#how-it-works"],
  ["Blog", "/blog"],
  ["Developer", "/developer"],
] as const;

const trustLinks = [
  ["About", "/about"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Contact", "/contact"],
] as const;

export default function SiteFooter() {
  return <footer className="site-footer relative z-10 border-t border-[#d7e8eb] px-5 py-12 lg:px-8 lg:py-16">
    <div className="mx-auto max-w-[1280px]">
      <div className="grid gap-10 md:grid-cols-[1.25fr_.75fr_.75fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3" aria-label="DevMarket home">
            <img src={DevMarketIcon} alt="DevMarket" className="h-10 w-10 rounded-xl object-contain" />
            <span className="font-display text-2xl font-bold tracking-[-.06em]">dev<span className="text-[#13b8b0]">market</span></span>
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-7 text-[#53617d]">Production-ready code, high-signal AI prompts, and practical ideas for people who build.</p>
          <Link href="/login" className="sweep-button mt-6 inline-flex items-center gap-2"><span>Start building</span><ArrowUpRight size={15} /></Link>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#13b8b0]">Explore</p>
          <nav className="mt-5 flex flex-col items-start gap-3 text-sm text-[#53617d]">{primaryLinks.map(([label, href]) => href.includes("#") ? <a key={href} href={href} className="footer-link">{label}</a> : <Link key={href} href={href} className="footer-link">{label}</Link>)}</nav>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#13b8b0]">Trust & support</p>
          <nav className="mt-5 flex flex-col items-start gap-3 text-sm text-[#53617d]">{trustLinks.map(([label, href]) => <Link key={href} href={href} className="footer-link">{label}</Link>)}</nav>
        </div>
      </div>
      <div className="mt-12 flex flex-col justify-between gap-3 border-t border-[#d7e8eb] pt-5 text-xs text-[#71809f] sm:flex-row"><span>© 2026 DevMarket Labs</span><span className="font-mono uppercase tracking-[.12em]">Useful work. Clear expectations.</span></div>
    </div>
  </footer>;
}
