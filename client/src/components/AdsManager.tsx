import { useState } from "react";
import { Code2, Loader2, Megaphone, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

/**
 * Ad and AdSense management.
 *
 * A "slot" is a placement the storefront renders (blog sidebar, in-article,
 * top/bottom banner). Each row is one thing to show there, and `type` decides
 * what gets rendered:
 *
 *  - `html`     — admin-supplied markup. Used for an AdSense `<ins>` unit or
 *                 any custom snippet. Rendered through the placement renderer,
 *                 which strips `<script>` bodies and injects them properly.
 *  - `internal` — a first-party promo card (title, blurb, CTA, image). Safe by
 *                 construction: no admin HTML reaches the page.
 *
 * AdSense's own account-level tags belong in the site head, not in a slot, so
 * the client id and slot id are kept here only so the snippet generator can
 * fill them in.
 */
type Ad = {
  id: number;
  name: string;
  slot: Slot;
  /** `varchar` on the row, so the wire type is a plain string. */
  type: string;
  snippet: string | null;
  metaTags: string | null;
  adSenseClientId: string | null;
  adSenseSlotId: string | null;
  promoTitle: string | null;
  promoDescription: string | null;
  promoCtaText: string | null;
  promoCtaLink: string | null;
  promoImageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

type Slot = "sidebar" | "in-article" | "banner-top" | "banner-bottom";

type Draft = {
  name: string;
  slot: Slot;
  type: "html" | "internal";
  snippet: string;
  metaTags: string;
  adSenseClientId: string;
  adSenseSlotId: string;
  promoTitle: string;
  promoDescription: string;
  promoCtaText: string;
  promoCtaLink: string;
  promoImageUrl: string;
  sortOrder: number;
  isActive: boolean;
};

const SLOTS: Record<Slot, string> = {
  sidebar: "Sidebar",
  "in-article": "In-article",
  "banner-top": "Top banner",
  "banner-bottom": "Bottom banner",
};

const TYPES: Record<string, string> = { html: "HTML / AdSense", internal: "Internal promo" };

/** Narrow the wire string to what the form accepts. */
const asType = (value: string): "html" | "internal" => (value === "internal" ? "internal" : "html");

const emptyDraft: Draft = {
  name: "",
  slot: "sidebar",
  type: "html",
  snippet: "",
  metaTags: "",
  adSenseClientId: "",
  adSenseSlotId: "",
  promoTitle: "",
  promoDescription: "",
  promoCtaText: "",
  promoCtaLink: "",
  promoImageUrl: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdsManager() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const ads = trpc.admin.ads.useQuery();
  const createAd = trpc.admin.createAd.useMutation({
    onSuccess: () => { void ads.refetch(); reset(); toast.success("Ad created"); },
    onError: error => toast.error(error.message),
  });
  const updateAd = trpc.admin.updateAd.useMutation({
    onSuccess: () => { void ads.refetch(); reset(); toast.success("Ad updated"); },
    onError: error => toast.error(error.message),
  });
  const deleteAd = trpc.admin.deleteAd.useMutation({
    onSuccess: () => { void ads.refetch(); toast.success("Ad deleted"); },
    onError: error => toast.error(error.message),
  });

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft(current => ({ ...current, [key]: value }));

  function reset() {
    setDraft(emptyDraft);
    setEditingId(null);
    setOpen(false);
  }

  function startEdit(ad: Ad) {
    setDraft({
      name: ad.name,
      slot: ad.slot,
      type: asType(ad.type),
      snippet: ad.snippet ?? "",
      metaTags: ad.metaTags ?? "",
      adSenseClientId: ad.adSenseClientId ?? "",
      adSenseSlotId: ad.adSenseSlotId ?? "",
      promoTitle: ad.promoTitle ?? "",
      promoDescription: ad.promoDescription ?? "",
      promoCtaText: ad.promoCtaText ?? "",
      promoCtaLink: ad.promoCtaLink ?? "",
      promoImageUrl: ad.promoImageUrl ?? "",
      sortOrder: ad.sortOrder,
      isActive: ad.isActive,
    });
    setEditingId(ad.id);
    setOpen(true);
  }

  function submit() {
    if (!draft.name.trim()) { toast.error("Give the ad a name so you can find it later"); return; }
    if (draft.type === "html" && !draft.snippet.trim() && !draft.adSenseClientId.trim()) {
      toast.error("Paste a snippet or set an AdSense client id");
      return;
    }
    if (draft.type === "internal" && !draft.promoTitle.trim()) {
      toast.error("An internal promo needs a title");
      return;
    }
    const busy = editingId ? updateAd : createAd;
    if (editingId) updateAd.mutate({ id: editingId, ...draft });
    else createAd.mutate(draft);
    void busy;
  }

  function confirmDelete(ad: Ad) {
    if (window.confirm(`Delete the "${ad.name}" ad?\n\nIt disappears from the ${SLOTS[ad.slot].toLowerCase()} slot immediately.`)) {
      deleteAd.mutate({ id: ad.id });
    }
  }

  const rows = ads.data ?? [];
  const field = "w-full rounded-xl border border-transparent bg-[#e7f1f5] px-4 py-3 text-sm text-[#172039] outline-none transition placeholder:text-[#8fa8b3] neu-admin-well focus:neu-admin-well-focus";
  const label = "block text-sm font-semibold text-[#172039]";
  const hint = "mt-2 block text-xs font-normal text-[#5c7f8c]";

  return (
    <div className="mt-9 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="neu-admin-icon neu-admin-icon-accent"><Megaphone size={18} /></span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#5c7f8c]">Advertising</p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-.04em] text-[#172039]">Ads &amp; AdSense</h2>
          </div>
        </div>
        <button type="button" onClick={() => { reset(); setOpen(true); }} className="neu-admin-btn-dark inline-flex items-center px-4 py-2.5 text-sm font-semibold">
          <Plus size={16} className="mr-2" /> New ad
        </button>
      </header>

      {open ? (
        <form
          onSubmit={event => { event.preventDefault(); submit(); }}
          className="neu-admin-card space-y-6 p-6 lg:p-7"
        >
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-display text-xl font-semibold tracking-[-.03em] text-[#172039]">
              {editingId ? "Edit ad" : "New ad"}
            </h3>
            <button type="button" onClick={reset} aria-label="Close" className="neu-admin-icon-btn">
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className={`${label} sm:col-span-2 lg:col-span-1`}>
              Name
              <input value={draft.name} onChange={e => set("name", e.target.value)} placeholder="Sidebar leaderboard" className={`${field} mt-2`} />
            </label>
            <label className={label}>
              Slot
              <select value={draft.slot} onChange={e => set("slot", e.target.value as Slot)} className={`${field} neu-admin-well mt-2`}>
                {Object.entries(SLOTS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
              </select>
              <span className={hint}>Where it renders.</span>
            </label>
            <label className={label}>
              Type
              <select value={draft.type} onChange={e => set("type", e.target.value as "html" | "internal")} className={`${field} neu-admin-well mt-2`}>
                <option value="html">HTML / AdSense</option>
                <option value="internal">Internal promo</option>
              </select>
              <span className={hint}>What gets rendered.</span>
            </label>
            <label className={label}>
              Sort order
              <input type="number" value={draft.sortOrder} onChange={e => set("sortOrder", Number(e.target.value) || 0)} className={`${field} mt-2`} />
              <span className={hint}>Lower shows first.</span>
            </label>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={e => set("isActive", e.target.checked)}
              className="h-4 w-4 accent-[#13b8b0]"
            />
            <span className="text-sm font-semibold text-[#172039]">Active — show this ad in the slot</span>
          </label>

          {draft.type === "html" ? (
            <fieldset className="neu-admin-card-inset space-y-4 p-5">
              <legend className="px-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#5c7f8c]">HTML / AdSense</legend>
              <p className="text-xs leading-5 text-[#4a6b78]">
                Paste a ready-made AdSense unit, or just fill in the client + slot ids and we generate the
                snippet for you. Set this ad inactive while AdSense is still reviewing — an unapproved unit
                renders nothing and shows as policy error in AdSense.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={label}>
                  AdSense client id
                  <input value={draft.adSenseClientId} onChange={e => set("adSenseClientId", e.target.value)} placeholder="ca-pub-1234567890123456" className={`${field} mt-2 font-mono text-xs`} />
                </label>
                <label className={label}>
                  AdSense slot id
                  <input value={draft.adSenseSlotId} onChange={e => set("adSenseSlotId", e.target.value)} placeholder="1234567890" className={`${field} mt-2 font-mono text-xs`} />
                </label>
              </div>
              <label className={`${label} font-mono text-xs`}>
                Custom snippet (optional — overrides the generated unit)
                <textarea
                  value={draft.snippet}
                  onChange={e => set("snippet", e.target.value)}
                  rows={6}
                  spellCheck={false}
                  placeholder={'<ins class="adsbygoogle"\n     style="display:block"\n     data-ad-client="ca-pub-..."\n     data-ad-slot="..."\n     data-ad-format="auto"></ins>'}
                  className={`${field} mt-2 font-mono text-xs`}
                />
                <span className={hint}>
                  Script tags are extracted and executed after render, so this behaves like a real AdSense unit.
                </span>
              </label>
              <details className="rounded-xl bg-[#f4fafc] p-4">
                <summary className="cursor-pointer text-xs font-semibold text-[#0f8f88]">AdSense account-wide tags (head snippet)</summary>
                <p className="mt-2 text-xs leading-5 text-[#4a6b78]">
                  The `adsbygoogle.js` loader and `ca-pub-` script belong in the document head, not in a slot.
                  Paste them here and they are injected once per page when this ad is active.
                </p>
                <textarea
                  value={draft.metaTags}
                  onChange={e => set("metaTags", e.target.value)}
                  rows={4}
                  spellCheck={false}
                  placeholder={'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>'}
                  className={`${field} mt-3 font-mono text-xs`}
                />
              </details>
            </fieldset>
          ) : (
            <fieldset className="neu-admin-card-inset space-y-4 p-5">
              <legend className="px-2 font-mono text-[10px] uppercase tracking-[.16em] text-[#5c7f8c]">Internal promo</legend>
              <p className="text-xs leading-5 text-[#4a6b78]">
                A first-party card. No admin HTML is rendered, so this is the safe option for house promos.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={label}>
                  Title
                  <input value={draft.promoTitle} onChange={e => set("promoTitle", e.target.value)} placeholder="Ship faster with the SaaS starter kit" className={`${field} mt-2`} />
                </label>
                <label className={label}>
                  CTA text
                  <input value={draft.promoCtaText} onChange={e => set("promoCtaText", e.target.value)} placeholder="View the kit" className={`${field} mt-2`} />
                </label>
              </div>
              <label className={label}>
                Description
                <textarea value={draft.promoDescription} onChange={e => set("promoDescription", e.target.value)} rows={3} placeholder="Sign-in, billing, teams and an admin console — already wired up." className={`${field} mt-2`} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={label}>
                  CTA link
                  <input value={draft.promoCtaLink} onChange={e => set("promoCtaLink", e.target.value)} placeholder="/product/nextjs-saas-starter-kit" className={`${field} mt-2`} />
                </label>
                <label className={label}>
                  Image URL
                  <input value={draft.promoImageUrl} onChange={e => set("promoImageUrl", e.target.value)} placeholder="https://example.com/promo.png" className={`${field} mt-2`} />
                </label>
              </div>
            </fieldset>
          )}

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={reset} className="neu-admin-btn px-5 py-3 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={createAd.isPending || updateAd.isPending} className="neu-admin-btn-dark inline-flex items-center px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
              {createAd.isPending || updateAd.isPending
                ? <Loader2 size={16} className="mr-2 animate-spin" />
                : <Save size={16} className="mr-2" />}
              {editingId ? "Save changes" : "Create ad"}
            </button>
          </div>
        </form>
      ) : null}

      <section className="neu-admin-card overflow-hidden">
        {ads.isLoading ? (
          <p className="flex items-center justify-center gap-2 p-12 text-sm text-[#5c7f8c]"><Loader2 size={16} className="animate-spin" /> Loading ads…</p>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <Code2 size={28} className="mx-auto text-[#8fa8b3]" />
            <p className="mt-4 font-semibold text-[#172039]">No ads yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5c7f8c]">
              Add an AdSense unit or a house promo and it will appear in the slot you pick — no redeploy needed.
            </p>
          </div>
        ) : (
          <div className="neu-admin-scroll overflow-x-auto">
            <table className="w-full min-w-[46rem]">
              <thead className="neu-admin-table-head">
                <tr>
                  <Th>Name</Th><Th>Slot</Th><Th>Type</Th><Th>Status</Th><Th>Order</Th><Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(ad => (
                  <tr key={ad.id} className="border-b border-transparent">
                    <td className="px-5 py-4 text-sm font-semibold text-[#172039]">{ad.name}</td>
                    <td className="px-5 py-4"><span className="neu-admin-pill text-[#0f7a74]">{SLOTS[ad.slot]}</span></td>
                    <td className="px-5 py-4 text-sm text-[#4a6b78]">{TYPES[ad.type] ?? ad.type}</td>
                    <td className="px-5 py-4">
                      <span className={`neu-admin-pill ${ad.isActive ? "text-[#0f7a18]" : "text-[#a33e23]"}`}>
                        {ad.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-[#5c7f8c]">{ad.sortOrder}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => startEdit(ad)} aria-label={`Edit ${ad.name}`} className="neu-admin-icon-btn">
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(ad)}
                          disabled={deleteAd.isPending}
                          aria-label={`Delete ${ad.name}`}
                          className="neu-admin-icon-btn neu-admin-icon-btn-danger disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deleteAd.isPending && deleteAd.variables?.id === ad.id
                            ? <Loader2 size={15} className="animate-spin" />
                            : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-5 py-3.5 text-left font-mono text-[10px] uppercase tracking-[.14em] text-[#5c7f8c] ${className}`}>{children}</th>;
}