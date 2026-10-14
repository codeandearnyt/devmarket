import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import DevMarketIcon from "@/assets/dev-market-icon.png";

/**
 * The site footer, shared by every route.
 *
 * The layout follows the grid-container pattern: a short statement column on the
 * left, then nav columns set out on a 12-column grid, then an oversized wordmark
 * that runs off both edges of the content column and closes the page. The word
 * is decorative — the accessible name of the footer comes from the logo link, so
 * the big text is hidden from assistive technology rather than read out as a
 * second, redundant "DevMarket".
 */

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

const accountLinks = [
  ["Start building", "/login"],
  ["My library", "/dashboard"],
  ["Developer profile", "/developer"],
] as const;

export default function SiteFooter() {
  return (
    <footer className="site-footer relative z-10 overflow-hidden border-t border-[#d7e8eb] bg-[#eef8fa]">
      <div className="mx-auto max-w-[1280px] px-5 pb-8 pt-14 lg:px-8 lg:pt-20">
        <div className="grid-container grid gap-10 md:grid-cols-12 md:gap-8">
          {/* Column budget across 12: statement 1-3, a gap at 4, then four nav columns
            at 5-6, 7-8, 9-10 and 11-12. The statement column was col-span-4 at
            first, which pushed the last nav column to 12-13 and wrapped it onto
            a row of its own. */}
          <div className="md:col-span-3">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="DevMarket home">
              <img src={DevMarketIcon} alt="" className="h-10 w-10 rounded-xl object-contain" />
              <span className="font-display text-2xl font-bold tracking-[-.06em]">
                dev<span className="text-[#13b8b0]">market</span>
              </span>
            </Link>
            <p className="mt-6 max-w-sm font-display text-2xl font-semibold leading-[.95] tracking-[-.05em] text-[#172039]">
              Useful work. Clear expectations.
            </p>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#53617d]">
              Production-ready code, high-signal AI prompts, and practical ideas for people who build.
            </p>
            <Link
              href="/login"
              className="sweep-button mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#172039] px-5 py-2.5 text-sm font-semibold text-white"
            >
              <span>Start building</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {/* nav columns */}
          <div className="md:col-span-2 md:col-start-5">
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#13b8b0]">Explore</p>
            <nav className="mt-5 flex flex-col items-start gap-3 text-sm text-[#53617d]">
              {primaryLinks.map(([label, href]) =>
                href.includes("#") ? (
                  <a key={href} href={href} className="footer-link">
                    {label}
                  </a>
                ) : (
                  <Link key={href} href={href} className="footer-link">
                    {label}
                  </Link>
                ),
              )}
            </nav>
          </div>

          <div className="md:col-span-2">
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#13b8b0]">Account</p>
            <nav className="mt-5 flex flex-col items-start gap-3 text-sm text-[#53617d]">
              {accountLinks.map(([label, href]) => (
                <Link key={href} href={href} className="footer-link">
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="md:col-span-2">
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#13b8b0]">Trust &amp; support</p>
            <nav className="mt-5 flex flex-col items-start gap-3 text-sm text-[#53617d]">
              {trustLinks.map(([label, href]) => (
                <Link key={href} href={href} className="footer-link">
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* contact */}
          <div className="md:col-span-2">
            <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#13b8b0]">Say hello</p>
            <a href="mailto:nitinxengg@gmail.com" className="footer-link mt-5 inline-block text-sm">
              nitinxengg@gmail.com
            </a>
            <p className="mt-3 text-sm leading-6 text-[#53617d]">Open to internships, freelance builds and collaborations.</p>
          </div>
        </div>
      </div>

      {/*
        The oversized wordmark. It is `aria-hidden` because the logo link above
        already names the site; announcing it twice would just be noise. The
        negative inline margin lets it bleed past the content column on wide
        screens, which is the whole point of it being this size.
      */}
      <div aria-hidden="true" className="relative select-none overflow-hidden">
        <p className="mx-auto max-w-[1280px] px-5 lg:px-8">
          <span className="block whitespace-nowrap font-display text-[clamp(4.5rem,19vw,17rem)] font-bold leading-[.78] tracking-[-.07em] text-transparent [-webkit-text-stroke:2px_rgba(19,184,176,.42)] lg:-mx-[8%]">
            DevMarket
          </span>
        </p>
      </div>

      <div className="mx-auto max-w-[1280px] px-5 pb-8 lg:px-8">
        <div className="flex flex-col justify-between gap-3 border-t border-[#d7e8eb] pt-5 text-xs text-[#71809f] sm:flex-row">
          <span>© 2026 DevMarket Labs</span>
          <span className="font-mono uppercase tracking-[.12em]">Built by Nitin Sharma</span>
        </div>
      </div>
    </footer>
  );
}