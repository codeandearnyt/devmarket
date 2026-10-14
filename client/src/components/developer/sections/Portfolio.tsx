import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Reveal from "@/components/developer/Reveal";
import SectionTitle from "@/components/developer/SectionTitle";
import { PROJECTS, filterProjects, type ProjectKind } from "@/lib/developerContent";

type Filter = ProjectKind | "ALL";

/**
 * Selected work.
 *
 * Filtering animates with `AnimatePresence` + `layout` so cards slide into the
 * grid instead of snapping. `layout` only wraps the list that actually changes,
 * never the whole page — Motion has to measure the elements it animates, and
 * measuring everything on a page this long is measurable work for no visual gain.
 *
 * Hover/focus on a card drives the dark detail panel beside it. Focus is wired
 * up as well as hover so the panel is reachable by keyboard.
 */
export default function Portfolio() {
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [activeId, setActiveId] = useState(PROJECTS[0].id);

  const visible = filterProjects(PROJECTS, filter);
  // Keep the detail panel pointing at something that is still on screen when
  // the active project gets filtered out.
  const active = visible.find(project => project.id === activeId) ?? visible[0] ?? PROJECTS[0];

  return (
    <section id="portfolio" className="scroll-mt-28 border-y border-[#d7e8eb] bg-[#e9f7f6] py-20 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-5 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionTitle
            eyebrow="Selected experiments"
            title="A portfolio in motion."
            lede="Hover or focus a project to read the thinking behind it, or filter by the kind of problem I’m exploring."
          />

          <Reveal delay={0.1}>
            <div
              role="group"
              aria-label="Filter projects by type"
              className="flex flex-wrap gap-1 rounded-full border border-[#b9d6db] bg-[#f8ffff] p-1"
            >
              {[
                { id: "ALL" as Filter, label: "All work" },
                { id: "AI" as Filter, label: "AI systems" },
                { id: "WEB" as Filter, label: "Web builds" },
                { id: "AUTO" as Filter, label: "Automation" },
              ].map(option => (
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

        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_.75fr]">
          {/*
            No `layout` prop here, and no `mode="popLayout"` on AnimatePresence.

            `popLayout` sets `position: absolute` on exiting children and removes
            them only once their exit animation settles. Combined with `layout`
            on both the list and the items that settle never happens: the
            filtered-out cards stay in the DOM at full opacity, stacked on top of
            the one card that should be visible. Filtering animates opacity and
            scale only, which cannot get stuck.
          */}
          <ul className="grid content-start gap-4 sm:grid-cols-2">
            <AnimatePresence initial={false}>
              {visible.map(project => (
                <motion.li
                  key={project.id}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, transition: { duration: 0.16 } }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setActiveId(project.id)}
                    onFocus={() => setActiveId(project.id)}
                    onClick={() => setActiveId(project.id)}
                    aria-pressed={active.id === project.id}
                    className={`group h-full w-full rounded-[1.5rem] border p-6 text-left transition duration-200 ease-[cubic-bezier(.23,1,.32,1)] hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(23,32,57,.12)] ${
                      active.id === project.id
                        ? "border-[#13b8b0] bg-[#f8ffff]"
                        : "border-[#d7e8eb] bg-[#f8ffff]/60 hover:border-[#13b8b0]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d9f8f6] font-mono text-xs font-bold text-[#0b7c77]">
                        {String(PROJECTS.findIndex(item => item.id === project.id) + 1).padStart(2, "0")}
                      </span>
                      <span className="shrink-0 rounded-full bg-[#c7f76d] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.12em] text-[#172039]">
                        {project.kind}
                      </span>
                    </div>

                    <h3 className="mt-10 font-display text-xl font-semibold tracking-[-.04em] text-[#172039] transition-colors duration-200 group-hover:text-[#0b7c77]">
                      {project.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#53617d]">{project.copy}</p>

                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#172039]">
                      Explore thinking
                      <ArrowUpRight size={15} className="transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
                    </span>
                  </button>
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
            className="relative h-fit overflow-hidden rounded-[1.75rem] bg-[#172039] p-7 text-white md:p-9"
          >
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#13b8b0]/25" />
            <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#7658f5]/20" />

            <div aria-live="polite" className="relative flex h-full flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[.18em] text-[#c7f76d]">Now exploring</span>
                  <motion.span
                    aria-hidden="true"
                    animate={reduceMotion ? {} : { rotate: [0, 14, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="text-[#c7f76d]"
                  >
                    <Sparkles size={20} />
                  </motion.span>
                </div>
                <h3 className="mt-10 font-display text-4xl font-semibold leading-[.9] tracking-[-.07em]">{active.title}</h3>
                <p className="mt-5 text-base leading-8 text-white/70">{active.copy}</p>
              </div>

              <div className="mt-10">
                <p className="font-mono text-[10px] uppercase tracking-[.16em] text-white/45">Project signal</p>
                <p className="mt-2 font-display text-2xl font-semibold text-[#13b8b0]">{active.outcome}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {active.stack.map(item => (
                    <li key={item} className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/75">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}