import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * Related reading for the sidebar, ranked by shared category and tags.
 *
 * Deliberately a quiet hairline list rather than another card grid: the sidebar
 * already carries the table of contents and a sponsored placement, and stacked
 * thumbnails would fight the article for attention.
 */
export default function RelatedPosts({ slug, limit = 4 }: { slug: string; limit?: number }) {
  const related = trpc.blog.related.useQuery({ slug, limit });

  if (related.isLoading) {
    return (
      <div aria-busy="true" className="min-h-[9rem] rounded-2xl border border-dashed border-[#d7e8eb] p-5">
        <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#8a97b5]">Related reading</p>
      </div>
    );
  }

  const posts = related.data ?? [];
  if (!posts.length) return null;

  return (
    <nav aria-label="Related posts">
      <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#13b8b0]">Related reading</p>
      <ul className="mt-3">
        {posts.map(post => (
          <li key={post.slug} className="border-t border-[#e4eef1] first:border-t-0">
            <Link href={`/blog/${post.slug}`} className="group block py-3">
              <span className="font-display text-[15px] font-semibold leading-snug tracking-[-.02em] text-[#172039] transition group-hover:text-[#13b8b0]">
                {post.title}
              </span>
              <span className="mt-1 block text-[11px] uppercase tracking-[.12em] text-[#8a97b5]">
                {post.category} · {post.readingMinutes} min read
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}