import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, Clock, Users, Star, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutGrid, path: "/manager/dashboard" },
  { label: "Shifts", icon: Clock, path: "/manager/shifts" },
  { label: "Workers", icon: Users, path: "/manager/workers" },
  { label: "Sites", icon: Star, path: "/manager/sites" },
];

const NavbarManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-bg2 border-t border-border flex items-center justify-around px-4">
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 ${active ? "text-blue" : "text-text3"}`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setShowConfirm(true)}
          className="flex flex-col items-center gap-1 text-text3 hover:text-red transition-colors"
        >
          <LogOut size={20} />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </nav>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-bg border-t border-border rounded-t-3xl w-full max-w-sm px-5 pt-6 pb-10">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue/10 flex items-center justify-center">
                <LogOut size={22} className="text-blue" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-text text-center mb-1">Leaving so soon?</h2>
            <p className="text-sm text-text3 text-center mb-6">
              You can always sign back in to your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3.5 rounded-2xl bg-blue text-sm font-bold text-white"
              >
                Stay
              </button>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="flex-1 py-3.5 rounded-2xl bg-bg3 border border-border text-sm font-bold text-text3"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavbarManager;
