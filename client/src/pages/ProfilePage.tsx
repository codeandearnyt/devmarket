import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  AtSign,
  Camera,
  Check,
  Globe,
  Github,
  KeyRound,
  Link2,
  Linkedin,
  Loader2,
  MapPin,
  Pencil,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { deleteUser, sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { toast } from "sonner";

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getFirebaseAuth } from "@/lib/firebase";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

type Draft = {
  firstName: string;
  lastName: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
  photoUrl: string;
};

const emptyDraft: Draft = {
  firstName: "",
  lastName: "",
  username: "",
  bio: "",
  location: "",
  website: "",
  github: "",
  linkedin: "",
  photoUrl: "",
};

const BIO_LIMIT = 500;

function toDraft(user: ReturnType<typeof useAuth>["user"], photoFallback: string): Draft {
  return {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    username: user?.username ?? "",
    bio: user?.bio ?? "",
    location: user?.location ?? "",
    website: user?.website ?? "",
    github: user?.github ?? "",
    linkedin: user?.linkedin ?? "",
    photoUrl: user?.photoUrl ?? photoFallback ?? "/assets/dev-market-icon.png",
  };
}

function initials(first: string, last: string, fallback: string) {
  const text = `${first} ${last}`.trim() || fallback;
  return text
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Render a link field, hiding it entirely when the user left it blank. */
function LinkRow({ label, icon, value }: { label: string; icon: React.ReactNode; value: string }) {
  if (!value) return null;
  const full = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return (
    <a
      href={full}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-2 rounded-full border border-[#d7e8eb] bg-white/70 px-3.5 py-2 text-xs font-semibold text-[#53617d] transition hover:border-[#13b8b0] hover:text-[#13b8b0]"
    >
      {icon}
      <span className="max-w-[180px] truncate">{value}</span>
      <span className="sr-only">{label}</span>
    </a>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[.12em] text-[#53617d]">{label}</span>
        {hint}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-[#d7e8eb] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#a1a19b] focus:border-[#13b8b0] focus:ring-4 focus:ring-[#13b8b0]/10";

export default function ProfilePage() {
  const { user, firebaseUser, logout, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [usernameState, setUsernameState] = useState<"idle" | "checking" | "free" | "taken">("idle");
  const [resetting, setResetting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateProfileMutation = trpc.auth.updateProfile.useMutation();
  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation();
  const statsQuery = trpc.auth.stats.useQuery(undefined, { enabled: isAuthenticated });
  const usernameQuery = trpc.auth.usernameAvailable.useQuery(
    { username: draft.username.trim().toLowerCase() },
    { enabled: editing && draft.username.trim().length >= 3 && usernameState !== "taken" }
  );

  const firebasePhoto = firebaseUser?.photoURL || "";
  const displayPhoto = editing ? draft.photoUrl || "/assets/dev-market-icon.png" : user?.photoUrl || firebasePhoto || "/assets/dev-market-icon.png";

  const displayName = useMemo(() => {
    const combined = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
    return combined || user?.name || firebaseUser?.displayName || user?.email?.split("@")[0] || "Builder";
  }, [user, firebaseUser]);

  const handleRef = useMemo(() => user?.username || firebaseUser?.email?.split("@")[0] || "builder", [user, firebaseUser]);

  // Seed the draft once the session resolves, and whenever we enter edit mode.
  useEffect(() => {
    if (!user) return;
    setDraft(toDraft(user, firebasePhoto));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, editing]);

  // Reflect the server's username verdict, but never override a local "taken".
  useEffect(() => {
    if (!editing) return;
    const username = draft.username.trim();
    if (username.length < 3) {
      setUsernameState("idle");
      return;
    }
    if (usernameQuery.data?.available === false) setUsernameState("taken");
    else if (usernameQuery.data?.available === true) setUsernameState("free");
  }, [usernameQuery.data, draft.username, editing]);

  // Debounced check so typing a username does not fire a request per keystroke.
  useEffect(() => {
    if (!editing) return;
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    usernameTimer.current = setTimeout(() => {
      const username = draft.username.trim();
      if (username.length >= 3) setUsernameState("checking");
    }, 350);
    return () => {
      if (usernameTimer.current) clearTimeout(usernameTimer.current);
    };
  }, [draft.username, editing]);

  // Declared before the early return below: every hook must run on every
  // render, otherwise resolving the session changes the hook count and React
  // throws "Rendered more hooks than during the previous render".
  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(toDraft(user, firebasePhoto)), [draft, user, firebasePhoto]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#eef8fa] text-[#172039]">
        <SiteHeader />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-5 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d9f8f6] text-[#13b8b0]">
            <UserIcon size={30} />
          </span>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-[-.06em]">Sign in to view your profile</h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#53617d]">
              Your profile holds your public details, purchase history and account settings.
            </p>
          </div>
          <Link href="/login" className="btn inline-flex items-center rounded-full bg-[#172039] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#13b8b0]">
            Sign in to continue
          </Link>
        </div>
      </div>
    );
  }

  const set = <K extends keyof Draft>(key: K, value: string) => setDraft(prev => ({ ...prev, [key]: value }));

  function startEditing() {
    setDraft(toDraft(user, firebasePhoto));
    setAvatarError(null);
    setUsernameState("idle");
    setEditing(true);
  }

  function discard() {
    setDraft(toDraft(user, firebasePhoto));
    setAvatarError(null);
    setUsernameState("idle");
    setEditing(false);
  }

  async function save() {
    const username = draft.username.trim().toLowerCase();
    if (username && usernameState === "taken") {
      toast.error("That username is already taken");
      return;
    }
    if (draft.bio.length > BIO_LIMIT) {
      toast.error(`Bio must be ${BIO_LIMIT} characters or fewer`);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfileMutation.mutateAsync({
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        username: username,
        bio: draft.bio.trim(),
        location: draft.location.trim(),
        website: draft.website.trim(),
        github: draft.github.trim(),
        linkedin: draft.linkedin.trim(),
        photoUrl: draft.photoUrl.trim(),
      });

      // Keep the shared session cache in step so the header avatar updates immediately.
      utils.auth.me.setData(undefined, updated);

      // Mirror the display name into Firebase so future ID tokens agree with the profile.
      if (firebaseUser && updated?.name && firebaseUser.displayName !== updated.name) {
        try {
          await updateProfile(firebaseUser, { displayName: updated.name });
        } catch {
          // A stale Firebase display name is cosmetic; the local row is authoritative.
        }
      }

      setEditing(false);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your profile");
    } finally {
      setSaving(false);
    }
  }

  async function sendReset() {
    const email = user?.email || firebaseUser?.email;
    if (!email) {
      toast.error("This account has no email address");
      return;
    }
    setResetting(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
      toast.success(`Password reset sent to ${email}`);
    } catch (error) {
      const code = (error as { code?: string })?.code ?? "";
      if (code === "auth/operation-not-allowed" || code === "auth/invalid-credential") {
        toast.error("You signed in with Google, so manage your password from your Google account settings.");
      } else if (code === "auth/too-many-requests") {
        toast.error("Too many requests. Please try again shortly.");
      } else {
        toast.error("Could not send the reset email. Please try again.");
      }
    } finally {
      setResetting(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      // Remove the Firebase identity first: it is the step that cannot be undone,
      // and failing it should leave the local account intact.
      if (firebaseUser) await deleteUser(firebaseUser);
      await deleteAccountMutation.mutateAsync();
      utils.auth.me.setData(undefined, null);
      toast.success("Your account has been deleted");
      window.location.href = "/";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete your account");
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#eef8fa] text-[#172039]">
      <SiteHeader />

      <main className="pb-24">
        {/* ---------------- Hero ---------------- */}
        <section className="relative overflow-hidden border-b border-[#d7e8eb] bg-white/40">
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(rgba(19,184,176,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(19,184,176,.35) 1px, transparent 1px)", backgroundSize: "46px 46px" }} />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#13b8b0] opacity-15 blur-3xl" />

          <div className="relative mx-auto max-w-[1080px] px-5 pb-10 pt-16 lg:px-8 lg:pb-14 lg:pt-24">
            <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="relative shrink-0">
                  <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-[#d9f8f6] shadow-[0_18px_40px_rgba(23,32,57,.16)] lg:h-32 lg:w-32">
                    {avatarError || (!displayPhoto && false) ? (
                      <div className="flex h-full w-full items-center justify-center bg-[#d9f8f6] text-2xl font-semibold text-[#13b8b0]">
                        {initials(draft.firstName || draft.lastName, "", displayName)}
                      </div>
                    ) : (
                      <img
                        src={displayPhoto}
                        alt={displayName}
                        className="h-full w-full object-cover"
                        onError={() => setAvatarError("bad-image")}
                      />
                    )}
                  </div>
                  {editing && (
                    <label className="absolute -bottom-1 -right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#172039] text-[#c7f76d] shadow-lg transition hover:bg-[#13b8b0]" title="Paste an image URL below">
                      <Camera size={16} />
                      <input
                        type="url"
                        value={draft.photoUrl}
                        onChange={event => {
                          setAvatarError(null);
                          set("photoUrl", event.target.value);
                        }}
                        placeholder="https://…"
                        aria-label="Avatar image URL"
                        className="sr-only"
                      />
                    </label>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="font-display text-3xl font-semibold tracking-[-.05em] sm:text-4xl">{displayName}</h1>
                    {user?.role === "admin" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#172039] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.14em] text-[#c7f76d]">
                        <ShieldCheck size={11} /> Admin
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[#53617d]">
                    <AtSign size={14} className="text-[#13b8b0]" />
                    <span className="truncate">{user?.username ? `${user.username}` : handleRef}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#71809f]">
                    {user?.email && <span className="truncate">{user.email}</span>}
                    {user?.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} className="text-[#13b8b0]" />
                        {user.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 gap-3">
                {editing ? (
                  <>
                    <button
                      type="button"
                      onClick={discard}
                      disabled={saving}
                      className="btn inline-flex items-center rounded-full border border-[#d7e8eb] bg-white/70 px-5 py-3 text-sm font-semibold text-[#53617d] transition hover:border-[#172039] disabled:opacity-60"
                    >
                      <RotateCcw size={15} className="mr-2" /> Discard
                    </button>
                    <button
                      type="button"
                      onClick={save}
                      disabled={saving || !isDirty || usernameState === "taken"}
                      className="btn inline-flex items-center rounded-full bg-[#13b8b0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d9488] disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Save size={15} className="mr-2" />}
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="btn inline-flex items-center rounded-full bg-[#172039] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#13b8b0]"
                  >
                    <Pencil size={15} className="mr-2" /> Edit profile
                  </button>
                )}
              </div>
            </div>

            {/* Stats strip */}
            <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Purchases", value: statsQuery.data?.orders ?? "—" },
                { label: "Member since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—" },
                { label: "Sign-in method", value: user?.loginMethod ?? firebaseUser?.providerId ?? "—" },
                { label: "Role", value: user?.role ?? "user" },
              ].map(stat => (
                <div key={stat.label} className="glass rounded-2xl px-5 py-4">
                  <dt className="font-mono text-[9px] uppercase tracking-[.16em] text-[#71809f]">{stat.label}</dt>
                  <dd className="mt-2 font-display text-xl font-semibold capitalize tracking-[-.03em]">{String(stat.value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <div className="mx-auto grid max-w-[1080px] gap-6 px-5 pt-10 lg:grid-cols-[1.35fr_.65fr] lg:px-8">
          {/* ---------------- Main column ---------------- */}
          <div className="space-y-6">
            {/* About */}
            <section className="glass rounded-[1.75rem] p-6 lg:p-8">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-display text-xl font-semibold tracking-[-.04em]">About</h2>
                {!editing && !user?.bio && <span className="text-xs text-[#a1a19b]">Nothing here yet</span>}
              </div>

              {editing ? (
                <div className="mt-5">
                  <Field
                    label="Bio"
                    hint={
                      <span className={`font-mono text-[10px] ${draft.bio.length > BIO_LIMIT ? "text-[#a33e23]" : "text-[#71809f]"}`}>
                        {draft.bio.length}/{BIO_LIMIT}
                      </span>
                    }
                  >
                    <textarea
                      rows={5}
                      maxLength={BIO_LIMIT}
                      value={draft.bio}
                      onChange={event => set("bio", event.target.value)}
                      placeholder="Tell other builders what you work on and what you are looking for."
                      className={`${inputClass} resize-y leading-7`}
                    />
                  </Field>
                </div>
              ) : (
                user?.bio && <p className="mt-5 whitespace-pre-line text-sm leading-7 text-[#53617d]">{user.bio}</p>
              )}
            </section>

            {/* Identity */}
            <section className="glass rounded-[1.75rem] p-6 lg:p-8">
              <h2 className="font-display text-xl font-semibold tracking-[-.04em]">Identity</h2>

              {editing ? (
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="First name">
                    <input value={draft.firstName} maxLength={80} onChange={event => set("firstName", event.target.value)} placeholder="Nitin" className={inputClass} />
                  </Field>
                  <Field label="Last name">
                    <input value={draft.lastName} maxLength={80} onChange={event => set("lastName", event.target.value)} placeholder="Sharma" className={inputClass} />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field
                      label="Username"
                      hint={
                        usernameState === "checking" ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#71809f]">
                            <Loader2 size={11} className="animate-spin" /> checking
                          </span>
                        ) : usernameState === "free" ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#527f1e]">
                            <Check size={11} /> available
                          </span>
                        ) : usernameState === "taken" ? (
                          <span className="font-mono text-[10px] text-[#a33e23]">taken</span>
                        ) : null
                      }
                    >
                      <input
                        value={draft.username}
                        maxLength={40}
                        onChange={event => set("username", event.target.value.replace(/[^a-zA-Z0-9_.-]/g, ""))}
                        placeholder="nitin"
                        aria-invalid={usernameState === "taken"}
                        className={`${inputClass} ${usernameState === "taken" ? "border-[#a33e23]" : ""}`}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Avatar image URL" hint={<span className="font-mono text-[10px] text-[#71809f]">PNG or JPG, square works best</span>}>
                      <input value={draft.photoUrl} maxLength={1000} onChange={event => { setAvatarError(null); set("photoUrl", event.target.value); }} placeholder="https://example.com/me.jpg" className={inputClass} />
                    </Field>
                    {avatarError && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-[#a33e23]">
                        <AlertTriangle size={13} /> That image could not be loaded. Check the URL.
                      </p>
                    )}
                  </div>

                  <Field label="Email">
                    <input value={user?.email ?? firebaseUser?.email ?? ""} disabled className={`${inputClass} cursor-not-allowed opacity-60`} />
                  </Field>
                </div>
              ) : (
                <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  {[
                    { label: "First name", value: user?.firstName },
                    { label: "Last name", value: user?.lastName },
                    { label: "Username", value: user?.username ? `@${user.username}` : null },
                    { label: "Email", value: user?.email },
                  ].map(row => (
                    <div key={row.label}>
                      <dt className="font-mono text-[9px] uppercase tracking-[.16em] text-[#71809f]">{row.label}</dt>
                      <dd className="mt-1.5 truncate text-sm font-semibold">{row.value || <span className="font-normal text-[#a1a19b]">Not set</span>}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>

            {/* Links */}
            <section className="glass rounded-[1.75rem] p-6 lg:p-8">
              <h2 className="font-display text-xl font-semibold tracking-[-.04em]">Links</h2>

              {editing ? (
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="Location">
                    <input value={draft.location} maxLength={120} onChange={event => set("location", event.target.value)} placeholder="Kaithal, Haryana" className={inputClass} />
                  </Field>
                  <Field label="Website">
                    <input value={draft.website} maxLength={300} onChange={event => set("website", event.target.value)} placeholder="https://your-site.dev" className={inputClass} />
                  </Field>
                  <Field label="GitHub">
                    <input value={draft.github} maxLength={120} onChange={event => set("github", event.target.value)} placeholder="your-handle" className={inputClass} />
                  </Field>
                  <Field label="LinkedIn">
                    <input value={draft.linkedin} maxLength={160} onChange={event => set("linkedin", event.target.value)} placeholder="in/your-handle" className={inputClass} />
                  </Field>
                </div>
              ) : (
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {user?.website && <LinkRow label="Website" icon={<Globe size={14} />} value={user.website} />}
                  {user?.github && <LinkRow label="GitHub" icon={<Github size={14} />} value={user.github} />}
                  {user?.linkedin && <LinkRow label="LinkedIn" icon={<Linkedin size={14} />} value={user.linkedin} />}
                  {!user?.website && !user?.github && !user?.linkedin && <span className="text-sm text-[#a1a19b]">No links added yet.</span>}
                </div>
              )}
            </section>
          </div>

          {/* ---------------- Side column ---------------- */}
          <aside className="space-y-6">
            {/* Security */}
            <section className="glass rounded-[1.75rem] p-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d9f8f6] text-[#13b8b0]">
                  <KeyRound size={17} />
                </span>
                <h2 className="font-display text-lg font-semibold tracking-[-.03em]">Security</h2>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#53617d]">
                Your password is managed by Firebase. We will email a secure reset link to
                <span className="font-semibold text-[#172039]"> {user?.email || firebaseUser?.email}</span>.
              </p>
              <button
                type="button"
                onClick={sendReset}
                disabled={resetting}
                className="btn mt-5 inline-flex w-full items-center justify-center rounded-full border border-[#d7e8eb] bg-white px-5 py-3 text-sm font-semibold text-[#172039] transition hover:border-[#13b8b0] disabled:opacity-60"
              >
                {resetting ? <Loader2 size={15} className="mr-2 animate-spin" /> : <KeyRound size={15} className="mr-2" />}
                {resetting ? "Sending…" : "Reset password"}
              </button>
            </section>

            {/* Session */}
            <section className="glass rounded-[1.75rem] p-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d9f8f6] text-[#13b8b0]">
                  <Link2 size={17} />
                </span>
                <h2 className="font-display text-lg font-semibold tracking-[-.03em]">Session</h2>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#53617d]">Sign out of DevMarket on this device.</p>
              <button
                type="button"
                onClick={() => void logout()}
                className="btn mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#172039] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#13b8b0]"
              >
                Log out
              </button>
            </section>

            {/* Danger zone */}
            <section className="rounded-[1.75rem] border border-[#f0c8bd] bg-[#fff6f3] p-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffe0d7] text-[#a33e23]">
                  <Trash2 size={17} />
                </span>
                <h2 className="font-display text-lg font-semibold tracking-[-.03em] text-[#7d2b16]">Danger zone</h2>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#8a4a35]">
                Deleting your account removes your profile and purchase history. This cannot be undone.
              </p>

              {!showDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowDelete(true);
                    setDeleteText("");
                  }}
                  className="btn mt-5 inline-flex w-full items-center justify-center rounded-full border border-[#e0a692] bg-white px-5 py-3 text-sm font-semibold text-[#a33e23] transition hover:bg-[#ffe0d7]"
                >
                  <Trash2 size={15} className="mr-2" /> Delete account
                </button>
              ) : (
                <div className="mt-5">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-[#8a4a35]">
                      Type <span className="font-mono">DELETE</span> to confirm
                    </span>
                    <input
                      value={deleteText}
                      onChange={event => setDeleteText(event.target.value)}
                      placeholder="DELETE"
                      aria-label="Type DELETE to confirm"
                      className="w-full rounded-xl border border-[#f0c8bd] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#a33e23]"
                    />
                  </label>
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDelete(false);
                        setDeleteText("");
                      }}
                      className="btn flex-1 rounded-full border border-[#e0a692] bg-white px-4 py-2.5 text-sm font-semibold text-[#53617d] transition hover:bg-[#f8ffff]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmDelete}
                      disabled={deleteText.trim().toUpperCase() !== "DELETE" || deleting}
                      className="btn flex-1 inline-flex items-center justify-center rounded-full bg-[#a33e23] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8a3520] disabled:opacity-50"
                    >
                      {deleting && <Loader2 size={15} className="mr-2 animate-spin" />}
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}