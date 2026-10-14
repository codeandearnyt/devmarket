import type { ReactNode } from "react";
import Reveal from "@/components/developer/Reveal";

/**
 * The shared section heading.
 *
 * `eyebrow` is deliberately optional and used on only a few sections. Putting
 * that small uppercase label above *every* heading is the fastest way to make a
 * page read as templated — the headline alone is enough to separate the blocks,
 * and the page's rhythm comes from alternating layouts instead.
 */
export default function SectionTitle({
  eyebrow,
  title,
  lede,
  className = "",
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <Reveal className={className}>
      {eyebrow ? <p className="font-mono text-[11px] uppercase tracking-[.2em] text-[#13b8b0]">{eyebrow}</p> : null}
      <h2
        id={id}
        className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-[.95] tracking-[-.07em] text-[#172039] md:text-5xl"
      >
        {title}
      </h2>
      {lede ? <p className="mt-5 max-w-xl text-base leading-7 text-[#53617d] md:text-lg">{lede}</p> : null}
    </Reveal>
  );
}