import { ChevronDown, ListTree } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { headingId, prefersReducedMotion } from "@/lib/blogContent";

export type TocEntry = { id: string; text: string; level: 2 | 3 };

/**
 * Collect the rendered H2/H3 headings of an article.
 *
 * The list is read back from the DOM rather than from the source, so the table
 * of contents always matches what the reader actually sees — block editor and
 * markdown posts alike — and anchor ids can never drift from the markup.
 */
function useTableOfContents(containerRef: React.RefObject<HTMLElement | null>, version: string | number) {
  const [entries, setEntries] = useState<TocEntry[]>([]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const seen = new Map<string, number>();
    const collected = Array.from(root.querySelectorAll<HTMLElement>("h2, h3"))
      // Headings inside a placement belong to the promotion, not the article.
      .filter(element => !element.closest("[data-ad-placement]"))
      .map((element, index) => {
      const text = element.textContent?.trim() ?? "";
      const base = headingId(text, `section-${index + 1}`);
      const repeats = seen.get(base) ?? 0;
      seen.set(base, repeats + 1);
      const id = repeats ? `${base}-${repeats}` : base;
      element.id = id;
      return { id, text, level: element.tagName === "H3" ? (3 as const) : (2 as const) };
    });

    setEntries(collected);
  }, [containerRef, version]);

  return entries;
}

/** Highlight the section currently under the reader's eye. */
function useScrollSpy(containerRef: React.RefObject<HTMLElement | null>, entries: TocEntry[]) {
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null);

  useEffect(() => {
    if (!entries.length) {
      setActiveId(null);
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const offset = 140;
      let current = entries[0].id;
      for (const entry of entries) {
        const element = document.getElementById(entry.id);
        if (!element) continue;
        if (element.getBoundingClientRect().top - offset <= 0) current = entry.id;
        else break;
      }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 48;
      if (atBottom) current = entries[entries.length - 1].id;
      setActiveId(current);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [entries]);

  return activeId;
}

export default function BlogTableOfContents({
  containerRef,
  version,
  variant = "sidebar",
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  /** Re-runs collection when the rendered article changes. */
  version: string | number;
  variant?: "sidebar" | "collapsible";
}) {
  const entries = useTableOfContents(containerRef, version);
  const activeId = useScrollSpy(containerRef, entries);
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (entries.length < 2) return null;

  const jump = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    const element = document.getElementById(id);
    if (!element) return;
    window.history.replaceState(null, "", `#${id}`);

    const scroll = () =>
      element.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });

    if (open) {
      // Collapsing the list removes height above the heading, so wait for the
      // layout to settle — otherwise the jump lands short of the target.
      setOpen(false);
      window.requestAnimationFrame(() => window.requestAnimationFrame(scroll));
      return;
    }
    scroll();
  };

  const list = (
    <ol className="space-y-0.5">
      {entries.map(entry => {
        const active = activeId === entry.id;
        return (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              onClick={event => jump(event, entry.id)}
              aria-current={active ? "true" : undefined}
              className={`block border-l-2 py-1.5 pr-2 text-sm leading-6 transition ${
                entry.level === 3 ? "pl-6 text-[13px]" : "pl-3"
              } ${
                active
                  ? "border-[#13b8b0] font-semibold text-[#172039]"
                  : "border-[#d7e8eb] text-[#53617d] hover:border-[#b9d6db] hover:text-[#172039]"
              }`}
            >
              {entry.text}
            </a>
          </li>
        );
      })}
    </ol>
  );

  if (variant === "collapsible") {
    return (
      <div className="mt-8 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(value => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center justify-between rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm font-semibold text-[#172039]"
        >
          <span className="flex items-center gap-2">
            <ListTree size={15} className="text-[#13b8b0]" /> On this page
          </span>
          <ChevronDown size={16} className={`text-[#71809f] transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && <div id={panelId} className="mt-3">{list}</div>}
      </div>
    );
  }

  return (
    <nav aria-label="Table of contents" className="hidden lg:block">
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-[#13b8b0]">
        <ListTree size={13} /> On this page
      </p>
      <div className="mt-3">{list}</div>
    </nav>
  );
}