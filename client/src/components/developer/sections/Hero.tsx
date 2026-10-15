import { ArrowUpRight, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { HERO } from "@/lib/developerContent";

/**
 * Hero.
 *
 * Entrance is a short stagger rather than one large move: the eyebrow lands
 * first, then the name, then the supporting line, then the actions. The motion
 * reinforces the reading order instead of competing with it.
 *
 * Everything here collapses to a static render under `prefers-reduced-motion` —
 * including the portrait drift, the sparkle loop and the hover rotation.
 */
export default function Hero() {
  const reduceMotion = useReducedMotion();

  const rise = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section className="relative mx-auto max-w-[1280px] px-5 pb-20 pt-28 lg:px-8 lg:pb-28 lg:pt-36">
      <div className="grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
        <div className="order-2 lg:order-1">
          <motion.p {...rise(0)} className="font-mono text-[11px] uppercase tracking-[.22em] text-[#13b8b0]">
            {HERO.eyebrow}
          </motion.p>

          <motion.h1
            {...rise(0.06)}
            className="mt-5 max-w-2xl font-display text-[clamp(3.4rem,8vw,7.4rem)] font-semibold leading-[.84] tracking-[-.1em] text-[#172039]"
          >
            {HERO.name}
            <br />
            <span className="type-script text-[#13b8b0]">{HERO.nameAccent}</span>
          </motion.h1>

          <motion.p {...rise(0.12)} className="mt-8 max-w-xl text-lg leading-8 text-[#53617d] md:text-xl">
            {HERO.headline}
          </motion.p>

          <motion.div {...rise(0.18)} className="mt-9 flex flex-wrap gap-3">
            <a
              href={HERO.primaryCta.href}
              className="btn inline-flex min-h-12 items-center rounded-full bg-[#172039] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#0b7c77]"
            >
              {HERO.primaryCta.label}
              <ArrowUpRight className="ml-2" size={16} aria-hidden="true" />
            </a>
            <a
              href={HERO.secondaryCta.href}
              className="btn inline-flex min-h-12 items-center rounded-full border border-[#b9d6db] bg-white/45 px-6 py-3.5 text-sm font-semibold text-[#172039] hover:border-[#13b8b0]"
            >
              {HERO.secondaryCta.label}
            </a>
          </motion.div>

          <motion.dl {...rise(0.24)} className="mt-12 grid max-w-lg grid-cols-3 gap-3">
            {HERO.stats.map(stat => (
              <div key={stat.id} className="glass rounded-2xl p-4">
                <dd className="font-display text-2xl font-semibold text-[#172039]">{stat.value}</dd>
                <dt className="mt-1 font-mono text-[9px] uppercase tracking-[.12em] text-[#71809f]">{stat.label}</dt>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Portrait */}
        <motion.div {...rise(0.14)} className="order-1 relative mx-auto w-full max-w-[560px] lg:order-2 lg:justify-self-end">
          {/* Reuses the site's existing `liquidDriftA` keyframe rather than
              adding a second floating animation to the stylesheet. */}
          <div className={reduceMotion ? "" : "animate-[liquidDriftA_9s_ease-in-out_infinite]"}>
            <div className="relative rotate-2 overflow-hidden rounded-[2.5rem] border-[10px] border-[#172039] bg-[#172039] shadow-[0_28px_70px_rgba(23,32,57,.22)] transition-transform duration-500 ease-[cubic-bezier(.23,1,.32,1)] hover:rotate-0">
              <img
                src={HERO.portrait.src}
                alt={HERO.portrait.alt}
                width={1120}
                height={1120}
                decoding="async"
                fetchPriority="high"
                className="aspect-square w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#172039]/85 via-[#172039]/20 to-transparent p-7 pt-24 text-white">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#c7f76d]">
                      {HERO.portrait.badge}
                    </p>
                    <p className="mt-2 font-display text-2xl font-semibold">{HERO.portrait.tagline}</p>
                  </div>
                  <motion.span
                    aria-hidden="true"
                    animate={reduceMotion ? {} : { rotate: [0, 12, -8, 0], scale: [1, 1.12, 1] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="text-[#c7f76d]"
                  >
                    <Sparkles size={26} />
                  </motion.span>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            aria-hidden="true"
            {...(reduceMotion
              ? {}
              : {
                  initial: { opacity: 0, scale: 0.8 },
                  animate: { opacity: 1, scale: 1 },
                  transition: { duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] },
                })}
            className="absolute -bottom-7 -left-7 rounded-full border border-white/90 bg-white/80 px-5 py-4 text-center font-mono text-[10px] uppercase leading-4 tracking-[.1em] shadow-lg"
          >
            {HERO.portrait.stamp.split("\n").map(line => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}