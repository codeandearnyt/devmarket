import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { updateProfile } from "firebase/auth";
import { ArrowLeft } from "lucide-react";
import DevMarketIcon from "@/assets/dev-market-icon.png";
import HeaderAvatar from "@/components/HeaderAvatar";

export default function ProfilePage() {
  const { user, firebaseUser, logout } = useAuth();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.name || firebaseUser?.displayName || "",
    firstName: "",
    lastName: "",
    username: user?.openId?.replace("firebase_", "") || "",
    avatarUrl: user?.photoUrl || firebaseUser?.photoURL || "/assets/dev-market-icon.png",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Derive first/last from displayName if not separated
  useEffect(() => {
    if (!editing) {
      const parts = (form.displayName || "").split(" ");
      setForm(prev => ({
        ...prev,
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
      }));
    }
  }, [editing, form.displayName]);

  const handleSave = useCallback(async () => {
    setStatus("saving");
    setError(null);
    try {
      if (firebaseUser && form.displayName.trim()) {
        await updateProfile(firebaseUser, { displayName: form.displayName.trim() });
      }
      setStatus("idle");
      setEditing(false);
      navigate("/");
    } catch (e) {
      setError("Failed to save profile. Please try again.");
      setStatus("error");
    }
  }, [firebaseUser, form.displayName, navigate]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    try {
      await logout();
      navigate("/");
    } catch (e) {
      setError("Failed to delete account.");
    }
  }, [logout, navigate]);

  if (!user && !firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eef8fa]">
        <p className="text-[#53617d]">You must be signed in to view the profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef8fa]">
      <header className="site-header">
        <div className="site-nav-pill mx-auto flex max-w-[1080px] items-center justify-between px-4 py-3 lg:px-5">
          <Link href="/" className="flex items-center gap-3">
            <img src={DevMarketIcon} alt="DevMarket" className="h-9 w-9 rounded-lg object-contain" />
            <span className="font-display text-xl font-bold tracking-[-.05em]">dev<span className="text-[#13b8b0]">market</span></span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#53617d] transition hover:text-[#13b8b0]">
            <ArrowLeft size={15} /> Back to marketplace
          </Link>
          <HeaderAvatar />
        </div>
      </header>
      <main className="p-6 lg:p-12">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-[-.05em] text-[#172039]">
            {editing ? "Edit profile" : "My profile"}
          </h1>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </header>

      {editing ? (
        <form className="space-y-6 max-w-xl" onSubmit={e => { e.preventDefault(); handleSave(); }}>
          <div>
            <label className="block text-sm font-medium text-[#53617d] mb-1">Display name</label>
            <input
              type="text"
              value={form.displayName}
              onChange={e => setForm(prev => ({ ...prev, displayName: e.target.value }))}
              className="w-full rounded-xl border border-[#d7e8eb] bg-[#eef8fa] py-3 px-4 text-sm outline-none transition focus:border-[#13b8b0] focus:ring-4 focus:ring-[#13b8b0]/10"
              maxLength={64}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#53617d] mb-1">First name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => setForm(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full rounded-xl border border-[#d7e8eb] bg-[#eef8fa] py-3 px-4 text-sm outline-none transition focus:border-[#13b8b0] focus:ring-4 focus:ring-[#13b8b0]/10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#53617d] mb-1">Last name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => setForm(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full rounded-xl border border-[#d7e8eb] bg-[#eef8fa] py-3 px-4 text-sm outline-none transition focus:border-[#13b8b0] focus:ring-4 focus:ring-[#13b8b0]/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#53617d] mb-1">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))}
              className="w-full rounded-xl border border-[#d7e8eb] bg-[#eef8fa] py-3 px-4 text-sm outline-none transition focus:border-[#13b8b0] focus:ring-4 focus:ring-[#13b8b0]/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#53617d] mb-1">Avatar image URL</label>
            <input
              type="url"
              value={form.avatarUrl}
              onChange={e => setForm(prev => ({ ...prev, avatarUrl: e.target.value }))}
              className="w-full rounded-xl border border-[#d7e8eb] bg-[#eef8fa] py-3 px-4 text-sm outline-none transition focus:border-[#13b8b0] focus:ring-4 focus:ring-[#13b8b0]/10"
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="text-xs text-[#71809f] mt-1">Recommended: 256x256 px. Supported: PNG, JPG, WebP.</p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl border border-[#d7e8eb] px-4 py-2 text-sm font-medium text-[#53617d] hover:bg-[#f8ffff] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "saving"}
              className="rounded-xl bg-[#13b8b0] px-4 py-2 text-sm font-medium text-white hover:bg-[#0d9488] transition disabled:opacity-50"
            >
              {status === "saving" ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6 max-w-xl">
          <div className="flex items-center gap-4">
            <img
              src={user?.photoUrl || firebaseUser?.photoURL || "/assets/dev-market-icon.png"}
              alt={user?.name || firebaseUser?.displayName || "User"}
              className="w-20 h-20 rounded-full object-cover border-2 border-[#c7f76d]"
            />
            <div>
              <p className="font-display text-xl font-semibold text-[#172039]">
                {user?.name || firebaseUser?.displayName || "User"}
              </p>
              <p className="text-sm text-[#71809f]">
                {user?.email || firebaseUser?.email || ""}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setEditing(true)}
              className="rounded-xl bg-[#13b8b0] px-4 py-2 text-sm font-medium text-white hover:bg-[#0d9488] transition"
            >
              Edit profile
            </button>
            <button
              onClick={logout}
              className="rounded-xl border border-[#d7e8eb] px-4 py-2 text-sm font-medium text-[#13b8b0] hover:bg-white transition"
            >
              Log out
            </button>
            <button
              onClick={handleDelete}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition"
            >
              Delete account
            </button>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}