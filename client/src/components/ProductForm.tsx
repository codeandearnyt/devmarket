import { useState } from "react";
import { BadgeIndianRupee, Loader2, X } from "lucide-react";
import ImageField from "@/components/ImageField";
import ProductImageGallery from "@/components/ProductImageGallery";

export type ProductDraft = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  type: string;
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
  type: "source-code",
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
 * Pricing is either Free ($0) or a custom amount the admin types. Images come
 * from a URL or a browsed local file (stored inline as base64) — managed
 * storage is not configured in every environment, so the old server-upload
 * dropzone has been replaced by the URL + base64 fields.
 */
export type ProductTypeOption = { id: number; name: string; slug: string };

export default function ProductForm({
  draft,
  categories,
  types,
  pending,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: {
  draft: ProductDraft;
  categories: Category[];
  types: ProductTypeOption[];
  pending: boolean;
  submitLabel: string;
  onChange: (next: ProductDraft) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const [showSlugField, setShowSlugField] = useState(Boolean(draft.slug));
  const [pricingMode, setPricingModeState] = useState<"free" | "custom">(draft.price === 0 ? "free" : "custom");
  const [customPrice, setCustomPrice] = useState<number>(draft.price || 499);

  // Free pins the price to $0; Custom restores the last typed amount.
  const setPricingMode = (mode: "free" | "custom") => {
    setPricingModeState(mode);
    if (mode === "free") set("price", 0);
    else {
      const next = customPrice > 0 ? customPrice : 499;
      setCustomPrice(next);
      set("price", next);
    }
  };

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
              onChange={event => set("type", event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#d7e8eb] bg-white px-4 py-3 font-normal outline-none transition focus:border-[#13b8b0]"
            >
              {types.length === 0 ? (
                <option value="source-code">Source code</option>
              ) : (
                types.map(type => (
                  <option key={type.id} value={type.slug}>{type.name}</option>
                ))
              )}
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

        <div className="block text-sm font-semibold">
          <span>Pricing</span>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${pricingMode === "free" ? "border-[#13b8b0] bg-[#e9f7f6]" : "border-[#d7e8eb] bg-white hover:border-[#b9d6db]"}`}
            >
              <input
                type="radio"
                name="product-pricing"
                checked={pricingMode === "free"}
                onChange={() => setPricingMode("free")}
                className="mt-1 h-4 w-4 accent-[#13b8b0]"
              />
              <span>
                <span className="flex items-center gap-1.5 font-semibold text-[#172039]">
                  <BadgeIndianRupee size={14} /> Free
                </span>
                <span className="mt-1 block text-xs font-normal text-[#53617d]">$0 — totally free, shows “Free” in the storefront.</span>
              </span>
            </label>
            <label
              className={`cursor-pointer rounded-xl border p-4 transition ${pricingMode === "custom" ? "border-[#13b8b0] bg-[#e9f7f6]" : "border-[#d7e8eb] bg-white hover:border-[#b9d6db]"}`}
            >
              <span className="flex items-start gap-3">
                <input
                  type="radio"
                  name="product-pricing"
                  checked={pricingMode === "custom"}
                  onChange={() => setPricingMode("custom")}
                  className="mt-1 h-4 w-4 accent-[#13b8b0]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-[#172039]">Custom price</span>
                  <span className="mt-1 block text-xs font-normal text-[#53617d]">Set any amount in ₹.</span>
                  {pricingMode === "custom" && (
                    <input
                      required
                      type="number"
                      min={1}
                      step={1}
                      value={customPrice || ""}
                      onChange={event => {
                        const next = Math.max(0, Number(event.target.value));
                        setCustomPrice(next);
                        set("price", next);
                      }}
                      placeholder="499"
                      className="mt-3 w-full rounded-xl border border-[#d7e8eb] bg-white px-3 py-2.5 text-sm font-normal outline-none transition focus:border-[#13b8b0]"
                    />
                  )}
                </span>
              </span>
            </label>
          </div>
          <p className="mt-2 text-xs font-normal text-[#71809f]">
            {pricingMode === "free" ? "Price: Free ($0)" : `Price: ₹${(draft.price || 0).toLocaleString("en-IN")}`}
          </p>
        </div>

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
        <ImageField
          label="Main image (thumbnail)"
          value={draft.thumbnailUrl}
          onChange={url => set("thumbnailUrl", url)}
          hint="Shown on storefront cards, the product page, and checkout."
        />
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold">Preview images</p>
        <div className="mt-2">
          <ProductImageGallery
            value={draft.previewImages}
            onChange={urls => set("previewImages", urls)}
          />
        </div>
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