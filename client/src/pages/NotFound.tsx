import { Link } from "wouter";
import { ArrowLeft, Compass, Home } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ScrollDepthBackground from "@/components/ScrollDepthBackground";
import { useEffect } from "react";

const suggestions = [
  { label: "Explore the library", href: "/#explore", copy: "Browse production-ready code and prompts." },
  { label: "Read the blog", href: "/blog", copy: "Practical notes on shipping digital work." },
  { label: "Meet the developer", href: "/developer", copy: "See what is being built and why." },
];

export default function NotFound() {
  useEffect(() => {
    document.title = "Page not found | DevMarket";
  }, []);

  return (
    <div className="liquid-page min-h-screen overflow-hidden bg-[#eef8fa] text-[#172039]">
      <ScrollDepthBackground />
      <SiteHeader />

      <main className="mx-auto flex max-w-[1100px] flex-col items-center px-5 pb-24 pt-28 text-center lg:pt-36">
        <p className="font-mono text-[11px] uppercase tracking-[.22em] text-[#13b8b0]">
          Error / 404
        </p>

        <h1 className="mt-5 font-display text-[clamp(4rem,16vw,11rem)] font-semibold leading-[.82] tracking-[-.1em]">
          404
        </h1>

        <h2 className="mt-6 max-w-2xl font-display text-3xl font-semibold leading-[.95] tracking-[-.06em] sm:text-5xl">
          This page went <span className="text-[#13b8b0]">off the map.</span>
        </h2>

        <p className="mt-6 max-w-xl text-lg leading-8 text-[#53617d]">
          The link may be broken, or the page may have been moved. Nothing is lost —
          your library and account are exactly where you left them.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn inline-flex items-center rounded-full bg-[#172039] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#13b8b0]">
            <Home size={16} className="mr-2" /> Back to the marketplace
          </Link>
          <Link href="/login" className="btn inline-flex items-center rounded-full border border-[#b9d6db] bg-white/45 px-6 py-3.5 text-sm font-semibold transition hover:border-[#172039]">
            Go to my library <ArrowLeft size={16} className="ml-2" />
          </Link>
        </div>

        <div className="mt-16 grid w-full gap-3 sm:grid-cols-3">
          {suggestions.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="glass group rounded-[1.75rem] p-6 text-left transition duration-200 hover:-translate-y-1"
            >
              <Compass className="text-[#13b8b0]" size={20} />
              <h3 className="mt-8 font-display text-lg font-semibold tracking-[-.03em] transition group-hover:text-[#13b8b0]">
                {item.label}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#53617d]">{item.copy}</p>
            </Link>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}