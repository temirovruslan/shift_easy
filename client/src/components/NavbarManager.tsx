import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, Calendar, Users, MapPin, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutGrid, path: "/manager/dashboard" },
  { label: "Shifts",    icon: Calendar,    path: "/manager/shifts" },
  { label: "Workers",   icon: Users,       path: "/manager/workers" },
  { label: "Projects",  icon: MapPin,      path: "/manager/sites" }, // route stays /sites — backend unchanged
];

const NavbarManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      {/* ── Navigation ── */}
      <nav className="
        fixed bottom-0 left-0 right-0 z-40
        h-16 bg-bg2 border-t border-border
        flex flex-row items-center justify-around px-4
        md:top-0 md:bottom-0 md:right-auto md:w-52
        md:h-auto md:flex-col md:items-stretch md:justify-start
        md:px-3 md:py-5 md:gap-1
        md:border-t-0 md:border-r
      ">
        {/* Logo — desktop only */}
        <div className="hidden md:flex items-center gap-2.5 px-2 mb-6 shrink-0">
          <img src="/logo2.webp" alt="ShiftEasy" className="w-8 h-8 rounded-lg object-contain shrink-0" />
          <span className="text-sm font-bold text-text">ShiftEasy</span>
        </div>

        {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center transition-colors rounded-xl
                flex-col gap-1 py-2
                md:flex-row md:gap-3 md:py-2.5 md:px-3 md:w-full md:hover:bg-bg3
                ${active ? "text-blue md:bg-bg3" : "text-text3 hover:text-text"}`}
            >
              <Icon size={18} />
              <span className="text-[10px] md:text-sm md:font-semibold">{label}</span>
            </button>
          );
        })}

        {/* Logout — pinned to bottom on desktop */}
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center transition-colors rounded-xl text-text3
            flex-col gap-1 py-2
            md:flex-row md:gap-3 md:py-2.5 md:px-3 md:w-full
            hover:text-red md:hover:bg-bg3 md:mt-auto"
        >
          <LogOut size={18} />
          <span className="text-[10px] md:text-sm md:font-semibold">Logout</span>
        </button>
      </nav>

      {/* ── Logout confirmation ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative bg-bg border-t border-border rounded-t-3xl w-full max-w-sm px-5 pt-6 pb-10
            md:rounded-2xl md:border md:border-border md:max-w-xs md:pb-6">
            <div className="flex justify-center mb-4 md:hidden">
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
