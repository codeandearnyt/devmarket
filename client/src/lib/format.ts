/**
 * Shared display formatters.
 *
 * These used to live in `pages/Home`, which meant every page that printed a
 * price — the admin console, the buyer library, checkout — had to import
 * `Home` to reach them. That pulled the entire landing page (and its chunk of
 * catalogue UI) into those bundles and, more importantly, forced `Home` to be
 * eagerly imported for the router. Keeping the formatters here lets the landing
 * page be lazy like every other route.
 */

export type ProductCardData = {
  id: number;
  title: string;
  slug: string;
  type: string;
  shortDescription: string;
  description: string;
  price: number;
  discountPrice: number | null;
  thumbnailUrl: string;
  techStack?: string[];
  salesCount: number;
  categoryId?: number;
  fileUrl?: string;
  isFeatured?: boolean;
};

export function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

/** Product prices are either Free (₹0) or a custom amount - never show "₹0". */
export function priceLabel(value: number) {
  return value === 0 ? "Free" : money(value);
}

/**
 * Types are admin-managed rows now, so unknown slugs fall back to a prettified
 * version of the slug itself instead of a wrong label.
 */
export function typeLabel(type: string) {
  if (type === "SOURCE_CODE") return "Source code";
  if (type === "PROMPT") return "AI prompt";
  if (type === "PROJECT") return "Full project";
  return type
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}