import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Clock, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NavBarWorker = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
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
          onClick={() => setShowConfirm(true)}
          className="flex flex-col items-center gap-1 text-text3"
        >
          <LogOut size={20} />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </nav>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-bg border-t border-border rounded-t-3xl w-full max-w-sm px-5 pt-6 pb-10">
            <div className="flex justify-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-red/10 flex items-center justify-center">
                <LogOut size={22} className="text-red" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-text text-center mb-1">Sign out?</h2>
            <p className="text-sm text-text3 text-center mb-6">
              You'll need to sign in again to access your account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3.5 rounded-2xl bg-bg3 border border-border text-sm font-bold text-text"
              >
                Cancel
              </button>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="flex-1 py-3.5 rounded-2xl bg-red text-sm font-bold text-white"
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

export default NavBarWorker;
