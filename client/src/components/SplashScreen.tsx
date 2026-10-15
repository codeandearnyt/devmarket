import DevMarketIcon from "@/assets/dev-market-icon.png";
import LoadingAnimation from "./LoadingAnimation";

/**
 * Brand splash shown while the app's first chunk parses.
 *
 * This used to hold the screen for a fixed five seconds, so a first-time visitor
 * watched a logo while the app it was covering was already mounted and
 * interactive. It is now purely reactive: the parent unmounts it as soon as the
 * router has painted.
 *
 * Two constraints shaped this component:
 *
 * 1. No timer of its own. Any delay here lands directly on time-to-first-paint.
 * 2. No framer-motion. This renders before the app does, so pulling a 110 kB
 *    animation library into the critical path to fade one div was a bad trade.
 *    Plain CSS transitions do the same job for free.
 *
 * `pointer-events-none` matters: the splash is a cover over a live, interactive
 * app. It must never swallow a click meant for the page underneath.
 */
export default function SplashScreen({ exiting = false }: { exiting?: boolean }) {
  return (
    <div
      aria-label="Loading DevMarket"
      role="status"
      className={`splash-root pointer-events-none fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#172039] ${
        exiting ? "splash-root-out" : ""
      }`}
    >
      {/* ambient light */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 42%, rgba(199,247,109,0.16) 0%, rgba(19,184,176,0.10) 45%, rgba(23,32,57,0) 78%)",
        }}
      />
      {/* faint grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #a3e0e6 1px, transparent 1px), linear-gradient(to bottom, #a3e0e6 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(70% 60% at 50% 50%, #000 0%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(70% 60% at 50% 50%, #000 0%, transparent 100%)",
        }}
      />

      <div className="splash-content relative z-10 flex flex-col items-center px-6">
        <img
          src={DevMarketIcon}
          alt="DevMarket"
          draggable={false}
          className="splash-logo h-24 w-24 select-none object-contain drop-shadow-[0_10px_28px_rgba(199,247,109,0.28)] sm:h-28 sm:w-28"
        />

        <p className="splash-item mt-4 font-display text-3xl font-bold tracking-[-.05em] text-white sm:text-4xl">
          Dev<span className="text-[#13b8b0]">Market</span>
        </p>

        <div className="splash-item mt-7">
          <LoadingAnimation size={132} label="Loading DevMarket" />
        </div>

        <p className="splash-item mt-1 font-mono text-[11px] uppercase tracking-[.28em] text-[#a3e0e6]/70">
          Bootstrapping marketplace
        </p>
      </div>
    </div>
  );
}