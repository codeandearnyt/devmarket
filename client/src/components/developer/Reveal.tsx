import { motion, useReducedMotion } from "framer-motion";
import { createElement, type ComponentType, type ElementType, type ReactNode } from "react";

export const REVEAL_EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Scroll-reveal primitive for the developer profile.
 *
 * Uses Motion's `whileInView` (IntersectionObserver under the hood) rather than a
 * scroll listener — a `scroll` handler would fire on every frame and is the main
 * cause of jank on a long page.
 *
 * `once: true` stops the reveal replaying every time an element re-enters the
 * viewport. `amount: "some"` fires as soon as any part is visible rather than
 * demanding a fraction of the whole element, which avoids tall cards staying
 * invisible on a short window.
 *
 * When the visitor prefers reduced motion the wrapper renders a plain element
 * with no animation at all, so nothing is ever hidden behind motion that will
 * not run.
 *
 * The animated element is typed by hand because `motion()` cannot infer props
 * through a dynamic `ElementType`, and `createElement` is used for the same
 * reason on the reduced-motion branch.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 22,
  x = 0,
  duration = 0.55,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  /** Travel distance on the Y axis, in pixels. Animate transform only. */
  y?: number;
  x?: number;
  duration?: number;
  className?: string;
  as?: ElementType;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return createElement(Tag, { className }, children);
  }

  const MotionTag = motion(Tag as "div") as unknown as ComponentType<{
    className?: string;
    initial: { opacity: number; x: number; y: number };
    whileInView: { opacity: number; x: number; y: number };
    viewport: { once: boolean; amount: "some" | "all" | number; margin: string };
    transition: { duration: number; delay: number; ease: readonly number[] };
    children?: ReactNode;
  }>;

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: "some", margin: "0px 0px -80px 0px" }}
      transition={{ duration, delay, ease: REVEAL_EASE }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Container that staggers its `RevealItem` children on first scroll into view.
 * The parent and the items share one variant tree, which is what makes the
 * stagger work.
 */
export const staggerParent = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: REVEAL_EASE } },
};

/**
 * Standalone stagger item. Exported separately so a list can stagger while its
 * surrounding section stays a plain element.
 */
export function StaggerItem({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return createElement(Tag, { className }, children);

  const MotionTag = motion(Tag as "div") as unknown as ComponentType<{
    className?: string;
    variants: typeof staggerItem;
    children?: ReactNode;
  }>;

  return (
    <MotionTag className={className} variants={staggerItem}>
      {children}
    </MotionTag>
  );
}

/** Wrapper that drives the stagger variants above. */
export function StaggerGroup({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return createElement(Tag, { className }, children);

  const MotionTag = motion(Tag as "div") as unknown as ComponentType<{
    className?: string;
    variants: typeof staggerParent;
    viewport: { once: boolean; amount: "some" | number; margin: string };
    initial: "hidden";
    whileInView: "visible";
    children?: ReactNode;
  }>;

  return (
    <MotionTag
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: "some", margin: "0px 0px -60px 0px" }}
    >
      {children}
    </MotionTag>
  );
}