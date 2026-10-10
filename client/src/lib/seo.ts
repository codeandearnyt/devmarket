/**
 * Document metadata helpers.
 *
 * The app is a client-rendered single page app, so titles and social metadata
 * are applied when a route mounts. Every helper returns a cleanup function that
 * only removes the tags it created, so navigating between routes never leaves a
 * stale description or canonical URL behind.
 */
export type PageMeta = {
  title: string;
  description?: string | null;
  image?: string | null;
  path?: string | null;
};

export function applyPageMeta({ title, description, image, path }: PageMeta) {
  if (typeof document === "undefined") return () => {};

  const previousTitle = document.title;
  document.title = title;
  const created: Element[] = [];

  const upsertMeta = (attribute: "name" | "property", key: string, content?: string | null) => {
    if (!content) return;
    let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attribute, key);
      document.head.appendChild(element);
      created.push(element);
    }
    element.setAttribute("content", content);
  };

  upsertMeta("name", "description", description);
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:type", "article");
  upsertMeta("property", "og:image", image);

  let canonical = document.head.querySelector('link[rel="canonical"]');
  const href = path ? new URL(path, window.location.origin).href : window.location.href;
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
    created.push(canonical);
  }
  canonical.setAttribute("href", href);

  return () => {
    document.title = previousTitle;
    created.forEach(element => element.remove());
  };
}