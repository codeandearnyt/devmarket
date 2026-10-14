import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Showcase gallery for the public product page.
 *
 * The first frame is always the listing thumbnail, so a product with no showcase
 * images yet still renders exactly one frame and the layout never collapses.
 * The remaining frames come from the admin's "Showcase images" field.
 *
 * Thumbnails are lazy and sized explicitly: these are frequently inline base64
 * (the admin can upload from disk) or full-resolution screenshots, so without a
 * width/height the browser reserves no space and the page jumps as they decode.
 */
export default function ProductShowcase({
  thumbnailUrl,
  images,
  title,
}: {
  thumbnailUrl: string;
  images: (string[] | null) | undefined;
  title: string;
}) {
  const frames = useMemo(() => {
    const all = [thumbnailUrl, ...(images ?? [])].filter(
      (src): src is string => typeof src === "string" && src.trim().length > 0,
    );
    // The same image can legitimately appear twice if an admin re-added it;
    // showing it twice is just noise.
    return Array.from(new Set(all));
  }, [thumbnailUrl, images]);

  const [index, setIndex] = useState(0);
  // Reset when the product changes underneath us, otherwise switching between
  // two products keeps the previous one's selected frame and can exceed bounds.
  useEffect(() => {
    setIndex(0);
  }, [frames.length, thumbnailUrl]);

  const go = useCallback(
    (delta: number) => setIndex(current => (current + delta + frames.length) % frames.length),
    [frames.length],
  );

  useEffect(() => {
    if (frames.length < 2) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, frames.length]);

  if (!frames.length) return null;
  const active = frames[Math.min(index, frames.length - 1)];

  return (
    <div>
      <div className="group relative overflow-hidden rounded-[2rem] border border-[#d7e8eb] bg-[#e6e2d8]">
        <img
          key={active}
          src={active}
          alt={`${title} — image ${Math.min(index, frames.length - 1) + 1} of ${frames.length}`}
          width={1200}
          height={1000}
          fetchPriority={index === 0 ? "high" : "auto"}
          className="route-fade-in aspect-[1.2/1] h-full w-full object-cover"
        />

        {frames.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#f8ffffe8] text-[#172039] shadow-[0_6px_18px_rgba(23,32,57,.16)] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13b8b0]"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#f8ffffe8] text-[#172039] shadow-[0_6px_18px_rgba(23,32,57,.16)] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13b8b0]"
            >
              <ChevronRight size={18} />
            </button>
            <span className="absolute right-4 bottom-4 rounded-full bg-[#172039cc] px-2.5 py-1 font-mono text-[10px] font-semibold text-white">
              {Math.min(index, frames.length - 1) + 1} / {frames.length}
            </span>
          </>
        ) : null}
      </div>

      {frames.length > 1 ? (
        <ul className="mt-3 flex gap-3 overflow-x-auto pb-1 no-scrollbar" aria-label={`${title} images`}>
          {frames.map((src, i) => (
            <li key={`${src.slice(0, 40)}-${i}`}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={i === index}
                aria-label={`Show image ${i + 1}`}
                className={`block overflow-hidden rounded-xl border-2 transition ${
                  i === index
                    ? "border-[#13b8b0]"
                    : "border-transparent opacity-65 hover:opacity-100"
                }`}
              >
                <img
                  src={src}
                  alt=""
                  width={160}
                  height={133}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[1.2/1] w-24 object-cover sm:w-28"
                />
              </button>
            </li>
          ))}
        </ul>
    ) : null}
    </div>
  );
}