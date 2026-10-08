/** HeaderAvatar - Circular avatar with name and logout, shown in top navigation */
import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function HeaderAvatar() {
  const { user, firebaseUser, logout, isAuthenticated } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    if (firebaseUser) {
      setName(firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User");
      setPhotoUrl(firebaseUser.photoURL || "");
    } else if (user) {
      setName(user.name || user.email?.split("@")[0] || "User");
      setPhotoUrl(user.photoUrl || "");
    }
  }, [firebaseUser, user]);

  if (!isAuthenticated) return null;

  return (
    <div className="relative flex items-center gap-2">
      <div
        className="rounded-full bg-[#172039] border-2 border-[#c7f76d] cursor-pointer"
        onClick={() => setShowLogoutModal(!showLogoutModal)}
        role="button"
        aria-label="User menu"
        tabIndex={0}
      >
        <img
          src={photoUrl || "/assets/dev-market-icon.png"}
          alt={name}
          width={40}
          height={40}
          className="rounded-full object-cover w-10 h-10"
        />
        <div className="absolute right-1 top-1 w-3 h-3 rounded-full bg-[#13b8b0] border-2 border-[#172039]" />
      </div>

      <span className="text-sm font-medium text-[#172039] max-w-[100px] truncate">
        {name}
      </span>

      {showLogoutModal && (
        <div className="absolute right-0 top-12 w-40 bg-white rounded-xl border border-[#d7e8eb] shadow-lg z-50 p-2">
          <a href="/profile" className="block w-full text-left text-sm text-[#172039] px-3 py-2 rounded-lg hover:bg-[#eef8fa] transition-colors">
            Profile
          </a>
          <button
            className="block w-full text-left text-sm text-[#172039] px-3 py-2 rounded-lg hover:bg-[#eef8fa] transition-colors"
            onClick={() => {
              setShowLogoutModal(false);
              logout();
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}