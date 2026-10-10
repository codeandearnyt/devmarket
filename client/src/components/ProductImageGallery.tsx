import { ImagePlus, Link2, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Multi-image gallery for the product form.
 *
 * Each image can be added by URL or by browsing a local file, which is read as
 * an inline base64 data URL. Managed storage (Forge/S3) is not configured in
 * every environment, so keeping the bytes in the row keeps uploads working
 * everywhere. Files are capped at 1.5 MB so a data URL never bloats a row.
 */
const MAX_IMAGES = 8;
const MAX_BYTES = 1_500_000;

export default function ProductImageGallery({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [reading, setReading] = useState(false);

  function addUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    if (value.length >= MAX_IMAGES) { toast.error(`Up to ${MAX_IMAGES} images`); return; }
    onChange([...value, url]);
    setUrlDraft("");
  }

  async function addFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Choose an image file"); return; }
    if (file.size > MAX_BYTES) { toast.error("Choose an image under 1.5 MB"); return; }
    if (value.length >= MAX_IMAGES) { toast.error(`Up to ${MAX_IMAGES} images`); return; }
    setReading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read image"));
        reader.readAsDataURL(file);
      });
      onChange([...value, dataUrl]);
      toast.success("Image added");
    } catch {
      toast.error("Could not read that image");
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function move(index: number, delta: number) {
    const next = [...value];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1" style={{ minWidth: 220 }}>
          <Link2 size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a1a19b]" />
          <input
            value={urlDraft}
            onChange={event => setUrlDraft(event.target.value)}
            onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); addUrl(); } }}
            placeholder="https://example.com/screenshot.png"
            className="w-full rounded-xl border border-[#d7e8eb] bg-white py-3 pl-9 pr-3 text-sm outline-none transition placeholder:text-[#a1a19b] focus:border-[#13b8b0]"
          />
        </div>
        <button
          type="button"
          onClick={addUrl}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#b9d6db] bg-[#f8ffff] px-4 py-3 text-xs font-semibold text-[#53617d] transition hover:border-[#13b8b0] hover:text-[#13b8b0]"
        >
          <Plus size={14} /> Add URL
        </button>
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[#b9d6db] bg-[#f8ffff] px-4 py-3 text-xs font-semibold text-[#53617d] transition hover:border-[#13b8b0] hover:text-[#13b8b0]">
          {reading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {reading ? "Reading…" : "Browse"}
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={event => void addFile(event.target.files?.[0])} />
        </label>
      </div>

      {value.length ? (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((src, index) => (
            <li key={index} className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] p-2">
              <img src={src} alt={`Preview ${index + 1}`} className="h-24 w-full rounded-lg object-cover" />
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="min-w-0 truncate font-mono text-[10px] text-[#71809f]">
                  {`Image ${index + 1}`} · {src.startsWith("data:image/") ? `${Math.round(src.length / 1024)} KB inline` : "URL"}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move image earlier" className="rounded-md px-1.5 py-1 text-[11px] font-semibold text-[#53617d] transition hover:bg-white disabled:opacity-40">←</button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === value.length - 1} aria-label="Move image later" className="rounded-md px-1.5 py-1 text-[11px] font-semibold text-[#53617d] transition hover:bg-white disabled:opacity-40">→</button>
                  <button type="button" onClick={() => removeAt(index)} aria-label="Remove image" className="rounded-md p-1.5 text-[#a33e23] transition hover:bg-[#ffe0d7]"><Trash2 size={13} /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#71809f]">
          <ImagePlus size={12} /> Paste a URL or browse a local image — local files are stored as base64.
        </p>
      )}
      <p className="mt-2 text-xs text-[#71809f]">Extra shots for the product page (up to {MAX_IMAGES}, each under 1.5 MB). The storefront thumbnail is set in the main image field.</p>
    </div>
  );
}
