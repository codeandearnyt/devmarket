import { motion, useReducedMotion } from "framer-motion";
import Reveal from "@/components/developer/Reveal";
import { AI_APPROACH } from "@/lib/developerContent";

/**
 * The responsible-AI stance.
 *
 * This is the single full-bleed dark block on the page. There is exactly one of
 * them on purpose — flipping between light and dark bands as you scroll makes a
 * page feel like several different websites stitched together.
 */
export default function AiApproach() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="ai-approach-heading"
      className="mx-5 mb-20 overflow-hidden rounded-[2rem] bg-[#172039] py-20 text-white lg:mx-auto lg:max-w-[1232px] lg:py-24"
    >
      <div className="mx-auto max-w-5xl px-7 lg:px-14">
        <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[.2em] text-[#c7f76d]">How I approach AI</p>
            <h2
              id="ai-approach-heading"
              className="mt-4 font-display text-4xl font-semibold leading-[.9] tracking-[-.07em] md:text-6xl"
            >
              {AI_APPROACH.heading[0]}
              <br />
              <span className="text-[#13b8b0]">{AI_APPROACH.heading[1]}</span>
            </h2>
          </div>

          <div className="space-y-6 text-lg leading-8 text-white/70">
            {AI_APPROACH.paragraphs.map(paragraph => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}

            <ul className="flex flex-wrap gap-2 pt-2">
              {AI_APPROACH.tags.map((tag, index) => (
                <motion.li
                  key={tag}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: "some" }}
                  transition={{ duration: 0.4, delay: 0.15 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-full border border-white/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[.14em]"
                >
                  {tag}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}