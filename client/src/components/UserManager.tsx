import { Ban, Check, Loader2, Pencil, Plus, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type AdminUser = {
  id: number;
  name: string | null;
  email: string | null;
  username: string | null;
  role: "user" | "admin";
  isDisabled: boolean;
  loginMethod: string | null;
  createdAt: Date;
};

type Draft = { name: string; email: string; username: string; role: "user" | "admin"; password: string };
const empty: Draft = { name: "", email: "", username: "", role: "user", password: "" };

function initials(user: AdminUser) {
  const source = user.name?.trim() || user.email || "?";
  return source.split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join("");
}

/**
 * User management: provision, edit, disable and delete accounts.
 *
 * Manually created rows are adopted by Google sign-in on first login with the
 * same email (the upsert matches on email), so a hand-added user can still
 * walk in through the front door. Accounts with orders cannot be deleted —
 * disable them instead, so purchase history never orphans.
 */
export default function UserManager({ operatorId }: { operatorId?: number }) {
  const users = trpc.admin.users.useQuery();
  const [draft, setDraft] = useState<Draft>(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const create = trpc.admin.createUser.useMutation({
    onSuccess: () => { void users.refetch(); reset(); toast.success("Account created"); },
    onError: error => toast.error(error.message),
  });
  const update = trpc.admin.updateUser.useMutation({
    onSuccess: () => { void users.refetch(); reset(); toast.success("Account updated"); },
    onError: error => toast.error(error.message),
  });
  const remove = trpc.admin.deleteUser.useMutation({
    onSuccess: () => { void users.refetch(); toast.success("Account deleted"); },
    onError: error => toast.error(error.message),
  });
  const toggle = trpc.admin.toggleUser.useMutation({
    onSuccess: (_data, variables) => {
      void users.refetch();
      toast.success(variables.isDisabled ? "Account disabled" : "Account re-enabled");
    },
    onError: error => toast.error(error.message),
  });

  const set = (key: keyof Draft, value: string) => setDraft(current => ({ ...current, [key]: value }));
  function reset() { setDraft(empty); setEditingId(null); setOpen(false); }
  function startNew() { setDraft(empty); setEditingId(null); setOpen(true); }
  function edit(user: AdminUser) {
    setDraft({ name: user.name ?? "", email: user.email ?? "", username: user.username ?? "", role: user.role, password: "" });
    setEditingId(user.id);
    setOpen(true);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (editingId) {
      update.mutate({
        id: editingId,
        name: draft.name.trim(),
        email: draft.email.trim(),
        username: draft.username.trim() || null,
        role: draft.role,
      });
    } else {
      create.mutate({
        name: draft.name.trim(),
        email: draft.email.trim(),
        username: draft.username.trim() || undefined,
        role: draft.role,
        password: draft.password ? draft.password : undefined,
      });
    }
  }

  const pending = create.isPending || update.isPending;

  return (
    <section className="mt-9 rounded-2xl border border-[#d7e8eb] bg-[#f8ffff] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#71809f]">Accounts</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">User management</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#53617d]">
            Provision accounts, change roles, or disable someone without touching their order history. Accounts with orders can be disabled but not deleted.
          </p>
        </div>
        <button onClick={startNew} className="btn inline-flex items-center rounded-full bg-[#172039] px-4 py-2.5 text-sm font-semibold text-white">
          <Plus size={16} className="mr-2" /> Add user
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-6 grid gap-3 rounded-2xl bg-[#e9f7f6] p-5 md:grid-cols-2">
          <input required placeholder="Full name" value={draft.name} onChange={event => set("name", event.target.value)} className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none focus:border-[#13b8b0]" />
          <input required type="email" placeholder="Email address" value={draft.email} onChange={event => set("email", event.target.value)} className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none focus:border-[#13b8b0]" />
          <input placeholder="Username (optional)" value={draft.username} onChange={event => set("username", event.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))} className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none focus:border-[#13b8b0]" />
          <select value={draft.role} onChange={event => set("role", event.target.value)} className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none focus:border-[#13b8b0]">
            <option value="user">Role — Member</option>
            <option value="admin">Role — Admin</option>
          </select>
          {!editingId && (
            <input
              type="password"
              minLength={8}
              placeholder="Password (optional, min 8 chars)"
              value={draft.password}
              onChange={event => set("password", event.target.value)}
              className="rounded-xl border border-[#d7e8eb] bg-[#f8ffff] px-4 py-3 text-sm outline-none focus:border-[#13b8b0] md:col-span-2"
            />
          )}
          <div className="flex items-center gap-3 md:col-span-2">
            <button type="submit" disabled={pending} className="btn inline-flex items-center rounded-full bg-[#172039] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-55">
              {pending ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Check size={15} className="mr-2" />}
              {editingId ? "Save changes" : "Create account"}
            </button>
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-full border border-[#d7e8eb] bg-[#f8ffff] px-4 py-2.5 text-sm font-semibold text-[#53617d]">
              <X size={15} /> Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-7 space-y-3">
        {users.isLoading ? (
          <p className="py-8 text-center text-sm text-[#53617d]">Loading accounts…</p>
        ) : users.data?.length ? (
          users.data.map(user => {
            const isSelf = operatorId !== undefined && user.id === operatorId;
            return (
              <div key={user.id} className="flex flex-col gap-3 rounded-2xl border border-[#d7e8eb] p-4 md:flex-row md:items-center">
                <div className={`flex min-w-0 flex-1 items-center gap-3 ${user.isDisabled ? "opacity-60" : ""}`}>
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${user.role === "admin" ? "bg-[#172039] text-white" : "bg-[#e9f7f6] text-[#13b8b0]"}`}>
                    {initials(user)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="flex items-center gap-2 truncate font-display text-lg font-semibold">
                      {user.name || user.email || `User #${user.id}`}
                      {user.role === "admin" && <ShieldCheck size={15} className="shrink-0 text-[#13b8b0]" />}
                      {user.isDisabled && <span className="rounded-full bg-[#ffe0d7] px-2 py-0.5 font-mono text-[10px] uppercase text-[#a33e23]">disabled</span>}
                      {isSelf && <span className="rounded-full bg-[#c7f76d] px-2 py-0.5 font-mono text-[10px] uppercase text-[#172039]">you</span>}
                    </h3>
                    <p className="mt-0.5 truncate text-sm text-[#53617d]">
                      {user.email}
                      {user.username ? <span className="text-[#71809f]"> · @{user.username}</span> : null}
                      <span className="text-[#a1a19b]"> · {user.loginMethod || "unknown"}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => edit(user)} aria-label={`Edit ${user.name || user.email}`} className="inline-flex items-center rounded-full border border-[#d7e8eb] px-3 py-2 text-sm font-semibold hover:bg-[#e9f7f6]">
                    <Pencil size={15} className="mr-1.5" /> Edit
                  </button>
                  {!isSelf && (
                    <button
                      onClick={() => toggle.mutate({ id: user.id, isDisabled: !user.isDisabled })}
                      aria-label={`${user.isDisabled ? "Enable" : "Disable"} ${user.name || user.email}`}
                      className="inline-flex items-center rounded-full border border-[#d7e8eb] px-3 py-2 text-sm font-semibold hover:bg-[#e9f7f6]"
                    >
                      <Ban size={15} className="mr-1.5" /> {user.isDisabled ? "Enable" : "Disable"}
                    </button>
                  )}
                  {!isSelf && (
                    <button
                      onClick={() => {
                        if (!window.confirm(`Delete "${user.name || user.email}"? This cannot be undone.`)) return;
                        remove.mutate({ id: user.id });
                      }}
                      className="inline-flex items-center rounded-full bg-[#ffe0d7] px-3 py-2 text-sm font-semibold text-[#a33e23]"
                      aria-label={`Delete ${user.name || user.email}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[#b9d6db] p-12 text-center text-[#53617d]">
            <UserRound className="mx-auto mb-3 text-[#a1a19b]" size={26} />
            No accounts yet.
          </div>
        )}
      </div>
    </section>
  );
}
