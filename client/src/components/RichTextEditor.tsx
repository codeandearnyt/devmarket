import { Bold, Code2, Heading2, ImagePlus, Italic, Link2, List, Quote } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

type Props = { value: string; onChange: (value: string) => void; onUploadImage: (file: File) => Promise<string>; disabled?: boolean };

export default function RichTextEditor({ value, onChange, onUploadImage, disabled = false }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  function insert(before: string, after = "") {
    const textarea = inputRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end) || "text";
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => { textarea.focus(); const cursor = start + before.length + selected.length + after.length; textarea.setSelectionRange(cursor, cursor); });
  }
  async function uploadImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5_000_000) { toast.error("Choose an image under 5 MB"); return; }
    try { const url = await onUploadImage(file); insert(`![Image](${url})\n\n`); toast.success("Inline image inserted"); } catch (error) { toast.error(error instanceof Error ? error.message : "Image upload failed"); }
  }
  const tools = [
    { label: "Bold", icon: <Bold size={15} />, action: () => insert("**", "**") },
    { label: "Italic", icon: <Italic size={15} />, action: () => insert("*", "*") },
    { label: "Heading", icon: <Heading2 size={15} />, action: () => insert("## ") },
    { label: "List", icon: <List size={15} />, action: () => insert("- ") },
    { label: "Quote", icon: <Quote size={15} />, action: () => insert("> ") },
    { label: "Code", icon: <Code2 size={15} />, action: () => insert("`", "`") },
    { label: "Link", icon: <Link2 size={15} />, action: () => insert("[", "](https://)") },
  ];
  return <div className="overflow-hidden rounded-xl border border-[#d7e8eb] bg-[#f8ffff] md:col-span-2"><div className="flex flex-wrap items-center gap-1 border-b border-[#d7e8eb] bg-[#e9f7f6] p-2"><span className="mr-2 px-2 font-mono text-[9px] uppercase tracking-[.14em] text-[#71809f]">Editor</span>{tools.map(tool => <button key={tool.label} type="button" title={tool.label} aria-label={tool.label} disabled={disabled} onClick={tool.action} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-[#53617d] hover:bg-[#f8ffff] disabled:opacity-50">{tool.icon}<span className="hidden sm:inline">{tool.label}</span></button>)}<button type="button" title="Insert inline image" aria-label="Insert inline image" disabled={disabled} onClick={() => imageRef.current?.click()} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-[#13b8b0] hover:bg-[#f8ffff] disabled:opacity-50"><ImagePlus size={15} /><span className="hidden sm:inline">Image</span></button><input ref={imageRef} type="file" accept="image/*" className="sr-only" onChange={event => { void uploadImage(event.target.files?.[0]); event.currentTarget.value = ""; }} /></div><textarea ref={inputRef} required minLength={80} disabled={disabled} value={value} onChange={event => onChange(event.target.value)} placeholder="Write the article, select text, then use the toolbar to format it. Inline images are uploaded to managed storage." className="min-h-64 w-full resize-y bg-[#f8ffff] px-4 py-4 text-sm leading-7 outline-none focus:ring-2 focus:ring-[#13b8b0]/20" /><div className="flex items-center justify-between border-t border-[#e9f7f6] px-4 py-2 font-mono text-[9px] uppercase tracking-[.12em] text-[#71809f]"><span>Markdown + inline media</span><span>{value.length} characters</span></div></div>;
}
