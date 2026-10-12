import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, Loader2, QrCode, Settings2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import ImageField from "@/components/ImageField";

/**
 * Payment configuration for the checkout.
 *
 * Two gates are configured here and every buyer sees the checkout's method
 * switch driven by them: Razorpay (card/UPI, server-verified) and Manual QR
 * (buyer scans, admin approves the proof). Credentials stay server-side — the
 * stored secret is never sent back to the browser, so the field only reports
 * whether one exists and submits a new value only when one is typed.
 */
export default function SettingsPanel() {
  const settings = trpc.admin.settings.useQuery();
  const mutation = trpc.admin.updateSettings.useMutation({
    onSuccess: () => {
      void settings.refetch();
      setSecret("");
      toast.success("Payment settings saved");
    },
    onError: error => toast.error(error.message),
  });

  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState("");
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [secret, setSecret] = useState("");
  const [razorpayEnabled, setRazorpayEnabled] = useState(true);
  const [manualQrEnabled, setManualQrEnabled] = useState(true);

  const current = settings.data;
  const loading = settings.isLoading;

  // Seed the form once the row arrives. `secret` is intentionally excluded —
  // the server never returns it.
  useEffect(() => {
    if (!current) return;
    setUpiId(current.upiId ?? "");
    setPayeeName(current.payeeName ?? "");
    setQrCodeImageUrl(current.qrCodeImageUrl ?? "");
    setRazorpayKeyId(current.razorpayKeyId ?? "");
    setRazorpayEnabled(current.isRazorpayEnabled ?? true);
    setManualQrEnabled(current.isManualQrEnabled ?? true);
  }, [current]);

  const secretReady = Boolean(current?.razorpayKeySecretSet) || secret.trim().length > 0;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!razorpayEnabled && !manualQrEnabled) {
      toast.error("Keep at least one payment method enabled, or buyers cannot check out");
      return;
    }
    if (razorpayEnabled && !razorpayKeyId.trim()) {
      toast.error("Razorpay is enabled but has no key id");
      return;
    }
    if (manualQrEnabled && !qrCodeImageUrl) {
      toast.error("Manual QR is enabled but no QR image is set — buyers would see an empty panel");
      return;
    }
    mutation.mutate({
      upiId: upiId.trim(),
      payeeName: payeeName.trim(),
      qrCodeImageUrl,
      isRazorpayEnabled: razorpayEnabled,
      isManualQrEnabled: manualQrEnabled,
      razorpayKeyId: razorpayKeyId.trim(),
      razorpayKeySecret: secret.trim(),
    });
  }

  const field = "w-full rounded-xl border border-transparent bg-[#eef6f9] px-4 py-3 text-sm outline-none transition placeholder:text-[#9fb0bb] neu-admin-well focus:neu-admin-well-focus";

  return (
    <form onSubmit={submit} className="mt-9 max-w-3xl space-y-6">
      <header className="neu-admin-card p-6">
        <div className="flex items-center gap-3">
          <span className="neu-admin-icon"><Settings2 size={18} /></span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#5c7f8c]">Checkout configuration</p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-.04em] text-[#172039]">Payment settings</h2>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#4a6b78]">
          These two switches decide what a buyer sees at checkout. Credentials are stored server-side and are
          never sent back to this page — leave the secret field blank to keep the saved one.
        </p>
      </header>

      {loading ? (
        <p className="flex items-center gap-2 px-1 text-sm text-[#5c7f8c]"><Loader2 size={16} className="animate-spin" /> Loading current settings…</p>
      ) : null}

      <section className="neu-admin-card space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-[#172039]">
            UPI ID
            <input
              value={upiId}
              onChange={e => setUpiId(e.target.value)}
              placeholder="yourname@bank"
              className={`${field} mt-2`}
            />
            <span className="mt-2 block text-xs font-normal text-[#5c7f8c]">Shown next to the QR as a fallback.</span>
          </label>
          <label className="block text-sm font-semibold text-[#172039]">
            Payee name
            <input
              value={payeeName}
              onChange={e => setPayeeName(e.target.value)}
              placeholder="Nitin Sharma"
              className={`${field} mt-2`}
            />
            <span className="mt-2 block text-xs font-normal text-[#5c7f8c]">Buyers match this against their app.</span>
          </label>
        </div>
      </section>

      <section className="neu-admin-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="neu-admin-icon neu-admin-icon-accent"><ShieldCheck size={18} /></span>
            <div>
              <p className="font-semibold text-[#172039]">Razorpay</p>
              <p className="mt-0.5 text-xs text-[#5c7f8c]">Cards, netbanking and UPI. Payment is verified server-side before the download unlocks.</p>
            </div>
          </div>
          <Toggle checked={razorpayEnabled} onChange={setRazorpayEnabled} label="Enable Razorpay at checkout" />
        </div>

        {razorpayEnabled ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[#172039]">
              Key ID
              <input
                value={razorpayKeyId}
                onChange={e => setRazorpayKeyId(e.target.value)}
                placeholder="rzp_live_xxxxxxxx"
                autoComplete="off"
                className={`${field} mt-2 font-mono text-xs`}
              />
            </label>
            <label className="block text-sm font-semibold text-[#172039]">
              Key secret
              <input
                type="password"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder={current?.razorpayKeySecretSet ? "Saved — type to replace" : "rzp_secret_xxxxxxxx"}
                autoComplete="new-password"
                className={`${field} mt-2 font-mono text-xs`}
              />
              <span className="mt-2 flex items-center gap-1.5 text-xs font-normal text-[#5c7f8c]">
                {current?.razorpayKeySecretSet ? (
                  <><ShieldCheck size={12} className="text-[#0f9c95]" /> A secret is already stored. Leave blank to keep it.</>
                ) : (
                  <><AlertTriangle size={12} className="text-[#b06a12]" /> No secret stored yet.</>
                )}
              </span>
            </label>
          </div>
        ) : null}
      </section>

      <section className="neu-admin-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="neu-admin-icon"><QrCode size={18} /></span>
            <div>
              <p className="font-semibold text-[#172039]">Manual QR</p>
              <p className="mt-0.5 text-xs text-[#5c7f8c]">Buyer scans your QR, uploads the screenshot plus a UTR, and you approve the order in the console.</p>
            </div>
          </div>
          <Toggle checked={manualQrEnabled} onChange={setManualQrEnabled} label="Enable manual QR at checkout" />
        </div>

        {manualQrEnabled ? (
          <div className="mt-6">
            <ImageField
              label="Checkout QR image"
              value={qrCodeImageUrl}
              onChange={setQrCodeImageUrl}
              hint="Paste a hosted QR image URL, or browse a local file — it is stored inline as base64 and rendered in the buyer's payment panel."
            />
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={mutation.isPending || loading}
          className="neu-admin-btn-dark inline-flex items-center rounded-full px-6 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
          Save payment settings
        </button>
        <p className="text-xs text-[#5c7f8c]">
          {razorpayEnabled && manualQrEnabled
            ? "Buyers can choose between both methods at checkout."
            : razorpayEnabled
              ? "Only Razorpay will appear at checkout."
              : manualQrEnabled
                ? "Only manual QR will appear at checkout."
                : "Both methods are off — checkout is unavailable to buyers."}
        </p>
      </div>
    </form>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`neu-admin-switch ${checked ? "neu-admin-switch-on" : ""}`}
    >
      <span className="neu-admin-switch-thumb" />
      <span className="sr-only">{label}</span>
    </button>
  );
}