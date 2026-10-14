import Reveal from "@/components/developer/Reveal";
import SectionTitle from "@/components/developer/SectionTitle";
import { PRINCIPLES } from "@/lib/developerContent";

/** Six working principles. Hairline-separated rows rather than a card grid. */
export default function Principles() {
  return (
    <section id="principles" className="mx-auto max-w-[1280px] scroll-mt-28 px-5 pb-20 lg:px-8 lg:pb-24">
      <SectionTitle title="The standard I’m aiming for." />

      <Reveal className="mt-12 grid gap-x-10 sm:grid-cols-2">
        {PRINCIPLES.map(principle => (
          <article key={principle.id} className="group flex gap-5 border-t border-[#d7e8eb] py-6">
            <span className="font-mono text-sm text-[#13b8b0] transition-transform duration-200 ease-[cubic-bezier(.23,1,.32,1)] group-hover:-translate-y-0.5">
              {principle.number}
            </span>
            <div>
              <h3 className="font-display text-xl font-semibold tracking-[-.03em] text-[#172039]">{principle.title}</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#53617d]">{principle.copy}</p>
            </div>
          </article>
        ))}
      </Reveal>
    </section>
  );
}