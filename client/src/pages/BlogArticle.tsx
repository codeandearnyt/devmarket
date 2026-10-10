import { BookOpen } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAnalyticsEvent } from "@/hooks/useAnalyticsEvent";
import ScrollDepthBackground from "@/components/ScrollDepthBackground";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import BlogPostContent from "@/components/blog/BlogPostContent";
import BlogPostFooter from "@/components/blog/BlogPostFooter";
import BlogPostHeader from "@/components/blog/BlogPostHeader";
import BlogPostLayout from "@/components/blog/BlogPostLayout";
import { articleSections, articleWordCount, readingMinutes } from "@/lib/blogContent";
import { applyPageMeta } from "@/lib/seo";

/**
 * Article page, built from the shared blog post template.
 *
 * The route, the title format and the analytics event are unchanged; what is
 * new is the template: a two-column spread with a sticky sidebar, an automatic
 * table of contents, related reading, and sponsored placements that only ever
 * land on section boundaries.
 */
export default function BlogArticle() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug ?? "";
  const post = trpc.blog.bySlug.useQuery({ slug }, { enabled: Boolean(slug) });
  const track = useAnalyticsEvent();
  const contentRef = useRef<HTMLElement | null>(null);
  // One rotation per page view: stable while reading, different next visit.
  const adSeed = useRef(Math.floor(Math.random() * 0xffffffff)).current;

  const article = post.data;
  const sections = useMemo(() => (article ? articleSections(article) : []), [article]);
  const words = useMemo(() => articleWordCount(sections), [sections]);
  const minutes = useMemo(() => readingMinutes(sections), [sections]);

  useEffect(() => {
    if (!article) return;
    const cleanup = applyPageMeta({
      title: `${article.title} | DevMarket Blog`,
      description: article.excerpt ?? null,
      image: article.coverImageUrl ?? null,
      path: `/blog/${article.slug}`,
    });
    track("article_view", { slug: article.slug, category: article.category });
    return cleanup;
  }, [article, track]);

  if (post.isLoading) {
    return (
      <div className="liquid-page min-h-screen bg-[#eef8fa] p-10 font-mono text-xs uppercase tracking-[.16em] text-[#13b8b0]">
        Loading article…
      </div>
    );
  }

  if (!article) {
    return (
      <div className="liquid-page min-h-screen bg-[#eef8fa] px-5 py-32 text-center text-[#172039]">
        <BookOpen className="mx-auto text-[#13b8b0]" size={32} />
        <h1 className="mt-5 font-display text-4xl font-semibold">Article not found.</h1>
        <Link href="/blog" className="mt-7 inline-flex rounded-full bg-[#172039] px-5 py-3 text-sm font-semibold text-white">
          Back to blog
        </Link>
      </div>
    );
  }

  const tags = ((article.tags as string[] | null) ?? []).map(String);

  return (
    /* Unclipped shell: the depth scene clips itself, and an `overflow` ancestor
       would silently break the sticky sidebar. */
    <div className="liquid-page-unclipped min-h-screen bg-[#eef8fa] text-[#172039]">
      <ScrollDepthBackground />
      <SiteHeader linkLabel="All articles" linkHref="/blog" />
      <main className="relative z-10 pt-28 lg:pt-36">
        <BlogPostLayout
          slug={article.slug}
          version={`${article.id}-${article.updatedAt ?? article.createdAt}`}
          seed={adSeed}
          contentRef={contentRef}
          header={<BlogPostHeader article={article} readingMinutes={minutes} />}
          content={ads => (
            <BlogPostContent sections={sections} words={words} ads={ads} contentRef={contentRef} />
          )}
          footer={<BlogPostFooter tags={tags} category={article.category} />}
        />
      </main>
      <SiteFooter />
    </div>
  );
}