import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Ban,
  CircleDollarSign,
  ExternalLink,
  ImageOff,
  Loader2,
  QrCode,
  Receipt,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import LoadingAnimation from "@/components/LoadingAnimation";
import { money } from "@/lib/format";

/**
 * Structural type for one row of `admin.orders`.
 *
 * Declared here rather than inferred from the router so this panel keeps
 * compiling if the server adds a column. Anything genuinely required for the
 * decisions on screen is listed; anything else is ignored rather than fatal.
 */
type OrderRow = {
  order: {
    id: number;
    orderNumber: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    status: string;
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    qrScreenshotUrl: string | null;
    manualPaymentNote: string | null;
    adminRejectionReason: string | null;
    createdAt: Date | string;
  };
  product: { id: number; title: string };
  buyer: { id: number; name: string | null; email: string | null };
};

type OrdersQuery = {
  data?: OrderRow[];
  isPending: boolean;
  refetch: () => unknown;
};
type ApproveMutation = { mutate: (input: { id: number }) => void; isPending: boolean };
type RejectMutation = { mutate: (input: { id: number; reason: string }) => void; isPending: boolean };

/**
 * Payment method labels.
 *
 * The enum has three members - RAZORPAY, MANUAL_QR and FREE - so this is a map
 * and not a two-way ternary. Treating everything that is not RAZORPAY as a
 * manual QR order meant a FREE listing rendered with a "Manual QR" badge and an
 * empty Razorpay payment id, which is a category error: nothing was paid, so
 * there is no method to report and nothing to verify.
 */
const METHOD_LABEL: Record<string, string> = {
  RAZORPAY: "Razorpay",
  MANUAL_QR: "Manual QR",
  FREE: "Free",
};

const STATUS_TONE: Record<string, string> = {
  PENDING: "neu-admin-pill text-[#8a6500] bg-[#fff4c6]",
  PAID: "neu-admin-pill text-[#0f7a18] bg-[#dcf5d2]",
  DELIVERED: "neu-admin-pill text-[#172039] bg-[#c7f76d]",
  REJECTED: "neu-admin-pill text-[#a33e23] bg-[#ffe4dc]",
};

const FILTERS = [
  { key: "review", label: "Needs review" },
  { key: "PAID", label: "Paid" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "REJECTED", label: "Rejected" },
  { key: "all", label: "All" },
] as const;

