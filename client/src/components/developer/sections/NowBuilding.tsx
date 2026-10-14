import Reveal, { StaggerGroup, StaggerItem } from "@/components/developer/Reveal";
import SectionTitle from "@/components/developer/SectionTitle";
import { NOW_BUILDING } from "@/lib/developerContent";

const STATUS_STYLES: Record<string, string> = {
  "In progress": "bg-[#c7f76d] text-[#172039]",
  Learning: "bg-[#d9f8f6] text-[#0b7c77]",
};

/** Three things currently in flight, with an honest status on each. */
export default function NowBuilding() {
  return (
    <section id="now" className="mx-auto max-w-[1280px] scroll-mt-28 px-5 py-20 lg:px-8 lg:py-24">
      <SectionTitle title="What is open on my desk right now." lede="Work in progress, kept visible so the progress is legible from the outside." />

      <StaggerGroup className="mt-12 grid gap-4 md:grid-cols-3">
        {NOW_BUILDING.map(item => (
          <StaggerItem key={item.id} className="h-full">
            <article className="flex h-full flex-col rounded-[1.5rem] border border-[#d7e8eb] bg-[#f8ffff]/60 p-6 transition duration-200 ease-[cubic-bezier(.23,1,.32,1)] hover:border-[#13b8b0] hover:shadow-[0_14px_36px_rgba(23,32,57,.09)]">
              {/* status pill doubles as the card's only accent */}
              <span
                className={`w-fit rounded-full px-3 py-1 font-mono text-[9px] uppercase tracking-[.12em] ${
                  STATUS_STYLES[item.status] ?? "bg-[#eef8fa] text-[#53617d]"
                }`}
              >
                {item.status}
              </span>

              <h3 className="mt-5 font-display text-lg font-semibold tracking-[-.03em] text-[#172039]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#53617d]">{item.copy}</p>
            </article>
          </StaggerItem>
        ))}
      </StaggerGroup>

      <Reveal delay={0.12}>
        <p className="mt-8 max-w-2xl text-sm leading-6 text-[#71809f]">
          Nothing here is finished, and nothing here is presented as finished. If one of these solves your problem
          sooner than it solves mine, say so.
        </p>
      </Reveal>
    </section>
  );
}