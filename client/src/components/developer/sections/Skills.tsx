import Reveal, { StaggerGroup, StaggerItem } from "@/components/developer/Reveal";
import SectionTitle from "@/components/developer/SectionTitle";
import { SKILL_CLUSTERS, SKILL_STAGE_STYLES } from "@/lib/developerContent";

/**
 * The tech pill. `rounded-md bg-[#eef8fa] px-2 py-1 font-mono text-[10px]
 * uppercase tracking-[.08em] text-[#53617d]` is the shared shape; a tag that maps
 * to a brand also carries that brand's mark at 12px so the pill reads as a
 * technology rather than a word.
 */
function TechPill({ label, slug }: { label: string; slug?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#eef8fa] px-2 py-1 font-mono text-[10px] uppercase tracking-[.08em] text-[#53617d]">
      {slug ? (
        <img src={`/logos/${slug}.svg`} alt="" width={12} height={12} loading="lazy" decoding="async" className="h-3 w-3 shrink-0" />
      ) : null}
      {label}
    </span>
  );
}

/**
 * Sixteen skills across four numbered clusters.
 *
 * Hierarchy is the point of this section: page (h2) > cluster (h3, numbered) >
 * skill (h4) > pill. The cluster number sits beside the title so a reader can see
 * at a glance which of the four areas a card belongs to without reading it.
 *
 * The cluster is the layout unit rather than one flat 16-card grid: a grid that
 * long reads as a wall, whereas four titled clusters let a reader scan by area
 * and skip what is not relevant to them.
 *
 * `stage` (Learning / Building / Shipping) replaces the usual proficiency bar on
 * purpose — a percentage would imply a measured claim that nothing backs up.
 */
export default function Skills() {
  return (
    <section id="work" className="mx-auto max-w-[1280px] scroll-mt-28 px-5 py-20 lg:px-8 lg:py-24">
      <SectionTitle
        index="03"
        eyebrow="Core capabilities"
        title="Sixteen skills, four areas."
        lede="A toolkit shaped by hands-on experiments, responsible AI use, and the desire to make digital work feel simpler."
      />

      {/* The cluster grid. One column on phones, two from lg — never three,
          because four cards across a third of the screen leaves each card too
          narrow for its description to stay on two lines. */}
      <div className="mt-14 grid gap-x-12 gap-y-16 lg:grid-cols-2">
        {SKILL_CLUSTERS.map((cluster, clusterIndex) => (
          <Reveal key={cluster.id} delay={clusterIndex * 0.05}>
            <section aria-labelledby={`cluster-${cluster.id}`}>
              {/* cluster header — the divider plus number is what makes the
                  four areas read as four areas rather than sixteen cards. */}
              <div className="flex items-baseline gap-4 border-t border-[#172039]/15 pt-5">
                <span className="type-mono text-sm font-semibold text-[#13b8b0]">{String(clusterIndex + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <h3 id={`cluster-${cluster.id}`} className="font-display text-xl font-semibold tracking-[-.04em] text-[#172039]">
                    {cluster.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#53617d]">{cluster.blurb}</p>
                </div>
                <span className="type-mono shrink-0 text-[10px] font-semibold uppercase tracking-[.14em] text-[#71809f]">
                  {cluster.skills.length}
                </span>
              </div>

              <StaggerGroup className="mt-6 grid gap-3 sm:grid-cols-2">
                {cluster.skills.map(skill => {
                  const Icon = skill.icon;
                  return (
                    <StaggerItem key={skill.id} className="h-full">
                      <article className="glass group flex h-full flex-col rounded-[1.5rem] p-5 transition duration-200 ease-[cubic-bezier(.23,1,.32,1)] hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(23,32,57,.12)]">
                        <div className="flex items-start justify-between gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d9f8f6] p-2 transition-colors duration-200 group-hover:bg-[#13b8b0]">
                            {/* Brand mark where one exists, otherwise the
                                practice icon. A 24px logo is scaled to 18px
                                inside the 40px tile so it is not cramped. */}
                            {skill.logo ? (
                              <img
                                src={`/logos/${skill.logo}.svg`}
                                alt=""
                                width={18}
                                height={18}
                                loading="lazy"
                                decoding="async"
                                className="h-[18px] w-[18px]"
                              />
                            ) : (
                              <Icon size={18} className="text-[#0b7c77] transition-colors duration-200 group-hover:text-white" aria-hidden="true" />
                            )}
                          </span>
                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.12em] ${SKILL_STAGE_STYLES[skill.stage]}`}
                          >
                            {skill.stage}
                          </span>
                        </div>

                        <h4 className="mt-5 font-display text-lg font-semibold tracking-[-.03em] text-[#172039]">
                          {skill.title}
                        </h4>
                        <p className="mt-2 flex-1 text-sm leading-6 text-[#53617d]">{skill.copy}</p>

                        <ul className="mt-4 flex flex-wrap gap-1.5">
                          {skill.tags.map(tag => (
                            <li key={tag.label}>
                              <TechPill label={tag.label} slug={tag.slug} />
                            </li>
                          ))}
                        </ul>
                      </article>
                    </StaggerItem>
                  );
                })}
              </StaggerGroup>
            </section>
          </Reveal>
        ))}
      </div>
    </section>
  );
}