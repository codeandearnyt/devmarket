import { ImagePlus, Link2, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Image input that accepts either a pasted URL or a locally browsed file.
 *
 * Local files are read as a base64 data URL and stored inline — the app's
 * managed storage (Forge/S3) is not configured in every environment, so
 * keeping the bytes in the row keeps uploads working everywhere. Files are
 * capped at 1.5 MB so a data URL never bloats the database row.
 */
export default function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);

  async function readLocalFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Choose an image file"); return; }
    if (file.size > 1_500_000) { toast.error("Choose an image under 1.5 MB"); return; }
    setReading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read image"));
        reader.readAsDataURL(file);
      });
      onChange(dataUrl);
      toast.success("Image stored");
    } catch {
      toast.error("Could not read that image");
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const isDataUrl = value.startsWith("data:image/");

  return (
    <div>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[.12em] text-[#53617d]">{label}</span>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Link2 size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#a1a19b]" />
          <input
            value={value.startsWith("data:image/") ? "" : value}
            onChange={event => onChange(event.target.value.trim())}
            placeholder="https://example.com/image.png"
            className="w-full rounded-xl border border-[#d7e8eb] bg-white py-3 pl-9 pr-3 text-sm outline-none transition placeholder:text-[#a1a19b] focus:border-[#13b8b0]"
          />
        </div>
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[#b9d6db] bg-[#f8ffff] px-4 py-3 text-xs font-semibold text-[#53617d] transition hover:border-[#13b8b0] hover:text-[#13b8b0]">
          {reading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {reading ? "Reading…" : "Browse"}
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={event => void readLocalFile(event.target.files?.[0])} />
        </label>
      </div>
      {value ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#d7e8eb] bg-[#f8ffff] p-3">
          <img src={value} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-[#172039]">{isDataUrl ? "Stored locally (base64)" : "From URL"}</p>
            <p className="mt-0.5 truncate font-mono text-[10px] text-[#71809f]">{isDataUrl ? `${Math.round(value.length / 1024)} KB inline` : value}</p>
          </div>
          <button type="button" onClick={() => onChange("")} className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#a33e23] transition hover:bg-[#ffe0d7]">Remove</button>
        </div>
      ) : (
        hint ? <p className="mt-2 text-xs text-[#71809f]">{hint}</p> : null
      )}
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[#71809f]">
        <ImagePlus size={12} /> Paste a URL or browse a local image — local files are stored as base64.
      </p>
    </div>
  );
}
