import Reveal from "@/components/developer/Reveal";
import SectionTitle from "@/components/developer/SectionTitle";
import { STORY } from "@/lib/developerContent";

/**
 * Splits a paragraph around its `emphasis` substring.
 *
 * Doing it by name rather than by index or by hard-coded markup means the copy
 * stays editable in `developerContent.ts`: if the sentence changes and the
 * emphasised phrase moves, nothing here breaks.
 */
function renderParagraph(text: string, emphasis?: string) {
  if (!emphasis) return text;
  const at = text.indexOf(emphasis);
  if (at === -1) return text;

  return (
    <>
      {text.slice(0, at)}
      <strong className="text-[#172039]">{emphasis}</strong>
      {text.slice(at + emphasis.length)}
    </>
  );
}

export default function Story() {
  return (
    <section id="story" className="scroll-mt-28 border-y border-white/80 bg-white/38 py-20 lg:py-24">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-5 lg:grid-cols-[.72fr_1.28fr] lg:px-8">
        <div>
          <SectionTitle title={STORY.heading} />
          {/* The pull quote is the only place lime appears against the light
              palette, which is what makes it read as a highlight. */}
          <Reveal delay={0.15}>
            <blockquote className="mt-8 border-l-2 border-[#c7f76d] pl-5">
              <p className="font-display text-xl font-medium leading-8 tracking-[-.02em] text-[#172039]">
                {STORY.pullQuote}
              </p>
            </blockquote>
          </Reveal>
        </div>

        <Reveal delay={0.08} className="max-w-2xl">
          <div className="space-y-6 text-lg leading-8 text-[#53617d]">
            {STORY.paragraphs.map(paragraph => (
              <p key={paragraph.text.slice(0, 24)}>{renderParagraph(paragraph.text, paragraph.emphasis)}</p>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}