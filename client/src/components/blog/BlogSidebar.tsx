import type { ReactNode } from "react";

/**
 * Article sidebar: contents, sponsored placement, related reading and the
 * newsletter card.
 *
 * The container is sticky so it stays with the reader, but it is capped to the
 * viewport height and scrolls internally — a tall stack can never run over the
 * footer, and the last item is always reachable.
 */
export default function BlogSidebar({ children }: { children: ReactNode }) {
  return (
    <aside
      aria-label="Article sidebar"
      className="sidebar-scroll lg:sticky lg:top-28 lg:max-h-[calc(100vh-9rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:pb-2"
    >
      <div className="flex flex-col gap-9">{children}</div>
    </aside>
  );
}