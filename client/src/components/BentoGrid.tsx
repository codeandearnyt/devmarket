import { BadgeCheck, Code2, CreditCard, Download, Images, ShieldCheck, Sparkles, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import ApplePay from "@/assets/apple-pay-icon.svg";
import FamPay from "@/assets/fampay.svg";
import Government from "@/assets/government-icon.svg";
import Mastercard from "@/assets/master-card-icon.svg";
import Razorpay from "@/assets/razorpay-icon.svg";
import UsdCoin from "@/assets/us-dollar-coin-color-icon.svg";
import Upi from "@/assets/upi-payment-icon.svg";
import Visa from "@/assets/visa-icon.svg";

/**
 * Payment marks shown on the payment tile.
 *
 * Each one is an <img> rather than an inline SVG because they are supplied
 * brand artwork: inlining would let a stray CSS rule recolour a payment logo,
 * and payment marks are exactly the kind of thing that has to look right.
 *
 * Their aspect ratios differ a lot (Razorpay is 4.6:1, FamPay and the USD coin
 * are 1:1), so each logo sits inside a fixed chip with object-contain.
 * Scaling them to a common *height* instead would let the Razorpay wordmark
 * stretch to four times the width of the Visa mark.
 *
 * Two columns, not four: the tiles are uniform now rather than one wide hero, so
 * a cell is about 110px. Four across left ~52px, which squeezed the wide marks
 * down to 6px tall - too small to recognise as a payment logo at all.
 */
const PAYMENT_METHODS: { label: string; src: string }[] = [
  { label: "UPI", src: Upi },
  { label: "Visa", src: Visa },
  { label: "Mastercard", src: Mastercard },
  { label: "Razorpay", src: Razorpay },
  { label: "Apple Pay", src: ApplePay },
  { label: "FamPay", src: FamPay },
  { label: "USD", src: UsdCoin },
  { label: "Government payments", src: Government },
];

/**
 * Bento grid for the storefront.
 *
 * Layout is a hierarchy of three weights on a 4-column grid:
 * - 1 hero tile: 2x2 (spans 2 cols, 2 rows) - the focal point
 * - 1 wide tile: 2x1 (spans 2 cols, 1 row) - secondary emphasis
 * - 6 small tiles: 1x1 each - supporting points
 *
 * The cell count is deliberate and exact: 4 + 2 + 6 = 12 = 4 cols x 3 rows.
 * A bento grid should hold exactly as many cells as it has content for; the
 * six-tile version covered only 10 and left two visible holes at the end of the
 * third row. Add a tile and the arithmetic has to stay at 12, or it breaks again.
 *
 * auto-rows-[minmax(0,1fr)] keeps the rows equal height. Columns go 1 on mobile,
 * 2 from sm, 4 from lg - and the spans are lg-only, so the tablet and mobile
 * layouts are a plain uniform stack.
 *
 * The per-tile colour is passed through as a CSS custom property, which the
 * `.bento-tile` rule mixes into its gradient. One rule therefore covers every
 * tile while each still reads as its own colour.
 */
type BentoTile = {
  id: string;
  title: string;
  copy: string;
  icon: LucideIcon;
  tint: string;
  /** Extra stat shown on the tiles that lead with a number. */
  stat?: { value: string; label: string };
  /** Render the accepted payment marks, on the payment-related tile only. */
  showPayments?: boolean;
  /** Grid span: "lg:col-span-2 lg:row-span-2" for hero, "lg:col-span-2" for wide, none for small. */
  span?: string;
};

const TILES: BentoTile[] = [
  {
    id: "instant",
    title: "Buy once, own it forever",
    copy: "No subscription, no seat count, no renewal. Every purchase unlocks a download you can keep.",
    icon: Download,
    tint: "#13b8b0",
    stat: { value: "Instant", label: "unlocked on payment" },
    showPayments: true,
    span: "lg:col-span-2 lg:row-span-2",
  },
  {
    id: "checkout",
    title: "Checkout that does not stall",
    copy: "Card through Razorpay, or scan a QR and submit the proof — either way you reach a confirmed order.",
    icon: CreditCard,
    tint: "#7658f5",
    span: "lg:col-span-2",
  },
  {
    id: "quality",
    title: "Reviewed, not dumped",
    copy: "Every listing goes through a quality check before it reaches the library.",
    icon: ShieldCheck,
    tint: "#13b8b0",
  },
  {
    id: "code",
    title: "Real code",
    copy: "Starters and full projects with sensible defaults, not a zip of fragments.",
    icon: Code2,
    tint: "#172039",
  },
  {
    id: "fresh",
    title: "Fresh drops",
    copy: "New listings land every week, with version notes on everything that changes.",
    icon: Zap,
    tint: "#c7f76d",
  },
  {
    id: "curated",
    title: "Hand-picked",
    copy: "The library is edited. If something does not earn its place, it does not stay.",
    icon: Sparkles,
    tint: "#7658f5",
  },
  {
    id: "preview",
    title: "Look before you pay",
    copy: "Listings carry a preview gallery, so you can page through the actual work on the product page before you reach checkout.",
    icon: Images,
    tint: "#13b8b0",
  },
  {
    id: "reviews",
    title: "Reviews you can trust",
    copy: "A review only posts against a paid or delivered order. Nobody can rate something they have not bought.",
    icon: BadgeCheck,
    tint: "#c7f76d",
  },
];

export default function BentoGrid() {
  return (
    <section aria-labelledby="bento-heading" className="mx-auto max-w-[1280px] px-5 py-20 lg:px-8">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[.2em] text-[#13b8b0]">Why here</p>
          <h2 id="bento-heading" className="mt-3 font-display text-4xl font-semibold leading-[.95] tracking-[-.07em] md:text-5xl">
            Built for people who ship.
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-[#53617d]">
          No filler, no recurring plans, and no dead end at the last step of the checkout.
        </p>
      </div>

      {/* Hierarchical bento grid: 4-column base with varied spans for visual hierarchy.
          - Hero: 2x2 (lg:col-span-2 lg:row-span-2)
          - Wide: 2x1 (lg:col-span-2)
          - Small: 1x1 (no span)
          Grid base: auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 */}
      <div className="grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map(tile => {
          const Icon = tile.icon;
          return (
            <article
              key={tile.id}
              style={{ "--bento-tint": tile.tint } as React.CSSProperties}
              className={`bento-tile flex flex-col p-7 ${tile.span ?? ""}`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 text-[#172039] shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">
                <Icon size={20} aria-hidden="true" />
              </span>

              {tile.stat ? (
                <p className="mt-10">
                  <span className="type-sans block text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-none tracking-[-.03em] text-[#172039]">
                    {tile.stat.value}
                  </span>
                  <span className="type-mono mt-2 block text-[10px] font-semibold uppercase tracking-[.14em] text-[#53617d]">
                    {tile.stat.label}
                  </span>
                </p>
              ) : null}

              {/* Accepted payment marks. Only on the tile whose claim is
                  "Instant / unlocked on payment" - there the marks are the
                  evidence for the claim rather than decoration. A real <ul>, so
                  a screen reader gets the same list of names a sighted visitor
                  reads off the chips. */}
              {tile.showPayments ? (
                <ul className="mt-7 grid grid-cols-2 gap-2" aria-label="Accepted payment methods">
                  {PAYMENT_METHODS.map(method => (
                    <li
                      key={method.label}
                      className="flex h-14 w-full items-center justify-center rounded-xl border border-white/70 bg-white/65 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.9)]"
                    >
                      <img
                        src={method.src}
                        alt={method.label}
                        width={80}
                        height={36}
                        loading="lazy"
                        decoding="async"
                        className="max-h-9 max-w-full object-contain"
                      />
                    </li>
                  ))}
                </ul>
              ) : null}

              <h3 className="mt-9 font-display text-lg font-semibold tracking-[-.03em] text-[#172039]">
                {tile.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#53617d]">{tile.copy}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}