import { Link } from "wouter";
import { ArrowLeft, Tag } from "lucide-react";

/** Tags and the way back to the index, closing the article. */
export default function BlogPostFooter({
  tags,
  category,
}: {
  tags: string[];
  category: string;
}) {
  return (
    <footer className="mt-14 border-t border-[#d7e8eb] pt-7">
      {tags.length ? (
        <ul className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-[#e9f7f6] px-3 py-1.5 text-xs font-semibold text-[#53617d]"
            >
              <Tag size={12} /> {tag}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#53617d] transition hover:text-[#13b8b0]"
        >
          <ArrowLeft size={15} /> All {category.toLowerCase()} articles
        </Link>
        <Link
          href="/"
          className="rounded-full bg-[#172039] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#13b8b0]"
        >
          Browse the library
        </Link>
      </div>
    </footer>
  );
}