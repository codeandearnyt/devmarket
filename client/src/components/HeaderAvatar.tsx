import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Header avatar — circular profile image with the display name to its left.
 *
 * The menu is purely click-driven: it opens on toggle and closes on an outside
 * click, on Escape, and whenever the route changes, so it can never get stuck
 * open behind a navigation.
 */
export default function HeaderAvatar() {
  const { user, firebaseUser, logout, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [location] = useLocation();

  const name = firebaseUser?.displayName || user?.name || firebaseUser?.email?.split("@")[0] || user?.email?.split("@")[0] || "User";
  const photoUrl = firebaseUser?.photoURL || user?.photoUrl || "/assets/dev-market-icon.png";
  const role = user?.role;

  const close = useCallback(() => setOpen(false), []);

  // Dismiss on any click outside the avatar and its menu.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  // Dismiss on Escape, returning focus to the trigger for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Close when the route changes, so a client-side navigation cannot leave it open.
  useEffect(() => {
    setOpen(false);
  }, [location]);

  if (!isAuthenticated) return null;

  return (
    <div ref={containerRef} className="relative flex items-center gap-2.5">
      <span className="text-sm font-medium text-[#172039] max-w-[100px] truncate">{name}</span>

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name}`}
        className="flex items-center gap-1 rounded-full border-2 border-[#c7f76d] transition hover:border-[#13b8b0] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#13b8b0]/20"
      >
        <img src={photoUrl} alt={name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
        <ChevronDown
          size={14}
          className={`mr-1.5 text-[#71809f] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-12 w-56 overflow-hidden rounded-xl border border-[#d7e8eb] bg-white p-1.5 shadow-lg z-50"
        >
          <div className="border-b border-[#e9f7f6] px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-[#172039]">{name}</p>
            <p className="truncate text-xs text-[#71809f]">{user?.email || firebaseUser?.email || ""}</p>
            {role && (
              <span className="mt-1.5 inline-block rounded-full bg-[#c7f76d] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#172039]">
                {role}
              </span>
            )}
          </div>

          <Link
            href="/profile"
            role="menuitem"
            onClick={close}
            className="mt-1.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#172039] transition-colors hover:bg-[#eef8fa]"
          >
            <User size={15} className="text-[#13b8b0]" /> Profile
          </Link>

          <Link
            href="/dashboard"
            role="menuitem"
            onClick={close}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#172039] transition-colors hover:bg-[#eef8fa]"
          >
            <LayoutDashboard size={15} className="text-[#13b8b0]" /> My library
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              close();
              void logout();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#a33e23] transition-colors hover:bg-[#ffe0d7]"
          >
            <LogOut size={15} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}