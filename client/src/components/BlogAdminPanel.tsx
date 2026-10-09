import { Bold, Code2, FileText, Globe2, GripVertical, Heading2, Image as ImageIcon, Italic, Link2, List, Plus, Quote, Trash2, Type, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import ImageField from "@/components/ImageField";

/* ------------------------------------------------------------------ blocks */

type Block =
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "image"; src: string; alt: string }
  | { id: string; type: "iframe"; src: string };

let blockSeq = 0;
const nextId = () => `b${Date.now().toString(36)}${(blockSeq++).toString(36)}`;

function newBlock(type: Block["type"]): Block {
  switch (type) {
    case "heading": return { id: nextId(), type, text: "" };
    case "paragraph": return { id: nextId(), type, text: "" };
    case "image": return { id: nextId(), type, src: "", alt: "" };
    case "iframe": return { id: nextId(), type, src: "" };
  }
}

/* ------------------------------------------------------------------- draft */

type Draft = {
  title: string;
  slug: string;
  category: string;
  authorName: string;
  coverImageUrl: string;
  status: "DRAFT" | "PUBLISHED";
  blocks: Block[];
};

const emptyDraft: Draft = { title: "", slug: "", category: "Building with AI", authorName: "", coverImageUrl: "", status: "PUBLISHED", blocks: [] };
const draftStorageKey = "devmarket.blog.draft.v2";

function loadSavedDraft(fallbackAuthor: string): Draft {
  const withAuthor = (draft: Draft): Draft => (draft.authorName ? draft : { ...draft, authorName: fallbackAuthor });
  try {
    const saved = window.localStorage.getItem(draftStorageKey);
    if (!saved) return { ...emptyDraft, authorName: fallbackAuthor };
    return withAuthor({ ...emptyDraft, ...JSON.parse(saved) } as Draft);
  } catch {
    return { ...emptyDraft, authorName: fallbackAuthor };
  }
}

/** Strip the client-only `id` before handing blocks to the server. */
function toServerBlocks(blocks: Block[]) {
  return blocks.map(({ id: _id, ...rest }) => rest);
}

/* ------------------------------------------------------------ text toolbar */

/** Apply one of the six allowed inline transforms to a textarea's selection. */
function applyFormat(textarea: HTMLTextAreaElement | null, value: string, onChange: (next: string) => void, kind: "bold" | "italic" | "list" | "quote" | "code" | "link") {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);

  const wrap = (before: string, after: string, placeholder: string) => {
    const inner = selected || placeholder;
    const next = `${value.slice(0, start)}${before}${inner}${after}${value.slice(end)}`;
    onChange(next);
    restore(next.length - (value.length - end) + before.length, before.length + inner.length + after.length);
  };

  const prefixLines = (prefix: string) => {
    const from = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const to = end === start ? value.indexOf("\n", end) === -1 ? value.length : value.indexOf("\n", end) : end;
    const chunk = value.slice(from, to) || "Item";
    const transformed = chunk.split("\n").map(line => (line.startsWith(prefix) ? line : prefix + line)).join("\n");
    const next = value.slice(0, from) + transformed + value.slice(to);
    onChange(next);
    restore(from + transformed.length, 0);
  };

  const restore = (cursor: number, _len: number) => {
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  switch (kind) {
    case "bold": return wrap("**", "**", "bold text");
    case "italic": return wrap("*", "*", "italic text");
    case "code": return selected.includes("\n") ? wrap("```\n", "\n```", "code") : wrap("`", "`", "code");
    case "link": return wrap("[", "](https://)", "link text");
    case "list": return prefixLines("- ");
    case "quote": return prefixLines("> ");
  }
}

/* ----------------------------------------------------------- block editor */

