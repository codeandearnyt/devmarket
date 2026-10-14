import { ArrowUpRight, Lock, Store } from "lucide-react";
import { Link } from "wouter";
import DevMarketIcon from "@/assets/dev-market-icon.png";

/**
 * The site footer, shared by every route.
 *
 * Two variants, because the marketing site and the operator console want
 * genuinely different things at the bottom of the screen:
 *
 *   full     - storefront and profile pages. Statement column, four nav columns
 *              and an oversized wordmark. This is the brand surface.
 *   compact  - the admin console. A slim bar with only what an operator needs
 *              to get somewhere else. The marketing footer was unusable there:
 *              it is ~1000px tall on a 900px viewport, carries eleven
 *              marketing links and a 224px wordmark, and it was rendering as a
 *              third flex column beside the admin rail because it sat inside the
 *              `lg:flex-row` container. A console needs a way out, not a
 *              storefront.
 *
 * Every page uses `full` unless it says otherwise, so nothing else changes.
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

export default function SiteFooter({
  variant = "full",
  operatorLabel,
  onLock,
}: {
  variant?: "full" | "compact";
  /** Only used by the compact variant. */
  operatorLabel?: string;
  onLock?: () => void;
} = {}) {
  if (variant === "compact") {
    return (
      <footer className="admin-page relative z-10 border-t border-[#d7e8eb] bg-[#eef8fa]">
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <div className="flex items-center gap-3">
            <img src={DevMarketIcon} alt="" className="h-8 w-8 shrink-0 rounded-lg object-contain" />
            <div className="min-w-0">
              <p className="font-display text-sm font-bold tracking-[-.04em] text-[#172039]">DevMarket admin</p>
              {operatorLabel ? (
                <p className="truncate font-mono text-[10px] uppercase tracking-[.14em] text-[#71809f]">{operatorLabel}</p>
              ) : null}
            </div>
          </div>

          {/* Wraps rather than overflowing, so the bar stays one tidy line on a
              phone and splits into two on a very narrow screen rather than
              clipping. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link
              href="/"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#d7e8eb] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#53617d] transition hover:border-[#13b8b0] hover:text-[#0b7c77]"
            >
              <Store size={13} aria-hidden="true" />
              View store
            </Link>
            <a
              href="mailto:nitinxengg@gmail.com"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#d7e8eb] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#53617d] transition hover:border-[#13b8b0] hover:text-[#0b7c77]"
            >
              Support
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
            {onLock ? (
              <button
                type="button"
                onClick={onLock}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#172039] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#13b8b0]"
              >
                <Lock size={13} aria-hidden="true" />
                Lock console
              </button>
            ) : null}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="site-footer relative z-10 overflow-hidden border-t border-[#d7e8eb] bg-[#eef8fa]">
      <div className="mx-auto max-w-[1280px] px-5 pb-8 pt-14 lg:px-8 lg:pt-20">
        <div className="grid-container grid gap-10 md:grid-cols-12 md:gap-8">
          {/* Column budget across 12: statement 1-3, a gap at 4, then four nav columns
            at 5-6, 7-8, 9-10 and 11-12. The statement column was col-span-4 at
            first, which pushed the last nav column to 12-13 and wrapped it onto
            a row of its own. */}
          <div className="md:col-span-3">
            <Link href="/" className="inline-flex items-center" aria-label="DevMarket home">
              {/* Icon only. The oversized wordmark below already spells the
                  name, and a second "devmarket" beside it read as a repeat
                  rather than a wordmark. */}
              <img src={DevMarketIcon} alt="" className="h-14 w-14 rounded-2xl object-contain" />
            </Link>
            <p className="type-serif mt-6 max-w-sm text-[1.375rem] font-semibold leading-[1.3] text-[#172039]">
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
        The oversized wordmark, centred on the page and split in two colours:
        "Dev" in the brand ink, "Market" in the accent.

        It is `aria-hidden` because the logo link above already names the site -
        announcing it a second time would just be noise for a screen reader.

        Centred rather than bled off the left edge: a wordmark that hangs off one
        side reads as a layout accident, while a centred one closes the page the
        way a masthead does. The size is capped so "DevMarket" stays inside the
        content column at every width - at 19vw it ran wider than the viewport
        and clipped asymmetrically on one side.
      */}
      <div aria-hidden="true" className="relative select-none overflow-hidden">
        <p className="mx-auto max-w-[1280px] px-5 text-center lg:px-8">
          <span className="block whitespace-nowrap font-display text-[clamp(3rem,16vw,14rem)] font-bold leading-[.82] tracking-[-.055em]">
            <span className="text-[#172039]">Dev</span>
            {/* Lobster on one word only. It is a script face; used across a whole
                page it turns into novelty, used on a single highlight it reads as
                a deliberate accent. */}
            <span className="type-script text-[#13b8b0]">Market</span>
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