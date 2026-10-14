import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import Reveal from "@/components/developer/Reveal";
import SectionTitle from "@/components/developer/SectionTitle";
import { FAQ_ITEMS } from "@/lib/developerContent";

/**
 * FAQ.
 *
 * Built on Radix's Accordion primitive rather than a hand-rolled disclosure.
 * The hand-rolled version lost keyboard focus to `<body>` the moment a panel
 * toggled — a real accessibility failure, because the next Tab press restarts
 * from the top of a page that is ~19,000px tall on a phone. Radix moves focus
 * with the interaction and keeps the roving focus order between headers.
 *
 * The project's shadcn wrapper is deliberately not reused here because it leans
 * on colour utilities (`text-muted-foreground`, `bg-background`) that this app
 * never defines, so the text would render unstyled. The underlying primitive and
 * the animation classes (`animate-accordion-*`, provided by tailwindcss-animate)
 * are the same ones the wrapper uses.
 *
 * Radix supplies the accessibility semantics: `aria-expanded` on the trigger,
 * the trigger/panel `aria-controls`/`aria-labelledby` pairing, hidden panels
 * removed from the tab order, and Arrow/Home/End navigation between headers.
 */
export default function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-[1280px] scroll-mt-28 px-5 pb-20 lg:px-8 lg:pb-24">
      <SectionTitle title="Questions people actually ask." lede="Short answers, so you do not have to ask to find out." />

      <Reveal className="mt-12 max-w-3xl">
        <AccordionPrimitive.Root
          type="single"
          collapsible
          defaultValue={FAQ_ITEMS[0].id}
          className="overflow-hidden rounded-[1.5rem] border border-[#d7e8eb] bg-[#f8ffff]/60"
        >
          {FAQ_ITEMS.map(item => (
            <AccordionPrimitive.Item key={item.id} value={item.id} className="border-b border-[#d7e8eb] last:border-b-0">
              <AccordionPrimitive.Header>
                <AccordionPrimitive.Trigger
                  className="group flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left font-display text-[1.0625rem] font-semibold text-[#172039] transition-colors duration-150 hover:text-[#0b7c77] data-[state=open]:text-[#0b7c77]"
                >
                  {item.question}
                  {/* Decorative: the expanded state is already exposed on
                      aria-expanded, and the icon is hidden from the tree. */}
                  <Plus
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-[#13b8b0] transition-transform duration-200 group-data-[state=open]:rotate-45"
                  />
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>

              <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <p className="px-5 pb-5 text-sm leading-7 text-[#53617d]">{item.answer}</p>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          ))}
        </AccordionPrimitive.Root>
      </Reveal>
    </section>
  );
}