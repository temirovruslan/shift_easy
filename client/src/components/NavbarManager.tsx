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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
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
        onClick={handleLogout}
        className="flex flex-col items-center gap-1 text-text3 hover:text-red transition-colors"
      >
        <LogOut size={20} />
        <span className="text-[10px] font-medium">Logout</span>
      </button>
    </nav>
  );
};

export default NavbarManager;
