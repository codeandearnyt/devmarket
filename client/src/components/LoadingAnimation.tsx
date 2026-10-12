import { Lottie } from "lottie-react";
import { useEffect, useState } from "react";
import { loaderAnimation } from "./loaderAnimation";

type LoadingAnimationProps = {
  /** Rendered size in px (square). */
  size?: number;
  className?: string;
  /** Accessible label announced to screen readers. */
  label?: string;
};

/**
 * Read the OS "reduce motion" preference.
 *
 * This used to come from framer-motion, but this component sits on the very
 * first paint of the app, and framer-motion was being downloaded — and parsed —
 * before anything could be shown. A media query is a few lines and costs
 * nothing, which is the right trade for a loader.
 */
function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduce(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduce;
}

/**
 * Brand-matched Lottie loader ("Code Orbit").
 * Used as the route-transition fallback and underneath the splash logo.
 */
export default function LoadingAnimation({
  size = 120,
  className = "",
  label = "Loading DevMarket",
}: LoadingAnimationProps) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Lottie
        src={loaderAnimation}
        loop={!reduceMotion}
        autoplay
        // Respect reduced-motion: hold a single representative frame instead of spinning.
        segment={reduceMotion ? [30, 30] : undefined}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}