function TextBlock({ block, value, onChange }: { block: Block; value: string; onChange: (next: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const tools = [
    { label: "Bold", icon: <Bold size={14} />, kind: "bold" as const },
    { label: "Italic", icon: <Italic size={14} />, kind: "italic" as const },
    { label: "List", icon: <List size={14} />, kind: "list" as const },
    { label: "Quote", icon: <Quote size={14} />, kind: "quote" as const },
    { label: "Code", icon: <Code2 size={14} />, kind: "code" as const },
    { label: "Link", icon: <Link2 size={14} />, kind: "link" as const },
  ];
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {tools.map(tool => (
          <button
            key={tool.label}
            type="button"
            onClick={() => applyFormat(ref.current, value, onChange, tool.kind)}
            title={tool.label}
            className="inline-flex items-center gap-1 rounded-lg border border-[#d7e8eb] bg-[#f8ffff] px-2.5 py-1.5 text-[11px] font-semibold text-[#53617d] transition hover:border-[#13b8b0] hover:text-[#13b8b0]"
          >
            {tool.icon} {tool.label}
          </button>
        ))}
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={event => onChange(event.target.value)}
        rows={block.type === "heading" ? 1 : 4}
        placeholder={block.type === "heading" ? "Section heading" : "Write a paragraph… use the toolbar for bold, italic, list, quote, code or link."}
        className="w-full resize-y rounded-xl border border-[#d7e8eb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#13b8b0]"
      />
    </div>
  );
}

function BlockRow({ block, index, total, onChange, onRemove, onMove }: { block: Block; index: number; total: number; onChange: (next: Block) => void; onRemove: () => void; onMove: (dir: -1 | 1) => void }) {
  const meta = {
    heading: { label: "Heading", icon: <Heading2 size={14} /> },
    paragraph: { label: "Paragraph", icon: <Type size={14} /> },
    image: { label: "Image", icon: <ImageIcon size={14} /> },
    iframe: { label: "Iframe", icon: <GripVertical size={14} /> },
  }[block.type];

  return (
    <div className="rounded-2xl border border-[#d7e8eb] bg-[#f8ffff] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e9f7f6] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[.12em] text-[#13b8b0]">
          {meta.icon} {index + 1} · {meta.label}
        </span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Move up" className="rounded-lg px-2 py-1 text-xs font-semibold text-[#71809f] transition hover:bg-[#e9f7f6] disabled:opacity-40">↑</button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="Move down" className="rounded-lg px-2 py-1 text-xs font-semibold text-[#71809f] transition hover:bg-[#e9f7f6] disabled:opacity-40">↓</button>
          <button type="button" onClick={onRemove} aria-label="Remove block" className="rounded-lg p-1.5 text-[#a33e23] transition hover:bg-[#ffe0d7]"><Trash2 size={14} /></button>
        </div>
      </div>

      {block.type === "heading" && <TextBlock block={block} value={block.text} onChange={text => onChange({ ...block, text })} />}
      {block.type === "paragraph" && <TextBlock block={block} value={block.text} onChange={text => onChange({ ...block, text })} />}
      {block.type === "image" && (
        <div className="grid gap-3">
          <ImageField label="Image" value={block.src} onChange={src => onChange({ ...block, src })} />
          <input
            placeholder="Alt text (optional)"
            value={block.alt}
            onChange={event => onChange({ ...block, alt: event.target.value })}
            className="rounded-xl border border-[#d7e8eb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#13b8b0]"
          />
        </div>
      )}
      {block.type === "iframe" && (
        <input
          placeholder="https://youtube.com/embed/… or any embed URL"
          value={block.src}
          onChange={event => onChange({ ...block, src: event.target.value.trim() })}
          className="w-full rounded-xl border border-[#d7e8eb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#13b8b0]"
        />
      )}
    </div>
  );
}

/* --------------------------------------------------------------- preview */

function BlockPreview({ blocks }: { blocks: Block[] }) {
  return (
    <div className="mt-6 space-y-4 rounded-xl bg-[#f8ffff] p-6">
      {blocks.length === 0 && <p className="text-sm text-[#71809f]">No content yet — add a heading, paragraph, image or iframe.</p>}
      {blocks.map(block => {
        if (block.type === "heading") return <h2 key={block.id} className="font-display text-2xl font-semibold text-[#172039]">{block.text || "Heading"}</h2>;
        if (block.type === "paragraph") return <div key={block.id} className="prose prose-lg max-w-none text-[#53617d] prose-headings:font-display prose-a:text-[#13b8b0]"><Streamdown>{block.text || "Paragraph"}</Streamdown></div>;
        if (block.type === "image") return block.src ? <img key={block.id} src={block.src} alt={block.alt} className="w-full rounded-xl object-cover" /> : <div key={block.id} className="rounded-xl border border-dashed border-[#b9d6db] p-6 text-center text-sm text-[#71809f]">Image block (empty)</div>;
        if (block.type === "iframe") return block.src ? <iframe key={block.id} src={block.src} title="Embed" className="aspect-video w-full rounded-xl border-0" allowFullScreen loading="lazy" sandbox="allow-scripts allow-same-origin allow-presentation" /> : <div key={block.id} className="rounded-xl border border-dashed border-[#b9d6db] p-6 text-center text-sm text-[#71809f]">Iframe block (empty)</div>;
        return null;
      })}
    </div>
  );
}

/* ----------------------------------------------------------------- panel */

export default function BlogAdminPanel() {
  const { user } = useAuth();
  const adminMe = trpc.auth.adminMe.useQuery(undefined, { refetchOnWindowFocus: false });
  // Author name comes from the profile: username first, then display name.
  // The admin console has its own cookie, so fall back to the console operator
  // and finally a house byline — the field is `required`, and an empty value
  // would make the browser block submit with no feedback.
  const profileAuthor =
    user?.username || user?.name || adminMe.data?.username || adminMe.data?.name || "DevMarket Team";

  const posts = trpc.admin.blogs.useQuery();
  const [draft, setDraft] = useState<Draft>(() => ({ ...emptyDraft, authorName: profileAuthor }));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState("Not editing");

  const create = trpc.admin.createBlog.useMutation({ onSuccess: () => { void posts.refetch(); reset(); toast.success("Article saved"); }, onError: error => toast.error(error.message) });
  const update = trpc.admin.updateBlog.useMutation({ onSuccess: () => { void posts.refetch(); reset(); toast.success("Article updated"); }, onError: error => toast.error(error.message) });
  const remove = trpc.admin.deleteBlog.useMutation({ onSuccess: () => { void posts.refetch(); toast.success("Article deleted"); }, onError: error => toast.error(error.message) });

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft(current => ({ ...current, [key]: value }));

  // Known blog categories, offered as suggestions for the Category field.
  const categorySuggestions = useMemo(() => Array.from(new Set((posts.data ?? []).map(post => post.category))).slice(0, 12), [posts.data]);

  // Fill the byline once the profile/operator resolves if it was empty at mount.
  useEffect(() => {
    if (editingId || draft.authorName || !profileAuthor) return;
    setDraft(current => (current.authorName ? current : { ...current, authorName: profileAuthor }));
  }, [profileAuthor, draft.authorName, editingId]);

  useEffect(() => {
    if (!open || editingId) return;
    setAutosaveStatus("Saving locally…");
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
      setAutosaveStatus("Saved locally");
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draft, editingId, open]);

  function reset() {
    setDraft({ ...emptyDraft, authorName: profileAuthor });
    setEditingId(null);
    setOpen(false);
    setPreview(false);
    setAutosaveStatus("Not editing");
    window.localStorage.removeItem(draftStorageKey);
  }

  function startNew() {
    setDraft(loadSavedDraft(profileAuthor));
    setEditingId(null);
    setPreview(false);
    setOpen(true);
  }

  function edit(post: NonNullable<typeof posts.data>[number]) {
    const existing = (post.blocks as Block[] | null) ?? null;
    const blocks: Block[] = existing?.length
      ? existing.map(block => ({ ...block, id: block.id || nextId() }))
      : post.content ? [{ id: nextId(), type: "paragraph", text: post.content }] : [];
    setDraft({
      title: post.title,
      slug: post.slug,
      category: post.category,
      authorName: post.authorName,
      coverImageUrl: post.coverImageUrl ?? "",
      status: post.status,
      blocks,
    });
    setEditingId(post.id);
    setPreview(false);
    setOpen(true);
  }

  function addBlock(type: Block["type"]) {
    setDraft(current => ({ ...current, blocks: [...current.blocks, newBlock(type)] }));
  }

  function changeBlock(index: number, next: Block) {
    setDraft(current => ({ ...current, blocks: current.blocks.map((block, i) => (i === index ? next : block)) }));
  }

  function removeBlock(index: number) {
    setDraft(current => ({ ...current, blocks: current.blocks.filter((_, i) => i !== index) }));
  }

  function moveBlock(index: number, dir: -1 | 1) {
    setDraft(current => {
      const blocks = [...current.blocks];
      const target = index + dir;
      if (target < 0 || target >= blocks.length) return current;
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      return { ...current, blocks };
    });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const blocks = toServerBlocks(draft.blocks.filter(block => (
      block.type === "image" ? Boolean(block.src) :
      block.type === "iframe" ? Boolean(block.src) :
      Boolean(block.text.trim())
    )));
    if (blocks.length === 0) { toast.error("Add at least one content block"); return; }

    const base = {
      title: draft.title.trim(),
      slug: draft.slug.trim().toLowerCase().replace(/\s+/g, "-"),
      category: draft.category.trim(),
      authorName: (draft.authorName || profileAuthor || "DevMarket").trim(),
      coverImageUrl: draft.coverImageUrl || null,
      status: draft.status,
      blocks,
    };

    if (editingId) update.mutate({ ...base, id: editingId });
    else create.mutate(base);
  }

  const canSubmit = draft.title.trim() && draft.slug.trim() && draft.category.trim() && draft.blocks.length > 0;

  return (
    <section className="mt-9 rounded-2xl border border-[#d7e8eb] bg-[#f8ffff] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#71809f]">Editorial workspace</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Blog posts</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#53617d]">Publish useful, original articles for builders. Drafts stay private until you choose Published.</p>
        </div>
        <button onClick={startNew} className="btn inline-flex items-center rounded-full bg-[#172039] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} className="mr-2" /> New article</button>
      </div>

      {open && (
        <div className="mt-7 rounded-2xl bg-[#e9f7f6] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold">{editingId ? "Edit article" : "Write an article"}</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#71809f]">{autosaveStatus}</span>
              <button type="button" onClick={() => setPreview(value => !value)} className="inline-flex items-center rounded-full border border-[#b9d6db] bg-[#f8ffff] px-3 py-2 text-xs font-semibold">
                {preview ? "Edit" : "Preview"}
              </button>
              <button type="button" onClick={reset} aria-label="Close editor"><X size={18} /></button>
            </div>
          </div>

          {preview ? (
            <BlockPreview blocks={draft.blocks} />
          ) : (
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <input required placeholder="Title" value={draft.title} onChange={e => set("title", e.target.value)} className="rounded-xl border border-[#d7e8eb] bg-white px-4 py-3 text-sm outline-none focus:border-[#13b8b0]" />
                <input required placeholder="slug-like-this" value={draft.slug} onChange={e => set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))} className="rounded-xl border border-[#d7e8eb] bg-white px-4 py-3 text-sm outline-none focus:border-[#13b8b0]" />

                <div>
                  <input required list="blog-categories" placeholder="Category" value={draft.category} onChange={e => set("category", e.target.value)} className="w-full rounded-xl border border-[#d7e8eb] bg-white px-4 py-3 text-sm outline-none focus:border-[#13b8b0]" />
                  <datalist id="blog-categories">
                    {categorySuggestions.map(category => <option key={category} value={category} />)}
                  </datalist>
                </div>

                <input required placeholder="Author name" value={draft.authorName} onChange={e => set("authorName", e.target.value)} className="rounded-xl border border-[#d7e8eb] bg-white px-4 py-3 text-sm outline-none focus:border-[#13b8b0]" />
              </div>

              <ImageField label="Main image (thumbnail)" value={draft.coverImageUrl} onChange={value => set("coverImageUrl", value)} />

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#71809f]">Content blocks</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => addBlock("heading")} className="inline-flex items-center gap-1 rounded-full border border-[#b9d6db] bg-[#f8ffff] px-3 py-1.5 text-xs font-semibold text-[#53617d] transition hover:border-[#13b8b0] hover:text-[#13b8b0]"><Heading2 size={13} /> Heading</button>
                    <button type="button" onClick={() => addBlock("paragraph")} className="inline-flex items-center gap-1 rounded-full border border-[#b9d6db] bg-[#f8ffff] px-3 py-1.5 text-xs font-semibold text-[#53617d] transition hover:border-[#13b8b0] hover:text-[#13b8b0]"><Type size={13} /> Paragraph</button>
                    <button type="button" onClick={() => addBlock("image")} className="inline-flex items-center gap-1 rounded-full border border-[#b9d6db] bg-[#f8ffff] px-3 py-1.5 text-xs font-semibold text-[#53617d] transition hover:border-[#13b8b0] hover:text-[#13b8b0]"><ImageIcon size={13} /> Image</button>
                    <button type="button" onClick={() => addBlock("iframe")} className="inline-flex items-center gap-1 rounded-full border border-[#b9d6db] bg-[#f8ffff] px-3 py-1.5 text-xs font-semibold text-[#53617d] transition hover:border-[#13b8b0] hover:text-[#13b8b0]"><GripVertical size={13} /> Iframe</button>
                  </div>
                </div>

                {draft.blocks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#b9d6db] p-8 text-center text-sm text-[#71809f]">
                    No content yet — add a heading, paragraph, image or iframe to start the article.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {draft.blocks.map((block, index) => (
                      <BlockRow key={block.id} block={block} index={index} total={draft.blocks.length} onChange={next => changeBlock(index, next)} onRemove={() => removeBlock(index)} onMove={dir => moveBlock(index, dir)} />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-[#d7e8eb] pt-4">
                <button
                  type="submit"
                  disabled={!canSubmit || create.isPending || update.isPending}
                  className="btn inline-flex items-center rounded-full bg-[#172039] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-55"
                >
                  {editingId
                    ? (draft.status === "PUBLISHED" ? "Update article" : "Save draft")
                    : (draft.status === "PUBLISHED" ? "Publish article" : "Save draft")}
                </button>
                <button
                  type="button"
                  onClick={() => set("status", draft.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED")}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${draft.status === "PUBLISHED" ? "border-[#c7f76d] bg-[#c7f76d] text-[#172039]" : "border-[#d7e8eb] bg-[#f8ffff] text-[#53617d]"}`}
                >
                  <Globe2 size={14} /> {draft.status === "PUBLISHED" ? "Published" : "Draft"}
                </button>
                <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-full border border-[#d7e8eb] bg-[#f8ffff] px-4 py-2.5 text-sm font-semibold text-[#53617d]">
                  <X size={15} /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="mt-7 space-y-3">
        {posts.isLoading ? (
          <p className="py-8 text-center text-sm text-[#53617d]">Loading posts…</p>
        ) : posts.data?.length ? (
          posts.data.map(post => (
            <article key={post.id} className="flex flex-col gap-4 rounded-2xl border border-[#d7e8eb] p-4 md:flex-row md:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e9f7f6] text-[#13b8b0]">
                {post.status === "PUBLISHED" ? <Globe2 size={20} /> : <FileText size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold">{post.title}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${post.status === "PUBLISHED" ? "bg-[#c7f76d] text-[#172039]" : "bg-[#fff4c6] text-[#8a6500]"}`}>{post.status}</span>
                </div>
                <p className="mt-1 text-sm text-[#53617d]">{post.category} · {post.authorName} · {post.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => edit(post)} className="inline-flex items-center rounded-full border border-[#d7e8eb] px-3 py-2 text-sm font-semibold hover:bg-[#e9f7f6]">Edit</button>
                <button onClick={() => { if (window.confirm("Delete this article?")) remove.mutate({ id: post.id }); }} className="inline-flex items-center rounded-full bg-[#ffe0d7] px-3 py-2 text-sm font-semibold text-[#a33e23]" aria-label={`Delete ${post.title}`}><Trash2 size={15} /></button>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#b9d6db] p-12 text-center text-[#53617d]">No blog posts yet. Start with an article for your future audience.</div>
        )}
      </div>
    </section>
  );
}
