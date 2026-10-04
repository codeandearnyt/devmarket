import { Edit3, Eye, FileText, Globe2, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import RichTextEditor from "@/components/RichTextEditor";

type Draft = { title: string; slug: string; excerpt: string; content: string; coverImageUrl: string; category: string; tags: string; authorName: string; status: "DRAFT" | "PUBLISHED" };
const emptyDraft: Draft = { title: "", slug: "", excerpt: "", content: "", coverImageUrl: "", category: "Building with AI", tags: "", authorName: "Nitin Sharma", status: "DRAFT" };
const draftStorageKey = "devmarket.blog.draft";

function loadSavedDraft() {
  try {
    const saved = window.localStorage.getItem(draftStorageKey);
    return saved ? { ...emptyDraft, ...JSON.parse(saved) } as Draft : emptyDraft;
  } catch {
    return emptyDraft;
  }
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

export default function BlogAdminPanel() {
  const posts = trpc.admin.blogs.useQuery();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState("Not editing");
  const create = trpc.admin.createBlog.useMutation({ onSuccess: () => { void posts.refetch(); reset(); toast.success("Article saved"); } });
  const update = trpc.admin.updateBlog.useMutation({ onSuccess: () => { void posts.refetch(); reset(); toast.success("Article updated"); } });
  const remove = trpc.admin.deleteBlog.useMutation({ onSuccess: () => { void posts.refetch(); toast.success("Article deleted"); } });
  const uploadCover = trpc.admin.uploadBlogCover.useMutation({ onSuccess: result => { set("coverImageUrl", result.url); toast.success("Cover uploaded"); }, onError: error => toast.error(error.message) });
  const uploadInlineImage = trpc.admin.uploadBlogCover.useMutation();
  const set = (key: keyof Draft, value: string) => setDraft(current => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!open || editingId) return;
    setAutosaveStatus("Saving locally…");
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
      setAutosaveStatus("Saved locally");
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draft, editingId, open]);

  function reset() { setDraft(emptyDraft); setEditingId(null); setOpen(false); setPreview(false); setAutosaveStatus("Not editing"); window.localStorage.removeItem(draftStorageKey); }
  function startNew() { setDraft(loadSavedDraft()); setEditingId(null); setPreview(false); setOpen(true); }
  function edit(post: NonNullable<typeof posts.data>[number]) { setDraft({ title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, coverImageUrl: post.coverImageUrl ?? "", category: post.category, tags: ((post.tags as string[] | null) ?? []).join(", "), authorName: post.authorName, status: post.status }); setEditingId(post.id); setPreview(false); setOpen(true); }
  async function uploadFile(file?: File) { if (!file) throw new Error("No image selected"); if (!file.type.startsWith("image/") || file.size > 5_000_000) throw new Error("Choose an image under 5 MB"); const result = await uploadInlineImage.mutateAsync({ dataUrl: await readAsDataUrl(file) }); return result.url; }
  async function uploadCoverFile(file?: File) { if (!file) return; if (!file.type.startsWith("image/") || file.size > 5_000_000) { toast.error("Choose an image under 5 MB"); return; } uploadCover.mutate({ dataUrl: await readAsDataUrl(file) }); }
  function submit(event: React.FormEvent) { event.preventDefault(); const input = { ...draft, coverImageUrl: draft.coverImageUrl || null, tags: draft.tags.split(",").map(tag => tag.trim()).filter(Boolean) }; if (editingId) update.mutate({ ...input, id: editingId }); else create.mutate(input); }

  return <section className="mt-9 rounded-2xl border border-[#d7e8eb] bg-[#f8ffff] p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#71809f]">Editorial workspace</p><h2 className="mt-2 font-display text-2xl font-semibold">Blog posts</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#53617d]">Publish useful, original articles for builders. Drafts stay private until you choose Published.</p></div><button onClick={startNew} className="btn inline-flex items-center rounded-full bg-[#172039] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} className="mr-2" /> New article</button></div>
    {open && <div className="mt-7 rounded-2xl bg-[#e9f7f6] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-semibold">{editingId ? "Edit article" : "Write an article"}</p><div className="flex items-center gap-3"><span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#71809f]">{autosaveStatus}</span><button type="button" onClick={() => setPreview(value => !value)} className="inline-flex items-center rounded-full border border-[#b9d6db] bg-[#f8ffff] px-3 py-2 text-xs font-semibold">{preview ? <Edit3 size={14} className="mr-1.5" /> : <Eye size={14} className="mr-1.5" />}{preview ? "Edit" : "Preview"}</button><button type="button" onClick={reset} aria-label="Close editor"><X size={18} /></button></div></div>
      {preview ? <article className="prose prose-lg mt-6 max-w-none rounded-xl bg-[#f8ffff] p-6 text-[#53617d] prose-headings:font-display prose-headings:text-[#172039] prose-a:text-[#13b8b0]"><h1>{draft.title || "Untitled article"}</h1><p>{draft.excerpt || "Add an excerpt to preview it here."}</p><Streamdown>{draft.content || "Write your Markdown content to preview the article."}</Streamdown></article> : <form onSubmit={submit} className="mt-5 grid gap-3 md:grid-cols-2"><input required placeholder="Title" value={draft.title} onChange={e => set("title", e.target.value)} className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none" /><input required placeholder="slug-like-this" value={draft.slug} onChange={e => set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))} className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none" /><input required placeholder="Category" value={draft.category} onChange={e => set("category", e.target.value)} className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none" /><input required placeholder="Author name" value={draft.authorName} onChange={e => set("authorName", e.target.value)} className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none" /><div className="flex gap-2 md:col-span-2"><input placeholder="Cover image URL or upload below" value={draft.coverImageUrl} onChange={e => set("coverImageUrl", e.target.value)} className="min-w-0 flex-1 rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none" /><label className="inline-flex cursor-pointer items-center rounded-xl border border-[#b9d6db] bg-[#f8ffff] px-4 py-3 text-xs font-semibold"><Upload size={14} className="mr-1.5" />{uploadCover.isPending ? "Uploading…" : "Upload"}<input type="file" accept="image/*" className="sr-only" onChange={e => void uploadCoverFile(e.target.files?.[0])} /></label></div><input required placeholder="Tags, comma separated" value={draft.tags} onChange={e => set("tags", e.target.value)} className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none md:col-span-2" /><textarea required minLength={20} placeholder="Short excerpt for cards and SEO" value={draft.excerpt} onChange={e => set("excerpt", e.target.value)} className="min-h-24 rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none md:col-span-2" /><RichTextEditor value={draft.content} onChange={content => set("content", content)} onUploadImage={uploadFile} disabled={create.isPending || update.isPending || uploadInlineImage.isPending} /><select value={draft.status} onChange={e => set("status", e.target.value)} className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none"><option value="DRAFT">Save as draft</option><option value="PUBLISHED">Publish now</option></select><button type="submit" disabled={create.isPending || update.isPending} className="inline-flex items-center justify-center rounded-full bg-[#13b8b0] px-5 py-3 text-sm font-semibold text-white"><Save size={15} className="mr-2" />{create.isPending || update.isPending ? "Saving…" : editingId ? "Update article" : "Save article"}</button></form>}
    </div>}
    <div className="mt-7 space-y-3">{posts.isLoading ? <p className="py-8 text-center text-sm text-[#53617d]">Loading posts…</p> : posts.data?.length ? posts.data.map(post => <article key={post.id} className="flex flex-col gap-4 rounded-2xl border border-[#d7e8eb] p-4 md:flex-row md:items-center"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e9f7f6] text-[#13b8b0]">{post.status === "PUBLISHED" ? <Globe2 size={20} /> : <FileText size={20} />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-lg font-semibold">{post.title}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${post.status === "PUBLISHED" ? "bg-[#c7f76d] text-[#172039]" : "bg-[#fff4c6] text-[#8a6500]"}`}>{post.status}</span></div><p className="mt-1 text-sm text-[#53617d]">{post.category} · {post.authorName} · {post.slug}</p></div><div className="flex items-center gap-2"><button onClick={() => edit(post)} className="inline-flex items-center rounded-full border border-[#d7e8eb] px-3 py-2 text-sm font-semibold hover:bg-[#e9f7f6]"><Edit3 size={15} className="mr-1.5" /> Edit</button><button onClick={() => { if (window.confirm("Delete this article?")) remove.mutate({ id: post.id }); }} className="inline-flex items-center rounded-full bg-[#ffe0d7] px-3 py-2 text-sm font-semibold text-[#a33e23]" aria-label={`Delete ${post.title}`}><Trash2 size={15} /></button></div></article>) : <div className="rounded-2xl border border-dashed border-[#b9d6db] p-12 text-center text-[#53617d]">No blog posts yet. Start with an article for your future audience.</div>}</div>
  </section>;
}
