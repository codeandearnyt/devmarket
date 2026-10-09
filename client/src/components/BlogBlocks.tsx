import { Streamdown } from "streamdown";

/**
 * Structured article body written by the admin block editor.
 *
 * `content` stays a markdown mirror for legacy posts, but when `blocks` is
 * present we render them natively so images (including inline base64) and
 * iframes display reliably — markdown renderers usually strip raw HTML like
 * `<iframe>`, and base64 data URLs are safer as real `src` attributes.
 */
export type BlogBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; src: string; alt?: string }
  | { type: "iframe"; src: string };

/** Only http(s) embeds are allowed; a `javascript:` URL never reaches the DOM. */
function safeEmbedUrl(src: string) {
  try {
    const url = new URL(src);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function BlogBlocks({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return <h2 key={index} className="font-display text-3xl font-semibold tracking-[-.04em] text-[#172039]">{block.text}</h2>;
        }
        if (block.type === "paragraph") {
          return (
            <div key={index} className="leading-8">
              <Streamdown>{block.text}</Streamdown>
            </div>
          );
        }
        if (block.type === "image") {
          if (!block.src) return null;
          return <img key={index} src={block.src} alt={block.alt ?? ""} loading="lazy" className="w-full rounded-2xl object-cover" />;
        }
        const embed = safeEmbedUrl(block.src);
        if (!embed) return null;
        return (
          <div key={index} className="not-prose my-6">
            <iframe
              src={embed}
              title="Embedded content"
              loading="lazy"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation"
              className="aspect-video w-full rounded-2xl border-0"
            />
          </div>
        );
      })}
    </>
  );
}

/** True when a stored article carries structured blocks (vs. legacy markdown). */
export function hasBlocks(value: unknown): value is BlogBlock[] {
  return Array.isArray(value) && value.length > 0;
}
