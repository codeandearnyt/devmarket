import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import LoadingAnimation from "./LoadingAnimation";
import DevMarketIcon from "@/assets/dev-market-icon.png";

const SPLASH_MS = 5000;
const EXIT_MS = 450;

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const hold = setTimeout(() => setPhase("out"), SPLASH_MS);
    const done = setTimeout(onComplete, SPLASH_MS + EXIT_MS);
    return () => {
      clearTimeout(hold);
      clearTimeout(done);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === "out" ? 0 : 1 }}
      transition={{ duration: EXIT_MS / 1000, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#172039]"
      aria-label="Loading DevMarket"
      role="status"
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

      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.94 }}
        animate={
          phase === "out"
            ? { opacity: 0, y: -18, scale: 0.97 }
            : { opacity: 1, y: 0, scale: 1 }
        }
        transition={
          phase === "out"
            ? { duration: EXIT_MS / 1000, ease: "easeIn" }
            : { type: "spring", stiffness: 180, damping: 18 }
        }
        className="relative z-10 flex flex-col items-center px-6"
      >
        {/* logo */}
        <motion.img
          src={DevMarketIcon}
          alt="DevMarket"
          className="h-24 w-24 select-none object-contain drop-shadow-[0_10px_28px_rgba(199,247,109,0.28)] sm:h-28 sm:w-28"
          initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
          draggable={false}
        />

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-4 font-display text-3xl font-bold tracking-[-.05em] text-white sm:text-4xl"
        >
          dev<span className="text-[#13b8b0]">market</span>
        </motion.p>

        {/* loading animation under the logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-7"
        >
          <LoadingAnimation size={132} label="Loading DevMarket" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          className="mt-1 font-mono text-[11px] uppercase tracking-[.28em] text-[#a3e0e6]/70"
        >
          Bootstrapping marketplace
        </motion.p>

        {/* progress rail */}
        <div className="mt-6 h-[3px] w-40 overflow-hidden rounded-full bg-white/10 sm:w-52">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: SPLASH_MS / 1000, ease: "linear" }}
            className="h-full rounded-full bg-gradient-to-r from-[#13b8b0] via-[#c7f76d] to-[#13b8b0]"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}