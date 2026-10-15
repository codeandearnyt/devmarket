import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { LogOut, Menu, X } from "lucide-react";
import DevMarketIcon from "@/assets/dev-market-icon.png";

export type AdminNavItem = {
  id: string;
  label: string;
  icon: ReactNode;
};

/**
 * Admin navigation, responsive across all three widths.
 *
 * Mobile (<640px)  — a compact fixed top bar with a hamburger. The nav lives in
 *                    an off-canvas drawer, not a horizontally scrolling strip:
 *                    ten tabs in a strip means the active one is usually off
 *                    screen with no indication of where you are.
 * Tablet (640-1023) — same drawer, but the bar carries the current section name
 *                    and a larger touch target, so it stops feeling like a
 *                    squeezed phone layout.
 * Desktop (>=1024) — a docked 288px rail, always visible, full labels.
 *
 * The drawer is a real dialog: it locks background scroll, closes on Escape,
 * closes on scrim click, and returns focus to the hamburger. Without those,
 * "tap outside to close" on a mobile admin panel reliably loses the tap on
 * iOS Safari.
 */
export default function AdminNav({
  items,
  activeId,
  onSelect,
  operatorLabel,
  onLock,
  lockPending,
}: {
  items: AdminNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  operatorLabel: string;
  onLock: () => void;
  lockPending?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const activeLabel = items.find(item => item.id === activeId)?.label.replace(/ · \d+/, "") ?? "Admin";

  const close = useCallback(() => setOpen(false), []);

  // Escape closes, and focus goes back to the control that opened the drawer.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // Background scroll lock. `overflow: hidden` on <body> rather than a wrapper,
  // because iOS Safari still scrolls the document behind a fixed overlay.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Move focus into the drawer when it opens so the next Tab stays inside it.
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  const handleSelect = (id: string) => {
    onSelect(id);
    close();
  };

  const navList = (variant: "drawer" | "rail") => (
    <nav
      aria-label="Admin sections"
      className={variant === "rail" ? "flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4 lg:px-4" : "flex flex-col gap-1"}
    >
      {items.map(item => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item.id)}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
              isActive ? "bg-[#c7f76d] text-[#172039]" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span aria-hidden="true" className="shrink-0">
              {item.icon}
            </span>
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  const operatorBlock = (extra: string) => (
    <div className={extra}>
      <div className="rounded-xl bg-white/5 p-3">
        <p className="truncate text-xs font-semibold text-white/80">{operatorLabel}</p>
        <button
          type="button"
          onClick={onLock}
          disabled={lockPending}
          className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0c7a73] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#c7f76d] hover:text-[#172039] disabled:opacity-60"
        >
          <LogOut size={13} aria-hidden="true" />
          Lock console
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ---------- Mobile + tablet top bar (below lg) ---------- */}
      <header className="admin-glass-nav sticky top-0 z-40 flex items-center gap-3 border-b border-white/10 bg-[#172039] px-4 py-3 text-white lg:hidden">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          aria-expanded={open}
          aria-controls={panelId}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        <Link href="/" className="flex min-w-0 items-center gap-2">
          <img src={DevMarketIcon} alt="" className="h-8 w-8 shrink-0 rounded-lg object-contain" />
          <span className="truncate font-display text-base font-bold tracking-[-.05em]">
            Dev<span className="text-[#13b8b0]">Market</span>
          </span>
          <span className="shrink-0 rounded-full bg-[#c7f76d] px-2 py-0.5 font-mono text-[8px] uppercase tracking-[.12em] text-[#172039]">
            admin
          </span>
        </Link>

        {/* The current section, so the bar says where you are even with the
            drawer closed — the whole point of the horizontal strip is gone. */}
        <span className="ml-auto min-w-0 truncate font-mono text-[10px] uppercase tracking-[.14em] text-white/55">
          {activeLabel}
        </span>
      </header>

      {/* ---------- Drawer (mobile + tablet) ---------- */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* scrim: a real button so it is announced and reachable by keyboard */}
          <button
            type="button"
            aria-label="Close admin menu"
            onClick={() => {
              close();
              triggerRef.current?.focus();
            }}
            className="absolute inset-0 h-full w-full cursor-default bg-[#0b1220]/55 backdrop-blur-sm"
          />

          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
            tabIndex={-1}
            className="absolute inset-y-0 left-0 flex w-[min(19rem,86vw)] flex-col overflow-y-auto bg-[#172039] text-white shadow-[0_0_60px_rgba(11,18,32,.45)]"
          >
            <div className="flex items-center justify-between px-5 pb-4 pt-5">
              <p className="font-mono text-[10px] uppercase tracking-[.18em] text-white/55">Command center</p>
              <button
                type="button"
                onClick={() => {
                  close();
                  triggerRef.current?.focus();
                }}
                aria-label="Close admin menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="px-4 pb-2">
              <Link href="/" className="flex items-center gap-3">
                <img src={DevMarketIcon} alt="" className="h-9 w-9 rounded-xl object-contain" />
                <span className="font-display text-lg font-bold tracking-[-.05em]">
                  Dev<span className="text-[#13b8b0]">Market</span>
                </span>
              </Link>
            </div>

            {navList("drawer")}
            {operatorBlock("mt-auto px-4 pb-6 pt-4")}
          </div>
        </div>
      ) : null}

      {/* ---------- Desktop rail (lg and up) ----------
          `lg:h-full` rather than `h-screen`: the rail is a flex child of a shell
          that is already exactly one viewport tall, so inheriting that height is
          correct by construction. `h-screen` here would only agree with the
          shell by coincidence and would drift the moment the shell's height
          changed. `sticky` is kept but is now belt-and-braces — the rail sits
          outside the scroll container, so it cannot move either way. */}
      <aside className="admin-glass-nav sticky top-0 hidden h-full w-72 shrink-0 flex-col self-stretch border-r border-white/10 bg-[#172039] text-white lg:flex">
        <div className="px-6 pb-4 pt-7">
          <Link href="/" className="flex items-center gap-3">
            <img src={DevMarketIcon} alt="" className="h-9 w-9 rounded-xl object-contain" />
            <span className="font-display text-xl font-bold tracking-[-.05em]">
              Dev<span className="text-[#13b8b0]">Market</span>
            </span>
            <span className="ml-1 rounded-full bg-[#c7f76d] px-2 py-1 font-mono text-[8px] uppercase tracking-[.12em] text-[#172039]">
              admin
            </span>
          </Link>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[.18em] text-white/70">Command center</p>
        </div>

        {navList("rail")}
        {operatorBlock("px-4 pb-8 pt-4")}
      </aside>
    </>
  );
}