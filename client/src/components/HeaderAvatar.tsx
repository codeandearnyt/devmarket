/** HeaderAvatar - Circular avatar with name and logout, shown in top navigation */
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuth } from "@/_core/hooks/useAuth";
import { Image } from "next/image";

export default function HeaderAvatar() {
  const { user, firebaseUser, logout, isAuthenticated } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // Sync display name & photo from the first available source
  useEffect(() => {
    if (firebaseUser) {
      setName(firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User");
      setPhotoUrl(firebaseUser.photoURL || "");
    } else if (user) {
      setName(user.name || user.email?.split("@")[0] || "User");
      setPhotoUrl(user.photoUrl || "");
    }
  }, [firebaseUser, user]);

  return (
    <div className="relative flex items-center gap-2">
      {/* Avatar */}
      <div
        className="rounded-full bg-[#172039] border-2 border-[#c7f76d] data-[state=open]:outline-[4px] outline-offset-2"
        onClick={() => setShowLogoutModal(!showLogoutModal)}
        tabIndex={0}
        role="button"
        aria-label="User menu"
      >
        <Image
          src={photoUrl || "/assets/dev-market-icon.png"}
          alt={name}
          width={40}
          height={40}
          className="rounded-full object-cover"
          priority={false}
          fill
        />
        {/* Online indicator dot */}
        <div className="absolute right-1 top-1 rounded-full bg-[#13b8b0] border-2 border-[#172039]" />
      </div>

      {/* Name */}
      <span className="text-sm font-medium text-white break-word max-w-xs">
        {name}
      </span>

      {/* Logout menu */}
      <div
        className="absolute right-0 mt-2 w-32 bg-[#172039] rounded-lg border border-[#2a3046] p-4 shadow-lg z-50 hidden data-[state=open]:block"
        role="menu"
        aria-orientation="vertical"
        aria-label="User menu"
      >
        <button
          className="w-full text-left text-sm text-[#c7f76d] mb-2 hover:text-[#13b8b0] transition-colors"
          onClick={() => {
            setShowLogoutModal(false);
            logout();
          }}
        >
          Profile
        </button>
        <button
          className="w-full text-left text-sm text-[#c7f76d] mb-2 hover:text-[#13b8b0] transition-colors"
          onClick={() => {
            setShowLogoutModal(false);
            logout();
          }}
        >
          Log out
        </button>
      </div>

      {/* Logout modal overlay */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-zinc-900 z-40 flex items-center justify-center"
          onClick={(e) => e.target.click()} // close on outside click
        >
          <div
            className="bg-[#172039] rounded-xl p-8 max-w-md w-full border border-[#2a3046] shadow-2xl"
            role="dialog"
            aria-label="Confirm sign out"
          >
            <p className="text-sm text-[#53617d] mb-6">Are you sure you want to sign out?</p>
            <div className="flex justify-end gap-4">
              <button
                className="rounded-xl border px-4 py-2 text-sm font-medium transition"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-[#ef4444] px-4 py-2 text-sm font-medium text-white"
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}