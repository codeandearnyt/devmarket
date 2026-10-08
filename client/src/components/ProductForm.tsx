import { useState } from "react";
import { Loader2, X } from "lucide-react";
import ProductImageDropzone from "@/components/ProductImageDropzone";

export type ProductDraft = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  type: "SOURCE_CODE" | "PROMPT" | "PROJECT";
  categoryId: number;
  price: number;
  thumbnailUrl: string;
  fileUrl: string;
  previewImages: string[];
};

export const emptyProductDraft: ProductDraft = {
  title: "",
  slug: "",
  shortDescription: "",
  description: "",
  type: "PROJECT",
  categoryId: 0,
  price: 0,
  thumbnailUrl: "",
  fileUrl: "",
  previewImages: [],
};

/** Turn a title into a URL-safe slug, the same way the storefront expects. */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type Category = { id: number; name: string };

/**
 * Create/edit form for a catalogue product.
 *
 * `ProductImageDropzone` owns the preview gallery (it uploads and returns
 * URLs), so it is wired through its `value`/`onChange` props and the first
 * uploaded image doubles as the cover thumbnail.
 */
export default function ProductForm({
  draft,
  categories,
  pending,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: {
  draft: ProductDraft;
  categories: Category[];
  pending: boolean;
  submitLabel: string;
  onChange: (next: ProductDraft) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [showSlugField, setShowSlugField] = useState(Boolean(draft.slug));

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => {
    onChange({ ...draft, [key]: value });
  };

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        onSubmit();
      }}
      className="mb-8 rounded-[1.75rem] border border-[#d7e8eb] bg-[#f8ffff] p-6 lg:p-7"
    >
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold tracking-[-.04em]">
          {submitLabel}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close product form"
          className="rounded-lg p-1.5 text-[#71809f] transition hover:bg-[#e9f7f6] hover:text-[#172039]"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="block text-sm font-semibold">
          Title
          <input
            required
            maxLength={220}
            value={draft.title}
            onChange={event => {
              const title = event.target.value;
              // Keep the slug in sync until the author edits it by hand.
              onChange({
                ...draft,
                title,
                slug: showSlugField ? draft.slug : slugify(title),
              });
            }}
            placeholder="Production Next.js starter"
            className="mt-2 w-full rounded-xl border border-[#d7e8eb] bg-white px-4 py-3 font-normal outline-none transition focus:border-[#13b8b0]"
          />
        </label>

        <label className="block text-sm font-semibold">
          Slug
          <span className="mt-2 flex items-center gap-2">
            <input
              required
              maxLength={240}
              value={draft.slug}
              onChange={event => {
                setShowSlugField(true);
                set("slug", slugify(event.target.value));
              }}
              placeholder="production-nextjs-starter"
              className="w-full rounded-xl border border-[#d7e8eb] bg-white px-4 py-3 font-normal outline-none transition focus:border-[#13b8b0]"
            />
          </span>
          <span className="mt-1 block text-xs font-normal text-[#71809f]">
            /product/{draft.slug || "your-slug"}
          </span>
        </label>

        <label className="block text-sm font-semibold">
          Short description
          <input
            required
            maxLength={320}
            value={draft.shortDescription}
            onChange={event => set("shortDescription", event.target.value)}
            placeholder="One line that sells the product."
            className="mt-2 w-full rounded-xl border border-[#d7e8eb] bg-white px-4 py-3 font-normal outline-none transition focus:border-[#13b8b0]"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-semibold">
            Type
            <select
              value={draft.type}
              onChange={event => set("type", event.target.value as ProductDraft["type"])}
              className="mt-2 w-full rounded-xl border border-[#d7e8eb] bg-white px-4 py-3 font-normal outline-none transition focus:border-[#13b8b0]"
            >
              <option value="PROJECT">Full project</option>
              <option value="SOURCE_CODE">Source code</option>
              <option value="PROMPT">AI prompt</option>
            </select>
          </label>

          <label className="block text-sm font-semibold">
            Category
            <select
              required
              value={draft.categoryId || ""}
              onChange={event => set("categoryId", Number(event.target.value))}
              className="mt-2 w-full rounded-xl border border-[#d7e8eb] bg-white px-4 py-3 font-normal outline-none transition focus:border-[#13b8b0]"
            >
              <option value="" disabled>Select…</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm font-semibold">
          Price (₹)
          <input
            required
            type="number"
            min={0}
            value={draft.price || ""}
            onChange={event => set("price", Number(event.target.value))}
            className="mt-2 w-full rounded-xl border border-[#d7e8eb] bg-white px-4 py-3 font-normal outline-none transition focus:border-[#13b8b0]"
          />
        </label>

        <label className="block text-sm font-semibold">
          Download file URL
          <input
            required
            value={draft.fileUrl}
            onChange={event => set("fileUrl", event.target.value)}
            placeholder="https://…/starter.zip"
            className="mt-2 w-full rounded-xl border border-[#d7e8eb] bg-white px-4 py-3 font-normal outline-none transition focus:border-[#13b8b0]"
          />
        </label>
      </div>

      <label className="mt-5 block text-sm font-semibold">
        Description
        <textarea
          required
          rows={5}
          value={draft.description}
          onChange={event => set("description", event.target.value)}
          placeholder="What is included, who it is for, and how to use it."
          className="mt-2 w-full rounded-xl border border-[#d7e8eb] bg-white px-4 py-3 font-normal leading-7 outline-none transition focus:border-[#13b8b0]"
        />
      </label>

      <div className="mt-5">
        <p className="text-sm font-semibold">Preview images</p>
        <div className="mt-2">
          <ProductImageDropzone
            value={draft.previewImages}
            onChange={urls => onChange({ ...draft, previewImages: urls, thumbnailUrl: urls[0] ?? "" })}
          />
        </div>
        <p className="mt-2 text-xs text-[#71809f]">The first image is used as the storefront thumbnail.</p>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-[#d7e8eb] px-5 py-3 text-sm font-semibold text-[#53617d] transition hover:bg-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="btn inline-flex items-center rounded-full bg-[#172039] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#13b8b0] disabled:opacity-60"
        >
          {pending && <Loader2 size={16} className="mr-2 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}