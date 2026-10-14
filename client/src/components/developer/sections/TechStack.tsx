import { motion, useReducedMotion } from "framer-motion";
import Reveal from "@/components/developer/Reveal";
import { TECH_STACK } from "@/lib/developerContent";

/** Each item is the brand's real Simple Icons mark, downloaded into /public/logos
 *  at build time rather than pulled from a CDN at runtime — no third-party
 *  request, no layout shift when a slow CDN fails, and the colour is baked to
 *  the AA teal so the row stays legible on the pale background.
 *
 *  Motion, in the order it reads:
 *   1. the section label wipes in from the left
 *   2. the track slides in from the right as one piece
 *   3. the marquee itself loops, and pauses while hovered or focused
 *   4. each pill lifts and tints its logo on hover
 *
 *  A marquee is a loop, so it stops dead under `prefers-reduced-motion`; the
 *  fallback then renders the same items as a static, wrapping row.
 */
export default function TechStack() {
  const reduceMotion = useReducedMotion();

  return (
    <section aria-label="Technologies I work with" className="relative overflow-hidden border-b border-[#d7e8eb] bg-[#e9f7f6] py-14">
      {/* soft wash so the strip reads as a band rather than a flat rectangle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(70% 120% at 50% 0%, rgba(255,255,255,.85), transparent 70%)" }}
      />

      <Reveal className="relative mx-auto mb-9 max-w-[1280px] px-5 lg:px-8">
        <div className="flex items-baseline justify-between gap-6 border-b border-[#b9d6db] pb-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[.2em] text-[#13b8b0]">Tools of the trade</p>
            <p className="mt-1.5 font-display text-lg font-semibold tracking-[-.03em] text-[#172039]">
              {TECH_STACK.length} technologies I reach for
            </p>
          </div>
          <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[.16em] text-[#71809f] sm:block">
            Hover to pause
          </span>
        </div>
      </Reveal>

      <div className="relative">
        {/* Edge fades so items are never clipped mid-word at the boundaries. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#e9f7f6] to-transparent sm:w-24" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#e9f7f6] to-transparent sm:w-24" />

        <motion.div
          className="overflow-hidden"
          initial={reduceMotion ? false : { opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex w-max animate-[techScrollLeft_52s_linear_infinite] gap-3 px-2 hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:animate-none">
            {[...TECH_STACK, ...TECH_STACK].map((tool, index) => (
              <span
                key={`${tool.slug}-${index}`}
                aria-hidden={index >= TECH_STACK.length ? "true" : undefined}
                className="group flex shrink-0 items-center gap-2.5 rounded-full border border-[#b9d6db] bg-[#f8ffff] py-2.5 pl-3 pr-4 transition-[transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(.23,1,.32,1)] hover:-translate-y-0.5 hover:border-[#13b8b0] hover:shadow-[0_8px_20px_rgba(19,184,176,.18)]"
              >
                <img
                  src={`/logos/${tool.slug}.svg`}
                  alt=""
                  width={18}
                  height={18}
                  loading="lazy"
                  decoding="async"
                  className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110"
                />
                <span className="font-mono text-xs uppercase tracking-[.12em] text-[#172039] transition-colors duration-200 group-hover:text-[#0b7c77]">
                  {tool.name}
                </span>
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Reduced-motion presentation: the same content, no loop. */}
      <ul className="relative mx-auto mt-7 hidden max-w-[1280px] flex-wrap justify-center gap-2 px-5 lg:px-8 motion-reduce:flex">
        {TECH_STACK.map(tool => (
          <li
            key={tool.slug}
            className="flex items-center gap-2 rounded-full border border-[#b9d6db] bg-[#f8ffff] px-4 py-2"
          >
            <img src={`/logos/${tool.slug}.svg`} alt="" width={18} height={18} loading="lazy" decoding="async" className="h-[18px] w-[18px]" />
            <span className="font-mono text-[11px] uppercase tracking-[.12em] text-[#172039]">{tool.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}