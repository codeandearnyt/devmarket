import { useState, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useNavigate } from "wouter";
import Image from "next/image";
import { Loader2, CheckCircle, XCircle, Trash } from "lucide-react";

export default function ProfilePage() {
  const { user, firebaseUser, logout, session } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.name || firebaseUser?.displayName || "",
    firstName: "",
    lastName: "",
    username: user?.openId?.replace("firebase_", "") || "",
    avatarUrl: user?.photoUrl || firebaseUser?.photoURL || "/assets/dev-market-icon.png",
    resetPassword: "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "deleted" | "error">("idle");
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
  }, [editing]);

  const handleSave = useCallback(async () => {
    setStatus("saving");
    setError(null);
    try {
      // Update Firebase auth display name
      if (firebaseUser && form.displayName.trim()) {
        const { updateProfile } = await import("firebase/auth");
        await updateProfile(firebaseUser, { displayName: form.displayName.trim() });
      }
      // TODO: call Supabase backend to update profile
      // For now, just update local state and navigate
      setStatus("idle");
      setEditing(false);
      navigate("/");
    } catch (e) {
      setError("Failed to save profile. Please try again.");
      setStatus("error");
    }
  };

  const handleDelete = useCallback(async () => {
    if (!window.confirm("Are you sure you want to delete your account?")) return;
    setStatus("deleted");
    try {
      logout();
      navigate("/");
      setStatus("idle");
    } catch (e) {
      setError("Failed to delete account.");
      setStatus("error");
    }
  };

  if (!user && !firebaseUser) {
    return <p className="min-h-screen flex items-center justify-center text-[#53617d]">You must be signed in to view the profile.</p>;
  }

  return (
    <div className="min-h-screen bg-[#eef8fa] p-6 lg:p-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-[-.05em] text-[#172039]">
          {editing ? "Edit profile" : "My profile"}
        </h1>
      </header>

      {editing ? (
        <form className="space-y-6 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-[#53617d] mb-1">
              Display name
            </label>
            <input
              type="text"
              value={form.displayName}
              onChange={e => setForm(prev => ({ ...prev, displayName: e.target.value }))}
              className="w-full rounded-xl border border-[#d7e8eb] bg-[#eef8fa] py-3 pl-4 pr-10 text-sm outline-none transition focus:border-[#13b8b0] focus:ring-4 focus:ring-[#13b8b0]/10"
              maxLength={64}
              aria-label="Display name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#53617d] mb-1">
                First name
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => setForm(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full rounded-xl border border-[#d7e8eb] bg-[#eef8fa] py-3 pl-4 pr-10 text-sm outline-none transition focus:border-[#13b8b0] focus:ring-4 focus:ring-[#13b8b0]/10"
                aria-label="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#53617d] mb-1">
                Last name
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => setForm(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full rounded-xl border border-[#d7e8eb] bg-[#eef8fa] py-3 pl-4 pr-10 text-sm outline-none transition focus:border-[#13b8b0] focus:ring-4 focus:ring-[#13b8b0]/10"
                aria-label="Last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#53617d] mb-1">
              Username
            </label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))}
              className="w-full rounded-xl border border-[#d7e8eb] bg-[#eef8fa] py-3 pl-4 pr-10 text-sm outline-none transition focus:border-[#13b8b0] focus:ring-4 focus:ring-[#13b8b0]/10"
              aria-label="Username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#53617d] mb-1">
              Avatar image URL
            </label>
            <input
              type="url"
              value={form.avatarUrl}
              onChange={e => setForm(prev => ({ ...prev, avatarUrl: e.target.value }))}
              className="w-full rounded-xl border border-[#d7e8eb] bg-[#eef8fa] py-3 pl-4 pr-10 text-sm outline-none transition focus:border-[#13b8b0] focus:ring-4 focus:ring-[#13b8b0]/10"
              placeholder="https://example.com/avatar.jpg"
              aria-label="Avatar image URL"
            />
            <p className="text-xs text-[#71809f] mt-1">Recommended: 256x256 px. Supported: PNG, JPG, WebP.</p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl border px-4 py-2 text-sm font-medium text-[#53617d] hover:bg-[#f8ffff] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSave}
              disabled={status !== "idle"}
              className="rounded-xl bg-[#13b8b0] px-4 py-2 text-sm font-medium text-white hover:bg-[#0d9488] transition"
              disabled={status !== "idle"}
            >
              {status === "saving" ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
        // View mode
        <div className="space-y-6 max-w-xl">
          <div className="flex items-center gap-4">
            <Image
              src={user?.photoUrl || firebaseUser?.photoURL || "/assets/dev-market-icon.png"}
              alt={user?.name || firebaseUser?.displayName || "User"}
              width={80}
              height={80}
              className="rounded-full object-cover border-2 border-[#c7f76d]"
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

          {/* Action buttons bar */}
          <div className="flex gap-3">
            <button
              onClick={() => setEditing(true)}
              className="rounded-xl bg-[#13b8b0] px-4 py-2 text-sm font-medium text-white hover:bg-[#0d9488] transition"
            >
              Edit profile
            </button>
            <button
              onClick={() => setEditing(true)}
              className="rounded-xl border px-4 py-2 text-sm font-medium text-[#13b8b0] hover:bg-white transition"
            >
              Delete account
            </button>
            <button
              onClick={logout}
              className="rounded-xl border px-4 py-2 text-sm font-medium text-[#13b8b0] hover:bg-white transition"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}