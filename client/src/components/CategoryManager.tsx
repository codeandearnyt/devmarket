import { Check, FolderPlus, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type Category = { id: number; name: string; slug: string; description: string | null };
type Draft = { name: string; slug: string; description: string };
const empty: Draft = { name: "", slug: "", description: "" };

export default function CategoryManager() {
  const utils = trpc.useUtils();
  const categories = trpc.admin.categories.useQuery();
  const [draft, setDraft] = useState<Draft>(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const create = trpc.admin.createCategory.useMutation({ onSuccess: () => { void categories.refetch(); reset(); toast.success("Category added"); }, onError: error => toast.error(error.message) });
  const update = trpc.admin.updateCategory.useMutation({ onSuccess: () => { void categories.refetch(); reset(); toast.success("Category updated"); }, onError: error => toast.error(error.message) });
  const remove = trpc.admin.deleteCategory.useMutation({ onSuccess: () => { void categories.refetch(); toast.success("Category deleted"); }, onError: error => toast.error(error.message) });

  const set = (key: keyof Draft, value: string) => setDraft(current => ({ ...current, [key]: value }));
  function reset() { setDraft(empty); setEditingId(null); setOpen(false); }
  function startNew() { setDraft(empty); setEditingId(null); setOpen(true); }
  function edit(category: Category) { setDraft({ name: category.name, slug: category.slug, description: category.description ?? "" }); setEditingId(category.id); setOpen(true); }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const input = { name: draft.name.trim(), slug: draft.slug.trim().toLowerCase(), description: draft.description.trim() || undefined };
    if (editingId) update.mutate({ id: editingId, ...input }); else create.mutate(input);
  }

  const pending = create.isPending || update.isPending;

  return (
    <section className="mt-9 rounded-2xl border border-[#d7e8eb] bg-[#f8ffff] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#71809f]">Taxonomy</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Categories</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#53617d]">Group products into browsable shelves. A category holding products cannot be deleted until they are moved.</p>
        </div>
        <button onClick={startNew} className="btn inline-flex items-center rounded-full bg-[#172039] px-4 py-2.5 text-sm font-semibold text-white"><FolderPlus size={16} className="mr-2" /> Add category</button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-6 grid gap-3 rounded-2xl bg-[#e9f7f6] p-5 md:grid-cols-2">
          <input required placeholder="Category name" value={draft.name} onChange={event => set("name", event.target.value)} className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none focus:border-[#13b8b0]" />
          <input required placeholder="url-slug" value={draft.slug} onChange={event => set("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none focus:border-[#13b8b0]" />
          <input placeholder="Short description (optional)" value={draft.description} onChange={event => set("description", event.target.value)} className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none focus:border-[#13b8b0] md:col-span-2" />
          <div className="flex items-center gap-3 md:col-span-2">
            <button type="submit" disabled={pending} className="btn inline-flex items-center rounded-full bg-[#172039] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-55">
              {pending ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Check size={15} className="mr-2" />}
              {editingId ? "Save changes" : "Create category"}
            </button>
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-full border border-[#d7e8eb] bg-[#f8ffff] px-4 py-2.5 text-sm font-semibold text-[#53617d]"><X size={15} /> Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-7 space-y-3">
        {categories.isLoading ? (
          <p className="py-8 text-center text-sm text-[#53617d]">Loading categories…</p>
        ) : categories.data?.length ? (
          categories.data.map(category => (
            <div key={category.id} className="flex flex-col gap-3 rounded-2xl border border-[#d7e8eb] p-4 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-lg font-semibold">{category.name}</h3>
                <p className="mt-1 font-mono text-xs text-[#71809f]">/{category.slug}</p>
                {category.description ? <p className="mt-1 text-sm text-[#53617d]">{category.description}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => edit(category)} aria-label={`Edit ${category.name}`} className="inline-flex items-center rounded-full border border-[#d7e8eb] px-3 py-2 text-sm font-semibold hover:bg-[#e9f7f6]"><Pencil size={15} className="mr-1.5" /> Edit</button>
                <button
                  onClick={() => {
                    if (!window.confirm(`Delete the category "${category.name}"?`)) return;
                    remove.mutate({ id: category.id });
                  }}
                  className="inline-flex items-center rounded-full bg-[#ffe0d7] px-3 py-2 text-sm font-semibold text-[#a33e23]"
                  aria-label={`Delete ${category.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#b9d6db] p-12 text-center text-[#53617d]">No categories yet — add your first shelf.</div>
        )}
      </div>
    </section>
  );
}
