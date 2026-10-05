import { ArrowLeft, BookOpen, CalendarDays, Tag } from "lucide-react";
import { useEffect } from "react";
import { Link, useRoute } from "wouter";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import { useAnalyticsEvent } from "@/hooks/useAnalyticsEvent";
import ScrollDepthBackground from "@/components/ScrollDepthBackground";
import SiteFooter from "@/components/SiteFooter";

export default function BlogArticle() {
  const [, params] = useRoute("/blog/:slug");
  const post = trpc.blog.bySlug.useQuery({ slug: params?.slug ?? "" }, { enabled: Boolean(params?.slug) });
  const track = useAnalyticsEvent();
  useEffect(() => { if (post.data) { document.title = `${post.data.title} | DevMarket Journal`; track("article_view", { slug: post.data.slug, category: post.data.category }); } }, [post.data, track]);
  if (post.isLoading) return <div className="liquid-page min-h-screen bg-[#eef8fa] p-10 font-mono text-xs uppercase tracking-[.16em] text-[#13b8b0]">Loading article…</div>;
  if (!post.data) return <div className="liquid-page min-h-screen bg-[#eef8fa] px-5 py-32 text-center text-[#172039]"><BookOpen className="mx-auto text-[#13b8b0]" size={32} /><h1 className="mt-5 font-display text-4xl font-semibold">Article not found.</h1><Link href="/blog" className="mt-7 inline-flex rounded-full bg-[#172039] px-5 py-3 text-sm font-semibold text-white">Back to journal</Link></div>;
  const article = post.data;
  return <div className="liquid-page min-h-screen overflow-hidden bg-[#eef8fa] text-[#172039]"><ScrollDepthBackground />
    <header className="site-header"><div className="site-nav-pill mx-auto flex max-w-[1080px] items-center justify-between px-4 py-3 lg:px-5"><Link href="/" className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#172039] text-[#c7f76d]"><BookOpen size={18} /></span><span className="font-display text-xl font-bold tracking-[-.05em]">dev<span className="text-[#13b8b0]">market</span></span></Link><Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-[#53617d] transition hover:text-[#13b8b0]"><ArrowLeft size={15} /> All articles</Link></div></header>
    <main className="relative z-10 mx-auto max-w-[940px] px-5 pb-24 pt-32 lg:px-8 lg:pt-40"><div className="text-center"><span className="rounded-full bg-[#c7f76d] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.16em]">{article.category}</span><h1 className="mx-auto mt-7 max-w-4xl font-display text-5xl font-semibold leading-[.9] tracking-[-.08em] md:text-7xl">{article.title}</h1><div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[.12em] text-[#71809f]"><CalendarDays size={14} className="text-[#13b8b0]" />{new Date(article.publishedAt ?? article.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}<span>·</span><span>By {article.authorName}</span></div></div>{article.coverImageUrl ? <img src={article.coverImageUrl} alt="" className="mt-14 aspect-[2/1] w-full rounded-[2rem] object-cover" /> : <div className="relative mt-14 h-44 overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#c9f4f1] via-[#eef8fa] to-[#ded9ff]"><div className="absolute -left-10 -top-24 h-64 w-64 rounded-full bg-[#13b8b0]/25" /><div className="absolute -bottom-32 -right-8 h-80 w-80 rounded-full bg-[#7658f5]/20" /></div>}<p className="mx-auto mt-12 max-w-2xl text-center text-xl leading-8 text-[#53617d]">{article.excerpt}</p><article className="prose prose-lg mx-auto mt-12 max-w-3xl text-[#53617d] prose-headings:font-display prose-headings:text-[#172039] prose-headings:tracking-[-.04em] prose-a:text-[#13b8b0]"><Streamdown>{article.content}</Streamdown></article><div className="mx-auto mt-14 flex max-w-3xl flex-wrap gap-2 border-t border-[#d7e8eb] pt-6">{((article.tags as string[] | null) ?? []).map(tag => <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[#e9f7f6] px-3 py-1.5 text-xs font-semibold text-[#53617d]"><Tag size={12} />{tag}</span>)}</div></main><SiteFooter />
  </div>;
}
