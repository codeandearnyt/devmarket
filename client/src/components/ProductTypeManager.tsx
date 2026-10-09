import { Check, Layers3, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type ProductType = { id: number; name: string; slug: string; description: string | null };
type Draft = { name: string; slug: string; description: string };
const empty: Draft = { name: "", slug: "", description: "" };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

/**
 * Type management for the catalogue. Types were once a Postgres enum, so this
 * panel is the whole point of moving them into a table: add, rename and remove
 * them from the console. Renames follow onto products (which store the slug).
 */
export default function ProductTypeManager() {
  const types = trpc.admin.productTypes.useQuery();
  const [draft, setDraft] = useState<Draft>(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const create = trpc.admin.createProductType.useMutation({
    onSuccess: () => { void types.refetch(); reset(); toast.success("Type added"); },
    onError: error => toast.error(error.message),
  });
  const update = trpc.admin.updateProductType.useMutation({
    onSuccess: () => { void types.refetch(); reset(); toast.success("Type updated — products re-tagged"); },
    onError: error => toast.error(error.message),
  });
  const remove = trpc.admin.deleteProductType.useMutation({
    onSuccess: () => { void types.refetch(); toast.success("Type deleted"); },
    onError: error => toast.error(error.message),
  });

  const set = (key: keyof Draft, value: string) => setDraft(current => ({ ...current, [key]: value }));
  function reset() { setDraft(empty); setEditingId(null); setOpen(false); }
  function startNew() { setDraft(empty); setEditingId(null); setOpen(true); }
  function edit(type: ProductType) { setDraft({ name: type.name, slug: type.slug, description: type.description ?? "" }); setEditingId(type.id); setOpen(true); }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const input = {
      name: draft.name.trim(),
      slug: draft.slug.trim() || slugify(draft.name),
      description: draft.description.trim() || undefined,
    };
    if (editingId) update.mutate({ id: editingId, ...input });
    else create.mutate(input);
  }

  const pending = create.isPending || update.isPending;

  return (
    <section className="mt-9 rounded-2xl border border-[#d7e8eb] bg-[#f8ffff] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#71809f]">Taxonomy</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Product types</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#53617d]">
            Types power the storefront filter tabs and the product form. Renaming a type re-tags every product that uses it; a type still in use cannot be deleted.
          </p>
        </div>
        <button onClick={startNew} className="btn inline-flex items-center rounded-full bg-[#172039] px-4 py-2.5 text-sm font-semibold text-white">
          <Plus size={16} className="mr-2" /> Add type
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-6 grid gap-3 rounded-2xl bg-[#e9f7f6] p-5 md:grid-cols-2">
          <input
            required
            placeholder="Type name (e.g. Starter Kit)"
            value={draft.name}
            onChange={event => {
              const name = event.target.value;
              setDraft(current => ({ ...current, name, slug: editingId ? current.slug : slugify(name) }));
            }}
            className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none focus:border-[#13b8b0]"
          />
          <input
            required
            placeholder="url-slug"
            value={draft.slug}
            onChange={event => set("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none focus:border-[#13b8b0]"
          />
          <input
            placeholder="Short description (optional)"
            value={draft.description}
            onChange={event => set("description", event.target.value)}
            className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none focus:border-[#13b8b0] md:col-span-2"
          />
          <div className="flex items-center gap-3 md:col-span-2">
            <button type="submit" disabled={pending} className="btn inline-flex items-center rounded-full bg-[#172039] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-55">
              {pending ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Check size={15} className="mr-2" />}
              {editingId ? "Save changes" : "Create type"}
            </button>
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-full border border-[#d7e8eb] bg-[#f8ffff] px-4 py-2.5 text-sm font-semibold text-[#53617d]">
              <X size={15} /> Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-7 space-y-3">
        {types.isLoading ? (
          <p className="py-8 text-center text-sm text-[#53617d]">Loading types…</p>
        ) : types.data?.length ? (
          types.data.map(type => (
            <div key={type.id} className="flex flex-col gap-3 rounded-2xl border border-[#d7e8eb] p-4 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
                  <Layers3 size={16} className="text-[#13b8b0]" /> {type.name}
                </h3>
                <p className="mt-1 font-mono text-xs text-[#71809f]">/{type.slug}</p>
                {type.description ? <p className="mt-1 text-sm text-[#53617d]">{type.description}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => edit(type)} aria-label={`Edit ${type.name}`} className="inline-flex items-center rounded-full border border-[#d7e8eb] px-3 py-2 text-sm font-semibold hover:bg-[#e9f7f6]">
                  <Pencil size={15} className="mr-1.5" /> Edit
                </button>
                <button
                  onClick={() => {
                    if (!window.confirm(`Delete the type "${type.name}"? Products using it must be re-tagged first.`)) return;
                    remove.mutate({ id: type.id });
                  }}
                  className="inline-flex items-center rounded-full bg-[#ffe0d7] px-3 py-2 text-sm font-semibold text-[#a33e23]"
                  aria-label={`Delete ${type.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#b9d6db] p-12 text-center text-[#53617d]">No types yet — add your first product type.</div>
        )}
      </div>
    </section>
  );
}
