import { useNavigate, useLocation } from "react-router-dom";
import { Home, Clock, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NavBarWorker = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-bg2 border-t border-border flex items-center justify-around px-4">
      <button
        onClick={() => navigate("/worker/home")}
        className={`flex flex-col items-center gap-1 ${isActive("/worker/home") ? "text-blue" : "text-text3"}`}
      >
        <Home size={20} />
        <span className="text-[10px] font-medium">Home</span>
      </button>

      <button
        onClick={() => navigate("/worker/history")}
        className={`flex flex-col items-center gap-1 ${isActive("/worker/history") ? "text-blue" : "text-text3"}`}
      >
        <Clock size={20} />
        <span className="text-[10px] font-medium">History</span>
      </button>

      <button
        onClick={handleLogout}
        className="flex flex-col items-center gap-1 text-text3"
      >
        <LogOut size={20} />
        <span className="text-[10px] font-medium">Logout</span>
      </button>
    </nav>
  );
};

export default NavBarWorker;
