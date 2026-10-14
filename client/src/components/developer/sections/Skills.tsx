import Reveal, { StaggerGroup, StaggerItem } from "@/components/developer/Reveal";
import SectionTitle from "@/components/developer/SectionTitle";
import { SKILL_CLUSTERS, SKILL_STAGE_STYLES } from "@/lib/developerContent";

/**
 * Sixteen skills across four clusters.
 *
 * The cluster is the layout unit rather than a flat 16-card grid: a grid that
 * long reads as a wall, whereas four titled clusters let a reader scan by area
 * and skip what is not relevant to them.
 *
 * `stage` (Learning / Building / Shipping) replaces the usual proficiency bar on
 * purpose — a percentage would imply a measured claim that nothing backs up.
 */
export default function Skills() {
  return (
    <section id="work" className="mx-auto max-w-[1280px] scroll-mt-28 px-5 py-20 lg:px-8 lg:py-24">
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SectionTitle
          eyebrow="Core capabilities"
          title="Sixteen skills, four areas."
          lede="A toolkit shaped by hands-on experiments, responsible AI use, and the desire to make digital work feel simpler."
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-14">
        {SKILL_CLUSTERS.map((cluster, clusterIndex) => (
          <Reveal key={cluster.id} delay={clusterIndex * 0.06}>
            <div className="border-t border-[#d7e8eb] pt-6">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-xl font-semibold tracking-[-.04em] text-[#172039]">{cluster.title}</h3>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[.16em] text-[#71809f]">
                  {cluster.skills.length} skills
                </span>
              </div>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#53617d]">{cluster.blurb}</p>

              <StaggerGroup className="mt-6 grid gap-3 sm:grid-cols-2">
                {cluster.skills.map(skill => {
                  const Icon = skill.icon;
                  return (
                    <StaggerItem key={skill.id} className="h-full">
                      <article className="glass group h-full rounded-[1.5rem] p-5 transition duration-200 ease-[cubic-bezier(.23,1,.32,1)] hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(23,32,57,.12)]">
                        <div className="flex items-start justify-between gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d9f8f6] text-[#0b7c77] transition-colors duration-200 group-hover:bg-[#13b8b0] group-hover:text-white">
                            <Icon size={18} aria-hidden="true" />
                          </span>
                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.12em] ${
                              SKILL_STAGE_STYLES[skill.stage]
                            }`}
                          >
                            {skill.stage}
                          </span>
                        </div>

                        <h4 className="mt-5 font-display text-lg font-semibold tracking-[-.03em] text-[#172039]">
                          {skill.title}
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-[#53617d]">{skill.copy}</p>

                        <ul className="mt-4 flex flex-wrap gap-1.5">
                          {skill.tags.map(tag => (
                            <li
                              key={tag}
                              className="rounded-md bg-[#eef8fa] px-2 py-1 font-mono text-[10px] uppercase tracking-[.08em] text-[#53617d]"
                            >
                              {tag}
                            </li>
                          ))}
                        </ul>
                      </article>
                    </StaggerItem>
                  );
                })}
              </StaggerGroup>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}