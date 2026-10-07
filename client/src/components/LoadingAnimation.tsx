import { Lottie } from "lottie-react";
import { useReducedMotion } from "framer-motion";
import { loaderAnimation } from "./loaderAnimation";

type LoadingAnimationProps = {
  /** Rendered size in px (square). */
  size?: number;
  className?: string;
  /** Accessible label announced to screen readers. */
  label?: string;
};

/**
 * Brand-matched Lottie loader ("Code Orbit").
 * Used as the route-transition fallback and underneath the splash logo.
 */
export default function LoadingAnimation({
  size = 120,
  className = "",
  label = "Loading DevMarket",
}: LoadingAnimationProps) {
  const reduceMotion = useReducedMotion();

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