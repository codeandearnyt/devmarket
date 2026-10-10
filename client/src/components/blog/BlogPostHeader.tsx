import { useState } from "react";
import { CalendarDays, Check, Link2, Linkedin, PenLine, Clock3 } from "lucide-react";

export type BlogPostHeaderData = {
  title: string;
  category: string;
  excerpt?: string | null;
  authorName: string;
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
};

/**
 * Article header: category, headline, deck, and the meta row.
 *
 * The cover/thumbnail image is intentionally not rendered here — an article
 * opens with its headline, and the listing cards remain the place where the
 * cover art does its work.
 */
export default function BlogPostHeader({
  article,
  readingMinutes,
}: {
  article: BlogPostHeaderData;
  readingMinutes: number;
}) {
  const [copied, setCopied] = useState(false);
  const url = typeof window === "undefined" ? "" : window.location.href;
  const published = new Date(article.publishedAt ?? article.createdAt ?? Date.now());

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  const share = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const tweet = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(article.title)}`;

  return (
    <header className="max-w-3xl">
      <span className="inline-block rounded-full bg-[#c7f76d] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.16em] text-[#172039]">
        {article.category}
      </span>
      <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[.94] tracking-[-.075em] text-[#172039] sm:text-6xl">
        {article.title}
      </h1>
      {article.excerpt ? (
        <p className="mt-6 max-w-2xl text-xl leading-8 text-[#53617d]">{article.excerpt}</p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#d7e8eb] pt-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs uppercase tracking-[.12em] text-[#71809f]">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} className="text-[#13b8b0]" />
            {published.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <PenLine size={14} className="text-[#13b8b0]" />
            {article.authorName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={14} className="text-[#13b8b0]" />
            {readingMinutes} min read
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyLink}
            aria-label="Copy link to this article"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#d7e8eb] bg-[#f8ffff] px-3.5 py-2 text-xs font-semibold text-[#53617d] transition hover:border-[#13b8b0] hover:text-[#13b8b0]"
          >
            {copied ? <Check size={14} /> : <Link2 size={14} />}
            {copied ? "Copied" : "Copy link"}
          </button>
          <a
            href={tweet}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Share this article on X"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#d7e8eb] bg-[#f8ffff] px-3.5 py-2 text-xs font-semibold text-[#53617d] transition hover:border-[#13b8b0] hover:text-[#13b8b0]"
          >
            <span aria-hidden="true">X</span> Post
          </a>
          <a
            href={share}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="Share this article on LinkedIn"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d7e8eb] bg-[#f8ffff] text-[#53617d] transition hover:border-[#13b8b0] hover:text-[#13b8b0]"
          >
            <Linkedin size={14} />
          </a>
        </div>
      </div>
    </header>
  );
}