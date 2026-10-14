import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ExternalLink, Sparkles } from "lucide-react";
import Reveal from "@/components/developer/Reveal";
import SectionTitle from "@/components/developer/SectionTitle";
import { PORTFOLIO_FILTERS, PROJECTS, filterProjects, type ProjectKind } from "@/lib/developerContent";

type Filter = ProjectKind | "ALL";

const KIND_STYLES: Record<ProjectKind, string> = {
  PLATFORM: "bg-[#172039] text-white",
  AI: "bg-[#7658f5] text-white",
  WEB: "bg-[#13b8b0] text-white",
  APP: "bg-[#c7f76d] text-[#172039]",
};

/**
 * Selected work.
 *
 * Every project here is real and every `url` is live, so the card carries the
 * domain as a link and the screenshot as the cover — clicking anywhere useful
 * on the card takes you to the actual thing rather than a case-study page that
 * does not exist yet.
 *
 * Filtering animates opacity and scale only. There is deliberately no `layout`
 * prop and no `mode="popLayout"` on AnimatePresence: `popLayout` sets
 * `position: absolute` on exiting children and removes them only once their exit
 * animation settles, and combined with `layout` on both the list and the items
 * that settle never happens — the filtered-out cards stay in the DOM at full
 * opacity, stacked over the card that should be visible.
 *
 * Hover/focus drives the dark detail panel beside the grid. Focus is wired up as
 * well as hover so it is reachable by keyboard.
 */
export default function Portfolio() {
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [activeId, setActiveId] = useState(PROJECTS[0].id);

  const visible = filterProjects(PROJECTS, filter);
  // Keep the detail panel pointing at something still on screen when the active
  // project gets filtered out.
  const active = visible.find(project => project.id === activeId) ?? visible[0] ?? PROJECTS[0];

  return (
    <section id="portfolio" className="scroll-mt-28 border-y border-[#d7e8eb] bg-[#e9f7f6] py-20 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-5 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionTitle
            index="04"
          eyebrow="Selected experiments"
            title="A portfolio in motion."
            lede="Ten projects that are live right now. Hover or focus one to read the detail, or filter by type — every card links to the real site."
          />

          <Reveal delay={0.1}>
            <div
              role="group"
              aria-label="Filter projects by type"
              className="flex flex-wrap gap-1 rounded-full border border-[#b9d6db] bg-[#f8ffff] p-1"
            >
              {PORTFOLIO_FILTERS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFilter(option.id)}
                  aria-pressed={filter === option.id}
                  className={`min-h-11 rounded-full px-4 py-2 text-xs font-semibold transition-colors duration-150 ${
                    filter === option.id ? "bg-[#172039] text-white" : "text-[#53617d] hover:text-[#0b7c77]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        {/* One row, read left to right.
            Every project is the same width and the index runs 01, 02, 03 along a
            single axis, so "the fourth one" means the same thing visually and in
            the DOM. The previous two-column grid split that order across rows and
            put a detail panel beside it, so the list read as two things rather
            than one sequence.

            The row scrolls horizontally with scroll-snap, so a phone gets the same
            left-to-right sequence instead of a tall stack. It is still a real <ul>,
            so assistive tech reads all ten in order. tabIndex makes the scroller
            reachable by keyboard, which it otherwise would not be. */}
          <div className="mt-10">
            <ul
              className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3"
              tabIndex={0}
              role="group"
              aria-label="Projects, ordered left to right. Scroll horizontally to see all ten."
            >
            <AnimatePresence initial={false}>
              {visible.map(project => (
                <motion.li
                  key={project.id}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, transition: { duration: 0.16 } }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="shrink-0"
                >
                  {/* The whole card is a link: the live project is the most
                      useful thing a reader can do here. */}
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => setActiveId(project.id)}
                    onFocus={() => setActiveId(project.id)}
                    onClick={() => setActiveId(project.id)}
                    aria-label={`${project.title} — opens in a new tab`}
                    className={`group block h-full w-[78vw] max-w-[22rem] shrink-0 snap-start overflow-hidden rounded-[1.5rem] border bg-[#f8ffff] transition duration-200 ease-[cubic-bezier(.23,1,.32,1)] hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(23,32,57,.14)] ${
                      active.id === project.id ? "border-[#13b8b0]" : "border-[#d7e8eb] hover:border-[#13b8b0]"
                    }`}
                  >
                    {/* Cover screenshot. Explicit 16:10 box + object-cover so the
                        grid cannot shift when the JPEG decodes. */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#e9f7f6]">
                      <img
                        src={project.cover}
                        alt={`Screenshot of ${project.title}`}
                        width={1280}
                        height={800}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(.23,1,.32,1)] group-hover:scale-[1.04]"
                      />
                      <span
                        className={`absolute left-3 top-3 rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.12em] ${KIND_STYLES[project.kind]}`}
                      >
                        {project.kind}
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-lg font-semibold tracking-[-.04em] text-[#172039] transition-colors duration-200 group-hover:text-[#0b7c77]">
                          {project.title}
                        </h3>
                        <ExternalLink
                          size={16}
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 text-[#71809f] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#0b7c77]"
                        />
                      </div>

                      <p className="mt-2 text-sm leading-6 text-[#53617d]">{project.copy}</p>

                      <p className="mt-3 truncate font-mono text-[11px] text-[#71809f]">{project.url.replace(/^https?:\/\//, "")}</p>
                    </div>
                  </a>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {/* detail panel — aria-live so a keyboard reader hears the swap too */}
          <motion.div
            key={active.id}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-fit overflow-hidden rounded-[1.75rem] bg-[#172039] text-white"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0f1728]">
              <img
                src={active.cover}
                alt={`Screenshot of ${active.title}`}
                width={1280}
                height={800}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover opacity-90"
              />
            </div>

            <div aria-live="polite" className="relative p-7 md:p-9">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#13b8b0]/25" />

              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[.18em] text-[#c7f76d]">Now looking at</span>
                  <motion.span
                    aria-hidden="true"
                    animate={reduceMotion ? {} : { rotate: [0, 14, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="text-[#c7f76d]"
                  >
                    <Sparkles size={20} />
                  </motion.span>
                </div>

                <h3 className="mt-6 font-display text-3xl font-semibold leading-[.95] tracking-[-.05em]">{active.title}</h3>
                <p className="mt-4 text-base leading-7 text-white/70">{active.copy}</p>

                <div className="mt-8">
                  <p className="font-mono text-[10px] uppercase tracking-[.16em] text-white/45">What it is</p>
                  <p className="mt-2 font-display text-xl font-semibold text-[#13b8b0]">{active.outcome}</p>
                </div>

                <ul className="mt-6 flex flex-wrap gap-2">
                  {active.stack.map(item => (
                    <li key={item} className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/75">
                      {item}
                    </li>
                  ))}
                </ul>

                <a
                  href={active.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn mt-8 inline-flex min-h-12 items-center rounded-full bg-[#13b8b0] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0b7c77]"
                >
                  Visit {active.title}
                  <ArrowUpRight className="ml-2" size={16} aria-hidden="true" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}