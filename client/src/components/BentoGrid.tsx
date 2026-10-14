import { Code2, CreditCard, Download, ShieldCheck, Sparkles, Zap } from "lucide-react";
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
 * Payment marks shown on the hero tile.
 *
 * Each one is an <img> rather than an inline SVG because they are supplied
 * brand artwork: inlining would let a stray CSS rule recolour a payment logo,
 * and payment marks are exactly the kind of thing that has to look right.
 *
 * Their aspect ratios differ a lot (Razorpay is 4.6:1, FamPay and the USD coin
 * are 1:1), so each logo sits inside a fixed-size chip with object-contain.
 * Scaling them to a common *height* instead would let the Razorpay wordmark
 * stretch to four times the width of the Visa mark.
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
 * Layout is deliberately uneven: a 4-column grid where the first tile takes two
 * columns and two rows, the second takes two columns, and the rest take one each.
 * An even 2x3 grid of identical cards is the thing bento is meant to replace — it
 * gives the section a focal point and lets the "why" tiles breathe.
 *
 * `span` is a grid-placement hint rather than a width, so the whole layout
 * collapses to a single column on a phone without a second set of markup.
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
  /** Extra stat shown on the larger tiles. */
  stat?: { value: string; label: string };
  /** Grid span at lg. Omitted means a single cell. */
  span?: string;
  /** Render the accepted payment marks. Only the hero tile has room for them. */
  showPayments?: boolean;
};

const TILES: BentoTile[] = [
  {
    id: "instant",
    title: "Buy once, own it forever",
    copy: "No subscription, no seat count, no renewal. Every purchase unlocks a download you can keep.",
    icon: Download,
    tint: "#13b8b0",
    stat: { value: "Instant", label: "unlocked on payment" },
    span: "lg:col-span-2 lg:row-span-2",
    showPayments: true,
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

      {/* Uneven on purpose: one hero tile, one wide tile, then a run of small ones. */}
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
                  <span className="block font-display text-[clamp(2rem,4vw,2.75rem)] font-bold leading-none tracking-[-.04em] text-[#172039]">
                    {tile.stat.value}
                  </span>
                  <span className="mt-2 block font-mono text-[10px] uppercase tracking-[.16em] text-[#53617d]">
                    {tile.stat.label}
                  </span>
                </p>
              ) : null}

              {/* Accepted payment marks. Only on the hero tile, which is the one
                  with room for them and the one whose claim is "unlocked on
                  payment" - so the marks are the evidence for it rather than
                  decoration. The list is a real <ul> so screen readers get the
                  same set of names a sighted visitor reads off the chips. */}
              {tile.showPayments ? (
                <ul className="mt-7 grid grid-cols-4 gap-2" aria-label="Accepted payment methods">
                  {PAYMENT_METHODS.map(method => (
                    <li
                      key={method.label}
                      className="flex h-11 items-center justify-center rounded-lg border border-white/70 bg-white/65 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,.9)]"
                    >
                      <img
                        src={method.src}
                        alt={method.label}
                        width={56}
                        height={24}
                        loading="lazy"
                        decoding="async"
                        className="max-h-full max-w-full object-contain"
                      />
                    </li>
                  ))}
                </ul>
              ) : null}

              {/*
                The hero tile spans two grid rows, so it is taller than its own
                content. That slack used to be taken by `mt-auto` between the
                payment marks and the heading, which left a hole in the middle of
                the card and read as a bug. Letting the spare space fall past the
                heading instead reads as ordinary bottom padding.
              */}
              <h3
                className={`${tile.stat ? "mt-9" : "mt-10"} font-display text-lg font-semibold tracking-[-.03em] text-[#172039]`}
              >
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