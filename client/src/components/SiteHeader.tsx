import { ArrowLeft, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import DevMarketIcon from "@/assets/dev-market-icon.png";
import HeaderAvatar from "@/components/HeaderAvatar";
import { useAuth } from "@/_core/hooks/useAuth";

const navLinks = [
  { label: "Explore", href: "/#explore" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Blog", href: "/blog" },
  { label: "My library", href: "/dashboard" },
  { label: "Developer", href: "/developer" },
] as const;

/**
 * The single source of truth for the top navigation bar.
 *
 * Every route renders this same header, so the logo, the primary navigation,
 * the account menu and the mobile drawer can never drift apart between pages.
 * `linkLabel` adds an optional contextual back link for detail pages, and
 * `live` shows the realtime indicator on the storefront.
 *
 * Below the large breakpoint the navigation collapses into a drawer; the word
 * mark and the account name drop out first so the bar never collides with the
 * back link on a 360px screen.
 */
export default function SiteHeader({
  linkLabel,
  linkHref = "/",
  live = false,
}: {
  linkLabel?: string;
  linkHref?: string;
  live?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  // A client-side navigation must never leave the drawer hanging open.
  useEffect(() => {
    setOpen(false);
  }, [location]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="site-header">
      <div className="site-nav-pill mx-auto flex max-w-[1080px] items-center gap-2 px-4 py-3 sm:gap-5 lg:px-5">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="DevMarket home">
          <img src={DevMarketIcon} alt="" className="h-9 w-9 rounded-lg object-contain" />
          <span className="hidden font-display text-xl font-bold tracking-[-.05em] min-[420px]:inline">
            dev<span className="text-[#13b8b0]">market</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-[#53617d] lg:flex xl:gap-8">
          {navLinks.map(item => (
            <Link key={item.label} href={item.href} className="transition hover:text-[#172039]">
              {item.label}
            </Link>
          ))}
          {live ? (
            <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.14em] text-[#71809f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#527f1e]" />Live
            </span>
          ) : null}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          {linkLabel ? (
            <Link
              href={linkHref}
              className="hidden min-w-0 items-center gap-2 text-sm font-semibold text-[#53617d] transition hover:text-[#13b8b0] sm:inline-flex"
            >
              <ArrowLeft size={15} className="shrink-0" />
              <span className="truncate">{linkLabel}</span>
            </Link>
          ) : null}

          <div className="hidden lg:block">
            {isAuthenticated ? (
              <HeaderAvatar />
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="btn rounded-full border border-[#d7e8eb] px-4 py-2 text-sm font-semibold">
                  Sign in
                </Link>
                <Link
                  href="/login"
                  className="btn rounded-full bg-[#172039] px-4 py-2 text-sm font-semibold text-white hover:bg-[#13b8b0]"
                >
                  Start building
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="site-mobile-menu"
            onClick={() => setOpen(value => !value)}
            className="shrink-0 rounded-xl p-2 text-[#172039] transition hover:bg-[#e9f7f6] lg:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div id="site-mobile-menu" className="site-mobile-menu">
          <nav className="flex flex-col gap-1 text-sm font-medium">
            {navLinks.map(item => (
              <Link key={item.label} href={item.href} className="rounded-xl px-3 py-3 transition hover:bg-[#e9f7f6]">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-[#e4eef1] pt-4">
            {linkLabel ? (
              <Link href={linkHref} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-[#53617d] transition hover:bg-[#e9f7f6]">
                <ArrowLeft size={15} /> {linkLabel}
              </Link>
            ) : null}
            {isAuthenticated ? (
              <Link href="/dashboard" className="rounded-full bg-[#172039] px-4 py-3 text-center text-sm font-semibold text-white">
                Open my library
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-full border border-[#d7e8eb] px-4 py-3 text-center text-sm font-semibold">
                  Sign in
                </Link>
                <Link href="/login" className="rounded-full bg-[#172039] px-4 py-3 text-center text-sm font-semibold text-white">
                  Start building
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}