import type { ReactNode } from "react";
import Reveal from "@/components/developer/Reveal";

/**
 * The shared section heading, and the top of the page's type hierarchy:
 * page <h1> > section <h2> > cluster <h3> > item <h4>.
 *
 * `index` renders a large outlined numeral beside the eyebrow. It is what makes
 * the order of the page explicit rather than implied — a reader can tell they are
 * six sections deep without having to scroll back up.
 *
 * `eyebrow` is deliberately optional. Putting that small uppercase label above
 * every heading is the fastest way to make a page read as templated, so only a
 * few sections carry one; the number does the orienting work instead.
 */
export default function SectionTitle({
  eyebrow,
  index,
  title,
  lede,
  className = "",
  id,
}: {
  eyebrow?: string;
  /** Two-digit section number, e.g. "04". */
  index?: string;
  title: ReactNode;
  lede?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <Reveal className={className}>
      <div className="flex items-center gap-5">
        {index ? (
          <span
            aria-hidden="true"
            className="font-display text-5xl font-bold leading-none tracking-[-.06em] text-transparent [-webkit-text-stroke:1.5px_rgba(19,184,176,.55)] md:text-6xl"
          >
            {index}
          </span>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? <p className="font-mono text-[11px] uppercase tracking-[.2em] text-[#13b8b0]">{eyebrow}</p> : null}
          <h2
            id={id}
            className={`max-w-2xl font-display font-semibold leading-[.95] tracking-[-.07em] text-[#172039] md:text-5xl ${
              eyebrow || index ? "mt-2" : ""
            }`}
          >
            {title}
          </h2>
        </div>
      </div>
      {lede ? <p className="mt-5 max-w-xl text-base leading-7 text-[#53617d] md:text-lg">{lede}</p> : null}
    </Reveal>
  );
}