import { motion, useReducedMotion } from "framer-motion";
import Reveal, { StaggerGroup, StaggerItem } from "@/components/developer/Reveal";
import SectionTitle from "@/components/developer/SectionTitle";
import { JOURNEY } from "@/lib/developerContent";

/**
 * Learning path.
 *
 * A vertical spine rather than a horizontal timeline: a horizontal one forces
 * either a cramped row or a sideways scroll on a phone, while a spine reads the
 * same at every width.
 *
 * The row is a single flex column — dot, then content — so nothing depends on a
 * magic negative margin to line up. At `lg` the *content* becomes a two-column
 * grid (title, then description) to use the width, without touching the spine.
 *
 * Only the dot animates. The row itself stays still, so the list remains
 * readable while it plays.
 */
export default function Journey() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="journey" className="mx-auto max-w-[1280px] scroll-mt-28 px-5 py-20 lg:px-8 lg:py-24">
      <SectionTitle
        index="05"
        title="How I got here."
        lede="Nobody arrives fluent. This is the path so far, and where it is heading."
      />

      <StaggerGroup className="mt-12" as="div">
        <ol className="relative">
          {/* spine — inset so it runs through the dot centres */}
          <span
            aria-hidden="true"
            className="absolute bottom-3 left-[7px] top-3 w-px bg-[#d7e8eb] sm:left-[9px]"
          />

          {JOURNEY.map(entry => (
            <StaggerItem as="li" key={entry.id} className="relative flex gap-6 pb-9 pl-9 last:pb-0 sm:pl-11">
              <motion.span
                aria-hidden="true"
                initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, amount: "some" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-[3px] border-[#eef8fa] bg-[#13b8b0] shadow-[0_0_0_1px_#13b8b0] sm:left-0.5"
              />

              <div className="grid flex-1 gap-1 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-baseline lg:gap-10">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#13b8b0]">{entry.when}</p>
                  <h3 className="mt-1.5 font-display text-xl font-semibold tracking-[-.04em] text-[#172039]">
                    {entry.title}
                  </h3>
                </div>
                <p className="text-sm leading-6 text-[#53617d] lg:mt-7">{entry.copy}</p>
              </div>
            </StaggerItem>
          ))}
        </ol>
      </StaggerGroup>

      <Reveal delay={0.1}>
        <p className="mt-12 border-t border-[#d7e8eb] pt-6 font-mono text-[10px] uppercase tracking-[.14em] text-[#71809f]">
          Currently studying Computer Science Engineering · Government Polytechnic Sergarh, Kaithal
        </p>
      </Reveal>
    </section>
  );
}