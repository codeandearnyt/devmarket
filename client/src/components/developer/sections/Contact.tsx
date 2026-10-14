import { Mail, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Reveal from "@/components/developer/Reveal";
import { CONTACT } from "@/lib/developerContent";

/** Closing call to action. */
export default function Contact() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="border-t border-white/80 bg-white/38 py-20 lg:py-24"
    >
      <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-9 px-5 md:flex-row md:items-end lg:px-8">
        <div>
          <Reveal>
            <h2
              id="contact-heading"
              className="max-w-2xl font-display text-4xl font-semibold leading-[.95] tracking-[-.07em] text-[#172039] md:text-5xl"
            >
              {CONTACT.heading}
            </h2>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#53617d]">{CONTACT.copy}</p>
          </Reveal>

          <Reveal delay={0.14}>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              {CONTACT.notes.map(note => (
                <li key={note} className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.14em] text-[#71809f]">
                  <MapPin size={12} className="text-[#13b8b0]" aria-hidden="true" />
                  {note}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* The button holds a soft glow that settles into place — the accent
            motion on an otherwise still page, so it actually gets noticed. */}
        <Reveal delay={0.1} className="shrink-0">
          <motion.div
            animate={reduceMotion ? {} : { boxShadow: ["0 0 0 0 rgba(19,184,176,0)", "0 0 0 14px rgba(19,184,176,0)", "0 0 0 0 rgba(19,184,176,0)"] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
            className="rounded-full"
          >
            <a
              href={CONTACT.cta.href}
              className="btn inline-flex min-h-12 items-center rounded-full bg-[#13b8b0] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#172039]"
            >
              <Mail className="mr-2" size={16} aria-hidden="true" />
              {CONTACT.cta.label}
            </a>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}