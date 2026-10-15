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
  /** Keep this route out of search indexes. Used for checkout. */
  noindex?: boolean;
};

export function applyPageMeta({ title, description, image, path, noindex }: PageMeta) {
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

  // og:url has to track the route. Left static, a product page inherited the
  // homepage's URL from index.html and told every share card and crawler that
  // /product/<slug> was really "/".
  if (typeof window !== "undefined") {
    const href = path ? new URL(path, window.location.origin).href : window.location.href;
    upsertMeta("property", "og:url", href);

    const robots = document.head.querySelector('meta[name="robots"]');
    if (noindex) {
      upsertMeta("name", "robots", "noindex, nofollow");
    } else if (robots) {
      robots.remove();
    }
  }

  let canonical = document.head.querySelector('link[rel="canonical"]');
  const href = typeof window !== "undefined"
    ? (path ? new URL(path, window.location.origin).href : window.location.href)
    : null;
  if (href) {
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
      created.push(canonical);
    }
    canonical.setAttribute("href", href);
  }

  return () => {
    document.title = previousTitle;
    created.forEach(element => element.remove());
  };
}