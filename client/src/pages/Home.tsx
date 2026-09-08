import { ArrowRight, Check, Code2, FolderOpen, Menu, Search, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useRealtime } from "@/hooks/useRealtime";

const FALLBACK_PRODUCTS = [
  { id: 1, title: "SaaS Starter Kit", slug: "saas-starter-kit", type: "PROJECT", shortDescription: "Ship your next subscription product with a polished auth and billing foundation.", description: "A full-stack SaaS foundation designed for small teams. Includes auth flows, billing-ready account pages, onboarding, and a clean admin surface.", price: 2499, discountPrice: 1799, thumbnailUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=85", techStack: ["React", "Node.js", "Postgres"], salesCount: 42 },
  { id: 2, title: "PromptOps Playbook", slug: "promptops-playbook", type: "PROMPT", shortDescription: "A practical library of prompts for research, writing, and product workflows.", description: "A deeply organized prompt library with reusable variables, evaluation checklists, and workflows for teams that want consistent AI output.", price: 799, discountPrice: 599, thumbnailUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=85", techStack: ["GPT-4", "Claude", "Notion"], salesCount: 31 },
  { id: 3, title: "Command Palette UI", slug: "command-palette-ui", type: "SOURCE_CODE", shortDescription: "A keyboard-first command menu with smooth motion and accessible interactions.", description: "Drop-in command palette components with fuzzy search, keyboard navigation, shortcuts, themes, and thoughtful empty states.", price: 1299, discountPrice: null, thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=85", techStack: ["TypeScript", "Tailwind", "Radix UI"], salesCount: 18 },
];

export type ProductCardData = typeof FALLBACK_PRODUCTS[number] & { categoryId?: number; fileUrl?: string; isFeatured?: boolean };

export function money(value: number) { return `₹${value.toLocaleString("en-IN")}`; }
export function typeLabel(type: string) { return type === "SOURCE_CODE" ? "Source code" : type === "PROMPT" ? "AI prompt" : "Full project"; }

export function ProductCard({ product, index = 0 }: { product: ProductCardData; index?: number }) {
  const current = product.discountPrice ?? product.price;
  return (
    <Link href={`/product/${product.slug}`}>
      <article className="card-lift group cursor-pointer overflow-hidden rounded-2xl border border-[#d7e8eb] bg-[#f8ffff] fade-up" style={{ animationDelay: `${index * 70}ms` }}>
        <div className="relative aspect-[1.35/1] overflow-hidden bg-[#e6e2d8]">
          <img src={product.thumbnailUrl} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          <div className="absolute left-4 top-4 rounded-full bg-[#f8ffffe8] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.16em] text-[#172039] glass-control">{typeLabel(product.type)}</div>
          <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#c7f76d] text-[#172039] opacity-0 transition group-hover:opacity-100"><ArrowRight size={18} /></div>
        </div>
        <div className="p-5">
          <div className="mb-2 flex items-center justify-between gap-3"><h3 className="font-display text-lg font-semibold tracking-[-.03em]">{product.title}</h3><span className="font-mono text-[10px] text-[#85857f]">{product.salesCount ?? 0} sold</span></div>
          <p className="min-h-[42px] text-sm leading-6 text-[#53617d]">{product.shortDescription}</p>
          <div className="mt-5 flex items-end justify-between border-t border-[#e9f7f6] pt-4"><div><span className="font-display text-xl font-semibold">{money(current)}</span>{product.discountPrice ? <span className="ml-2 text-sm text-[#a0a09a] line-through">{money(product.price)}</span> : null}</div><span className="text-xs font-semibold text-[#53617d]">Instant access</span></div>
        </div>
      </article>
    </Link>
  );
}

function Header({ live = false }: { live?: boolean }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  return <header className="relative z-20 border-b border-[#d7e8eb] bg-white/70">
    <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-5 lg:px-8">
      <Link href="/"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#172039] text-[#c7f76d]"><Code2 size={18} /></div><span className="font-display text-xl font-bold tracking-[-.05em]">dev<span className="text-[#13b8b0]">market</span></span></div></Link>
      <nav className="hidden items-center gap-8 text-sm font-medium text-[#53617d] md:flex"><a href="#explore" className="transition hover:text-[#172039]">Explore</a><a href="#how-it-works" className="transition hover:text-[#172039]">How it works</a><Link href="/dashboard" className="transition hover:text-[#172039]">My library</Link><span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.14em] text-[#71809f]"><span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-[#527f1e]" : "bg-[#b9d6db]"}`} />{live ? "Live" : "Syncing"}</span></nav>
      <div className="hidden items-center gap-3 md:flex">{isAuthenticated ? <><span className="text-sm text-[#53617d]">Hi, {user?.name?.split(" ")[0] ?? "builder"}</span><button onClick={() => logout()} className="btn rounded-full border border-[#d7e8eb] px-4 py-2 text-sm font-semibold">Sign out</button></> : <><button onClick={() => window.location.href = "/api/oauth/login"} className="btn rounded-full border border-[#d7e8eb] px-4 py-2 text-sm font-semibold">Sign in</button><button onClick={() => window.location.href = "/api/oauth/login"} className="btn rounded-full bg-[#172039] px-4 py-2 text-sm font-semibold text-white hover:bg-[#13b8b0]">Start building <ArrowRight className="ml-1 inline" size={15} /></button></>}</div>
      <button aria-label="Toggle menu" className="rounded-lg p-2 md:hidden" onClick={() => setOpen(v => !v)}>{open ? <X /> : <Menu />}</button>
    </div>
    {open && <div className="border-t border-[#d7e8eb] px-5 py-5 md:hidden"><div className="flex flex-col gap-4 text-sm font-medium"><a href="#explore" onClick={() => setOpen(false)}>Explore</a><a href="#how-it-works" onClick={() => setOpen(false)}>How it works</a><Link href="/dashboard">My library</Link><button className="w-fit rounded-full bg-[#172039] px-4 py-2 text-white" onClick={() => window.location.href = "/api/oauth/login"}>Sign in</button></div></div>}
  </header>;
}

export default function Home() {
  const live = useRealtime("storefront");
  const [activeType, setActiveType] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const featuredQuery = trpc.catalog.featured.useQuery();
  const productsQuery = trpc.catalog.products.useQuery({ sort: "popular" });
  const categoriesQuery = trpc.catalog.categories.useQuery();
  const allProducts = ((productsQuery.data?.length ? productsQuery.data : FALLBACK_PRODUCTS) as ProductCardData[]);
  const featured = ((featuredQuery.data?.length ? featuredQuery.data : allProducts.slice(0, 3)) as ProductCardData[]);
  const filtered = useMemo(() => allProducts.filter(p => (activeType === "ALL" || p.type === activeType) && `${p.title} ${p.shortDescription}`.toLowerCase().includes(search.toLowerCase())), [allProducts, activeType, search]);
  const categories = categoriesQuery.data?.length ? categoriesQuery.data : [{ id: 1, name: "Source Code" }, { id: 2, name: "AI Prompts" }, { id: 3, name: "Full Projects" }];
  return <div className="liquid-page min-h-screen overflow-hidden bg-[#eef8fa] text-[#172039]">
    <Header live={live} />
    <main>
      <section className="hero-grid relative border-b border-[#d7e8eb]">
        <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-5 py-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:py-24">
          <div className="relative z-10 max-w-2xl fade-up"><div className="mb-7 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[.22em] text-[#13b8b0]"><span className="h-2 w-2 rounded-full bg-[#13b8b0]" />Curated tools for ambitious builders</div><h1 className="font-display text-[clamp(3.5rem,8vw,7.5rem)] font-semibold leading-[.88] tracking-[-.09em]">Build less.<br /><span className="text-[#13b8b0]">Ship more.</span></h1><p className="mt-8 max-w-lg text-lg leading-8 text-[#53617d]">The marketplace for production-ready code, high-signal AI prompts, and complete projects that help you move from idea to launch.</p><div className="mt-9 flex flex-wrap gap-3"><a href="#explore" className="btn rounded-full bg-[#172039] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#13b8b0]">Explore the library <ArrowRight className="ml-2 inline" size={16} /></a><a href="#how-it-works" className="btn rounded-full border border-[#b9d6db] px-6 py-3.5 text-sm font-semibold hover:border-[#172039]">Why DevMarket?</a></div></div>
          <div className="relative mx-auto w-full max-w-[520px] lg:justify-self-end"><div className="absolute -right-3 -top-6 z-10 rounded-full bg-[#c7f76d] px-4 py-2 font-mono text-[10px] uppercase tracking-[.16em]">New drops weekly ↗</div><div className="relative rotate-2 overflow-hidden rounded-[2rem] border-[10px] border-[#172039] bg-[#172039] shadow-2xl"><div className="aspect-[.93/1] overflow-hidden rounded-[1.35rem] bg-[#13b8b0]"><img src="https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=760&q=78" alt="Developer workspace with colorful product screens" decoding="async" fetchPriority="high" className="h-full w-full object-cover opacity-90" /><div className="absolute inset-0 flex flex-col justify-between p-7 text-white"><div className="flex justify-between font-mono text-[10px] uppercase tracking-[.16em]"><span>DM / 001</span><span>2026</span></div><div><p className="font-mono text-xs uppercase tracking-[.18em] text-[#c7f76d]">For people who make things</p><p className="mt-3 max-w-xs font-display text-4xl font-semibold leading-[.95] tracking-[-.07em]">Your unfair advantage, packaged.</p></div></div></div></div><div className="absolute -bottom-8 -left-8 flex h-24 w-24 rotate-[-8deg] items-center justify-center rounded-full border border-[#d7e8eb] bg-[#f8ffff] text-center font-mono text-[10px] uppercase leading-4 tracking-[.1em] shadow-xl">Digital<br />goods<br />only</div></div>
        </div>
        <div className="mx-auto flex max-w-[1280px] justify-between px-5 pb-6 font-mono text-[10px] uppercase tracking-[.15em] text-[#71809f] lg:px-8"><span>Scroll to explore</span><span>01 — 04</span></div>
      </section>

      <section id="explore" className="mx-auto max-w-[1280px] px-5 py-20 lg:px-8"><div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-mono text-[11px] uppercase tracking-[.2em] text-[#13b8b0]">The library</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-[-.06em] md:text-5xl">Find your next shortcut.</h2></div><div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#53617d]"><Sparkles size={15} className="text-[#13b8b0]" /> Hand-picked. No filler.</div></div>
        <div className="mb-8 flex flex-col gap-4 border-y border-[#d7e8eb] py-4 md:flex-row md:items-center md:justify-between"><div className="flex flex-wrap gap-2">{[{ key: "ALL", label: "All products" }, ...categories.map(c => ({ key: c.name === "Source Code" ? "SOURCE_CODE" : c.name === "AI Prompts" ? "PROMPT" : "PROJECT", label: c.name }))].map(tab => <button key={tab.key} onClick={() => setActiveType(tab.key)} className={`btn rounded-full px-4 py-2 text-sm font-semibold ${activeType === tab.key ? "bg-[#172039] text-white" : "text-[#53617d] hover:bg-[#e9f7f6]"}`}>{tab.label}</button>)}</div><label className="flex items-center gap-3 rounded-full border border-[#d7e8eb] bg-[#f8ffff] px-4 py-2.5 text-[#53617d] md:w-64"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search the library" className="w-full bg-transparent text-sm outline-none placeholder:text-[#a1a19b]" /></label></div>
        {filtered.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filtered.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}</div> : <div className="rounded-2xl border border-dashed border-[#b9d6db] p-14 text-center text-[#53617d]">No products match that search yet.</div>}
      </section>

      <section className="border-y border-[#d7e8eb] bg-[#e9f7f6] py-20"><div className="mx-auto grid max-w-[1280px] gap-10 px-5 lg:grid-cols-[.75fr_1.25fr] lg:px-8"><div><p className="font-mono text-[11px] uppercase tracking-[.2em] text-[#13b8b0]">Editor’s picks</p><h2 className="mt-3 max-w-sm font-display text-4xl font-semibold leading-[.98] tracking-[-.06em]">Start with something proven.</h2><p className="mt-5 max-w-sm text-[#53617d]">The highest-signal resources in the library, selected for teams who care about craft.</p></div><div className="grid gap-5 sm:grid-cols-3">{featured.map((product, i) => <ProductCard key={product.id} product={product} index={i} />)}</div></div></section>

      <section id="how-it-works" className="mx-auto max-w-[1280px] px-5 py-20 lg:px-8"><div className="mb-10 flex items-end justify-between"><div><p className="font-mono text-[11px] uppercase tracking-[.2em] text-[#13b8b0]">Simple by design</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-[-.06em] md:text-5xl">From browse to build.</h2></div><span className="hidden font-mono text-[10px] uppercase tracking-[.16em] text-[#71809f] md:block">No subscriptions. Own it forever.</span></div><div className="grid gap-4 md:grid-cols-3">{[{ n: "01", icon: <FolderOpen />, title: "Pick your shortcut", copy: "Browse focused resources built by people who ship. Every product has a clear use case and honest preview." }, { n: "02", icon: <Sparkles />, title: "Pay once, access instantly", copy: "Checkout securely with Razorpay or submit a UPI proof for admin review. No hidden fees or recurring plans." }, { n: "03", icon: <Check />, title: "Make it yours", copy: "Your purchase unlocks a secure download. Remix, customize, and get back to the work that matters." }].map(item => <div key={item.n} className="rounded-2xl border border-[#d7e8eb] bg-[#f8ffff] p-7"><div className="flex items-center justify-between"><span className="font-mono text-sm text-[#13b8b0]">{item.n}</span><div className="text-[#13b8b0]">{item.icon}</div></div><h3 className="mt-14 font-display text-2xl font-semibold tracking-[-.04em]">{item.title}</h3><p className="mt-3 leading-7 text-[#53617d]">{item.copy}</p></div>)}</div></section>

      <section className="mx-5 mb-20 overflow-hidden rounded-[2rem] bg-[#172039] text-white lg:mx-auto lg:max-w-[1232px]"><div className="grid items-center gap-8 px-7 py-12 lg:grid-cols-[1fr_auto] lg:px-14 lg:py-16"><div><p className="font-mono text-[11px] uppercase tracking-[.2em] text-[#c7f76d]">For the next launch</p><h2 className="mt-4 max-w-xl font-display text-4xl font-semibold leading-[.95] tracking-[-.06em] md:text-6xl">Less boilerplate.<br />More momentum.</h2></div><Link href="/dashboard" className="btn inline-flex items-center justify-center rounded-full bg-[#c7f76d] px-6 py-3.5 text-sm font-semibold text-[#172039] hover:bg-white">Open my library <ArrowRight className="ml-2" size={16} /></Link></div></section>
    </main>
    <footer className="border-t border-[#d7e8eb] px-5 py-8 lg:px-8"><div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-4 text-sm text-[#53617d] md:flex-row"><span className="font-display font-semibold text-[#172039]">dev<span className="text-[#13b8b0]">market</span></span><span>Built for people who make things.</span><span className="font-mono text-[10px] uppercase tracking-[.14em]">© 2026 DevMarket Labs</span></div></footer>
  </div>;
}