function when(value: Date | string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** The buyer's payment screenshot, or an honest statement that there is none. */
function PaymentProof({ order }: { order: OrderRow["order"] }) {
  // A free listing has nothing to prove. Saying "no screenshot was submitted"
  // about a ₹0 order reads as a missing payment, which is wrong.
  if (order.paymentMethod === "FREE") {
    return (
      <div className="neu-admin-card-inset flex items-start gap-3 p-4">
        <BadgeCheck size={16} className="mt-0.5 shrink-0 text-[#0f8f88]" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#55697a]">Proof</p>
          <p className="mt-1 text-sm leading-6 text-[#4a6b78]">
            Nothing to check. This listing is free, so no payment was taken and no
            receipt exists.
          </p>
        </div>
      </div>
    );
  }

  if (!order.qrScreenshotUrl) {
    return (
      <div className="neu-admin-card-inset flex items-start gap-3 p-4">
        <ImageOff size={16} className="mt-0.5 shrink-0 text-[#6d8290]" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#55697a]">Proof</p>
          <p className="mt-1 text-sm leading-6 text-[#4a6b78]">
            No screenshot was submitted with this order.
            {order.paymentMethod === "RAZORPAY"
              ? " Card payments are verified by Razorpay's signature check, so no upload is expected."
              : " A manual QR order cannot be approved without one."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="neu-admin-card-inset p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#55697a]">Payment proof</p>
        <a
          href={order.qrScreenshotUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0f8f88] transition hover:text-[#0b6f6a]"
        >
          Open full size
          <ExternalLink size={12} aria-hidden="true" />
          <span className="sr-only">in a new tab</span>
        </a>
      </div>
      <a
        href={order.qrScreenshotUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block overflow-hidden rounded-xl border border-[#d7e8eb] bg-white"
      >
        <img
          src={order.qrScreenshotUrl}
          alt={`Payment screenshot submitted for order ${order.orderNumber}`}
          loading="lazy"
          decoding="async"
          className="block max-h-72 w-full object-contain"
        />
      </a>
    </div>
  );
}

function OrderCard({
  row,
  approve,
  reject,
}: {
  row: OrderRow;
  approve: ApproveMutation;
  reject: RejectMutation;
}) {
  const { order, product, buyer } = row;
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  // Only a pending manual-QR order is waiting on a human. Everything else the
  // gateway has already settled, so offering an approve button on it would be
  // offering to do something that has nothing to do.
  const needsReview = order.status === "PENDING" && order.paymentMethod === "MANUAL_QR";
  const busy = approve.isPending || reject.isPending;

  const submitReject = () => {
    const trimmed = reason.trim();
    // The server enforces min 4; mirroring it here avoids a round trip that is
    // only ever going to come back as an error toast.
    if (trimmed.length < 4) return;
    reject.mutate({ id: order.id, reason: trimmed });
  };

  return (
    <article className="neu-admin-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl font-semibold tracking-[-.03em] text-[#172039]">
              {product.title}
            </h3>
            <span className={STATUS_TONE[order.status] ?? "neu-admin-pill text-[#4a6b78]"}>
              {order.status}
            </span>
            <span className="neu-admin-pill text-[#4a6b78]">
              {METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#4a6b78]">
            {buyer.name ?? "Buyer"} · {buyer.email ?? "no email on file"}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[.14em] text-[#55697a]">
            {order.orderNumber} · {when(order.createdAt)}
          </p>
        </div>
        <p className="font-display text-2xl font-semibold tracking-[-.03em] text-[#172039]">
          {order.currency} {money(order.amount)}
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          {order.paymentMethod === "FREE" ? (
            <div className="neu-admin-card-inset flex items-start gap-3 p-4">
              <BadgeCheck size={16} className="mt-0.5 shrink-0 text-[#0f8f88]" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#55697a]">
                  Reference
                </p>
                <p className="mt-1 text-sm leading-6 text-[#4a6b78]">
                  A free listing, so there is no payment to reconcile.
                </p>
              </div>
            </div>
          ) : order.paymentMethod === "MANUAL_QR" ? (
            <div className="neu-admin-card-inset flex items-start gap-3 p-4">
              <QrCode size={16} className="mt-0.5 shrink-0 text-[#0f8f88]" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#55697a]">
                  Buyer-supplied reference
                </p>
                <p className="mt-1 break-words text-sm text-[#172039]">
                  {order.manualPaymentNote || (
                    <span className="text-[#6d8290]">None supplied</span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="neu-admin-card-inset flex items-start gap-3 p-4">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#0f8f88]" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#55697a]">
                  Gateway reference
                </p>
                <dl className="mt-2 space-y-1 text-sm text-[#172039]">
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-[#55697a]">Payment</dt>
                    <dd className="min-w-0 break-all font-mono text-xs">{order.razorpayPaymentId || "—"}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-[#55697a]">Order</dt>
                    <dd className="min-w-0 break-all font-mono text-xs">{order.razorpayOrderId || "—"}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {order.adminRejectionReason ? (
            <div className="rounded-xl border-l-4 border-[#a33e23] bg-[#fff4f0] p-4">
              <p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#a33e23]">
                Rejection reason shown to the buyer
              </p>
              <p className="mt-1 text-sm leading-6 text-[#172039]">{order.adminRejectionReason}</p>
            </div>
          ) : null}
        </div>

        <PaymentProof order={order} />
      </div>

      {needsReview ? (
        <div className="mt-6 border-t border-[#d7e8eb] pt-6">
          {!rejecting ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => approve.mutate({ id: order.id })}
                className="neu-admin-btn inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold disabled:opacity-55"
              >
                {approve.isPending ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                ) : (
                  <BadgeCheck size={16} aria-hidden="true" />
                )}
                Approve &amp; deliver
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setRejecting(true)}
                className="neu-admin-btn-danger inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold disabled:opacity-55"
              >
                <Ban size={16} aria-hidden="true" />
                Reject
              </button>
              <p className="self-center text-xs text-[#55697a]">
                Approving releases the download and emails the buyer.
              </p>
            </div>
          ) : (
            <div>
              <label
                htmlFor={`reject-${order.id}`}
                className="block text-xs font-semibold uppercase tracking-[.12em] text-[#55697a]"
              >
                Reason (shown to the buyer)
              </label>
              <textarea
                id={`reject-${order.id}`}
                value={reason}
                onChange={event => setReason(event.target.value)}
                maxLength={500}
                autoFocus
                placeholder="e.g. The screenshot shows a transfer to a different UPI ID."
                className="mt-2 min-h-24 w-full px-4 py-3 text-sm outline-none"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={reject.isPending || reason.trim().length < 4}
                  onClick={submitReject}
                  className="neu-admin-btn-danger inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold disabled:opacity-55"
                >
                  {reject.isPending ? (
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Ban size={16} aria-hidden="true" />
                  )}
                  Confirm rejection
                </button>
                <button
                  type="button"
                  disabled={reject.isPending}
                  onClick={() => {
                    setRejecting(false);
                    setReason("");
                  }}
                  className="neu-admin-btn px-5 py-3 text-sm font-semibold disabled:opacity-55"
                >
                  Cancel
                </button>
                <span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#55697a]">
                  {reason.trim().length}/500 · 4 minimum
                </span>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}

/**
 * Payments and payment proofs.
 *
 * The order rows, the approve and reject mutations all existed in the server
 * router and were already being called from AdminDashboard — but approve and
 * reject were never rendered, so the two mutations were dead code and the only
 * place an order's status could change was nowhere. This panel is where a
 * manual-QR buyer actually gets looked at.
 */
export default function PaymentsPanel({
  orders,
  approve,
  reject,
}: {
  orders: OrdersQuery;
  approve: ApproveMutation;
  reject: RejectMutation;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("review");

  const rows = orders.data ?? [];

  const counts = useMemo(() => {
    const review = rows.filter(
      r => r.order.status === "PENDING" && r.order.paymentMethod === "MANUAL_QR",
    ).length;
    const settled = rows.filter(r => r.order.status === "PAID" || r.order.status === "DELIVERED");
    return {
      review,
      settled: settled.reduce((sum, r) => sum + r.order.amount, 0),
      manual: rows.filter(r => r.order.paymentMethod === "MANUAL_QR").length,
      card: rows.filter(r => r.order.paymentMethod === "RAZORPAY").length,
    };
  }, [rows]);

  const visible = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "review")
      return rows.filter(
        r => r.order.status === "PENDING" && r.order.paymentMethod === "MANUAL_QR",
      );
    return rows.filter(r => r.order.status === filter);
  }, [rows, filter]);

  return (
    <section className="mt-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#13b8b0]">
            Money in
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-.06em]">
            Payments &amp; proofs
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4a6b78]">
            Card payments settle through Razorpay on their own. Manual QR orders wait here
            until someone matches the screenshot against the amount.
          </p>
        </div>
        <Wallet className="hidden text-[#13b8b0] sm:block" size={28} aria-hidden="true" />
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="neu-admin-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#55697a]">
            Needs review
          </p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-[-.04em] text-[#172039]">
            {counts.review}
          </p>
          <p className="mt-1 text-xs text-[#55697a]">Manual QR awaiting a decision</p>
        </div>
        <div className="neu-admin-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#55697a]">
            Settled value
          </p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-[-.04em] text-[#172039]">
            {money(counts.settled)}
          </p>
          <p className="mt-1 text-xs text-[#55697a]">Paid and delivered orders</p>
        </div>
        <div className="neu-admin-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#55697a]">
            Manual QR
          </p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-[-.04em] text-[#172039]">
            {counts.manual}
          </p>
          <p className="mt-1 text-xs text-[#55697a]">Needs a human to verify</p>
        </div>
        <div className="neu-admin-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#55697a]">
            Card / Razorpay
          </p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-[-.04em] text-[#172039]">
            {counts.card}
          </p>
          <p className="mt-1 text-xs text-[#55697a]">Verified by signature</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter payments">
        {FILTERS.map(item => {
          const active = filter === item.key;
          const n =
            item.key === "all"
              ? rows.length
              : item.key === "review"
                ? counts.review
                : rows.filter(r => r.order.status === item.key).length;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(item.key)}
              className={`btn rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-[#172039] text-white"
                  : "neu-admin-btn text-[#4a6b78] hover:text-[#0f8f88]"
              }`}
            >
              {item.label}
              <span className="ml-2 font-mono text-[10px] opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        {orders.isPending ? (
          <div className="flex flex-col items-center gap-5 py-20">
            <LoadingAnimation size={112} label="Loading payments" />
            <p className="text-sm text-[#4a6b78]">Loading payments…</p>
          </div>
        ) : visible.length ? (
          visible.map(row => (
            <OrderCard key={row.order.id} row={row} approve={approve} reject={reject} />
          ))
        ) : (
          <div className="neu-admin-card-inset px-6 py-20 text-center">
            {filter === "review" ? (
              <BadgeCheck size={34} className="mx-auto text-[#13b8b0]" aria-hidden="true" />
            ) : (
              <Receipt size={34} className="mx-auto text-[#6d8290]" aria-hidden="true" />
            )}
            <h3 className="mt-4 font-display text-2xl font-semibold tracking-[-.04em]">
              {filter === "review" ? "Nothing waiting on you." : "No orders here."}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#4a6b78]">
              {filter === "review"
                ? "Every manual QR order has been decided. Card payments clear without review."
                : "Try a different filter to see the rest of the ledger."}
            </p>
          </div>
        )}
      </div>

      {/* Stated in the product copy on the home page: the bento payment tile
          shows marks for UPI, Apple Pay, FamPay, USD and government payments.
          Checkout wires only Razorpay and manual QR today. Rather than let an
          operator assume each mark is a live gateway, the gap is written down
          here where the money actually lands. */}
      <p className="mt-8 flex items-start gap-2 text-xs leading-6 text-[#55697a]">
        <CircleDollarSign size={14} className="mt-1 shrink-0" aria-hidden="true" />
        <span>
          Two gateways are live: Razorpay for cards, and manual UPI QR where the buyer
          uploads a screenshot for review. The extra marks on the storefront payment tile
          are not separate integrations yet.
        </span>
      </p>
    </section>
  );
}