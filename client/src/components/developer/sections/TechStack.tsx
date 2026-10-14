import Reveal from "@/components/developer/Reveal";
import { TECH_STACK } from "@/lib/developerContent";

/**
 * The one horizontal marquee on the page.
 *
 * Each item is the brand's real Simple Icons mark, downloaded into
 * `/public/logos` at build time rather than pulled from a CDN at runtime — no
 * third-party request, no layout shift when a slow CDN fails, and the colour is
 * baked to the AA teal so the row stays legible on the pale background.
 *
 * Driven entirely by the `techScrollLeft` keyframe that already exists in
 * `index.css`, which animates `transform` only. The track is duplicated so the
 * loop is seamless, and the whole strip is hidden from assistive tech because it
 * is the same list twice.
 *
 * A marquee is a loop, so it stops dead under `prefers-reduced-motion`; the
 * fallback below then renders the same items as a static, wrapping row.
 */
export default function TechStack() {
  return (
    <section aria-label="Technologies I work with" className="border-b border-[#d7e8eb] bg-[#e9f7f6] py-12">
      <Reveal className="mx-auto mb-8 max-w-[1280px] px-5 lg:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[.2em] text-[#13b8b0]">Tools of the trade</p>
      </Reveal>

      <div className="relative">
        {/* Edge fades so items are not clipped mid-word at the boundaries. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#e9f7f6] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#e9f7f6] to-transparent" />

        <div className="overflow-hidden">
          <div className="flex w-max animate-[techScrollLeft_46s_linear_infinite] gap-3 pr-3 hover:[animation-play-state:paused] motion-reduce:animate-none">
            {[...TECH_STACK, ...TECH_STACK].map((tool, index) => (
              <span
                key={`${tool.slug}-${index}`}
                aria-hidden={index >= TECH_STACK.length ? "true" : undefined}
                className="flex shrink-0 items-center gap-2.5 rounded-full border border-[#b9d6db] bg-[#f8ffff] px-4 py-2.5"
              >
                {/* width/height are explicit so the row does not reflow when the
                    SVG arrives; the file is a single path with a square viewBox. */}
                <img
                  src={`/logos/${tool.slug}.svg`}
                  alt=""
                  width={18}
                  height={18}
                  loading="lazy"
                  decoding="async"
                  className="h-[18px] w-[18px] shrink-0"
                />
                <span className="font-mono text-xs uppercase tracking-[.12em] text-[#172039]">{tool.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Reduced-motion presentation: the same content, no loop. */}
      <ul className="mx-auto mt-6 hidden max-w-[1280px] flex-wrap justify-center gap-2 px-5 lg:px-8 motion-reduce:flex">
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