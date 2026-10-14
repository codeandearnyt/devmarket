import { lazy, Suspense, useEffect } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import ScrollDepthBackground from "@/components/ScrollDepthBackground";
import "@/styles/developer.css";
import Hero from "@/components/developer/sections/Hero";
import Story from "@/components/developer/sections/Story";
import TechStack from "@/components/developer/sections/TechStack";
import Skills from "@/components/developer/sections/Skills";
import Portfolio from "@/components/developer/sections/Portfolio";

/**
 * Everything below the portfolio is split out. The route itself is already
 * lazy-loaded from `App.tsx`, and this second layer keeps the first paint to the
 * hero + story + skills without waiting on Framer Motion's larger section
 * modules or on the whole portfolio grid.
 */
const Journey = lazy(() => import("@/components/developer/sections/Journey"));
const Services = lazy(() => import("@/components/developer/sections/Services"));
const NowBuilding = lazy(() => import("@/components/developer/sections/NowBuilding"));
const AiApproach = lazy(() => import("@/components/developer/sections/AiApproach"));
const Principles = lazy(() => import("@/components/developer/sections/Principles"));
const Faq = lazy(() => import("@/components/developer/sections/Faq"));
const Contact = lazy(() => import("@/components/developer/sections/Contact"));

/**
 * `/developer` — personal profile.
 *
 * Section order is deliberate: identity and hero, then the story, then proof
 * (tools → skills → work), then context (journey, services, what is in
 * progress), then position (principles, questions), then the ask.
 *
 * All copy lives in `lib/developerContent.ts`.
 */
export default function Developer() {
  useEffect(() => {
    document.title = "Nitin Sharma — Developer Profile | DevMarket";
  }, []);

  return (
    <div className="dev-profile liquid-page min-h-screen overflow-hidden bg-[#eef8fa] text-[#172039]">
      <ScrollDepthBackground />
      <SiteHeader />

      {/* This page runs to roughly 19,000px on a phone, so a skip link is the
          difference between one Tab and one very long walk. */}
      <a href="#developer-main" className="dev-skip-link">
        Skip to content
      </a>

      <main id="developer-main">
        <Hero />
        <Story />
        <TechStack />
        <Skills />
        <Portfolio />

        {/* Placeholder rows keep the scrollbar honest while these chunks land,
            so the page does not jump under the reader. */}
        <Suspense fallback={<div className="px-5 py-20 lg:px-8" aria-hidden="true" />}>
          <Journey />
          <Services />
          <NowBuilding />
          <AiApproach />
          <Principles />
          <Faq />
          <Contact />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}