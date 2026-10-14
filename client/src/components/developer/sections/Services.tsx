import { Check } from "lucide-react";
import Reveal, { StaggerGroup, StaggerItem } from "@/components/developer/Reveal";
import SectionTitle from "@/components/developer/SectionTitle";
import { SERVICES } from "@/lib/developerContent";

/** What I can be hired to do, and what each engagement actually includes. */
export default function Services() {
  return (
    <section id="services" className="scroll-mt-28 border-y border-white/80 bg-white/38 py-20 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-5 lg:px-8">
        <SectionTitle
          index="06"
          eyebrow="How we can work together"
          title="Fourteen kinds of help."
          lede="Small, well-scoped builds where I can finish the whole thing and hand it over properly."
        />

        <StaggerGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(service => {
            const Icon = service.icon;
            return (
              <StaggerItem key={service.id} className="h-full">
                <article className="glass group h-full rounded-[1.75rem] p-7 transition duration-200 ease-[cubic-bezier(.23,1,.32,1)] hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(23,32,57,.12)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d9f8f6] text-[#0b7c77] transition-colors duration-200 group-hover:bg-[#13b8b0] group-hover:text-white">
                    <Icon size={22} aria-hidden="true" />
                  </span>

                  <h3 className="mt-6 font-display text-2xl font-semibold tracking-[-.05em] text-[#172039]">
                    {service.title}
                  </h3>
                  <p className="mt-3 max-w-md leading-7 text-[#53617d]">{service.copy}</p>

                  <ul className="mt-6 space-y-2.5 border-t border-[#d7e8eb] pt-5">
                    {service.points.map(point => (
                      <li key={point} className="flex items-start gap-3 text-sm text-[#53617d]">
                        <Check size={15} className="mt-0.5 shrink-0 text-[#13b8b0]" aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}