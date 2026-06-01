import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutGrid, Calendar, Users, MapPin, LogOut, Play, Square } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getAllShifts } from "../api/shifts";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

// ─── Toast UI ─────────────────────────────────────────────────────────────────

const ShiftToast = ({
  t,
  type,
  name,
  site,
  duration,
  onView,
}: {
  t: any;
  type: "start" | "stop";
  name: string;
  site: string;
  duration?: number;
  onView: () => void;
}) => (
  <div
    className={`bg-bg2 border rounded-2xl overflow-hidden shadow-2xl w-75
      ${type === "start" ? "border-green/25" : "border-border"}
      ${t.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
      transition-all duration-300`}
  >
    <div className={`h-0.5 w-full ${type === "start" ? "bg-green" : "bg-text3/40"}`} />
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${type === "start" ? "bg-green/10 border-green/30" : "bg-bg3 border-border"}`}>
        {type === "start"
          ? <Play size={14} className="text-green fill-green" />
          : <Square size={12} className="text-text3 fill-text3" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text truncate">{name}</p>
        <p className="text-xs text-text3 mt-0.5 leading-snug line-clamp-2">{site}</p>
        {type === "stop" && duration !== undefined && (
          <p className="text-xs font-semibold text-blue mt-1">{fmt(duration)}</p>
        )}
      </div>
      <button
        onClick={onView}
        className={`shrink-0 text-xs font-bold rounded-xl px-2.5 py-1.5 transition-colors ml-1
          ${type === "start" ? "bg-green/10 border border-green/25 text-green hover:bg-green/20" : "bg-bg3 border border-border text-text3 hover:bg-bg"}`}
      >
        View
      </button>
    </div>
  </div>
);

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutGrid, path: "/manager/dashboard" },
  { label: "Shifts",    icon: Calendar,   path: "/manager/shifts" },
  { label: "Workers",   icon: Users,      path: "/manager/workers" },
  { label: "Projects",  icon: MapPin,     path: "/manager/sites" },
];

const NavbarManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [dashboardDot, setDashboardDot] = useState(false);

  const prevShiftsRef = useRef<Map<string, any>>(new Map());
  const isFirstLoad = useRef(true);
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;

  const { data: liveShifts = [], dataUpdatedAt } = useQuery<any[]>({
    queryKey: ["allShifts"],
    queryFn: async () => { const res = await getAllShifts(); return res.data ?? []; },
    staleTime: 0,
    refetchInterval: 15_000,
  });

  // Clear dot when manager visits dashboard
  useEffect(() => {
    if (location.pathname.startsWith("/manager/dashboard")) setDashboardDot(false);
  }, [location.pathname]);

  // Detect shift starts/stops on each poll
  useEffect(() => {
    if (!dataUpdatedAt) return;

    const currentActive = liveShifts.filter((s: any) => s.status === "active");

    if (isFirstLoad.current) {
      currentActive.forEach((s: any) => prevShiftsRef.current.set(s._id, s));
      isFirstLoad.current = false;
      return;
    }

    const prevIds = new Set(prevShiftsRef.current.keys());
    const currentIds = new Set(currentActive.map((s: any) => s._id));

    // Shift started
    currentActive
      .filter((s: any) => !prevIds.has(s._id))
      .forEach((s: any) => {
        const id = `start-${s._id}`;
        const onView = () => { navigateRef.current("/manager/dashboard"); toast.dismiss(id); };
        toast.custom(
          (t) => <ShiftToast t={t} type="start" name={s.worker?.name ?? "Worker"} site={s.site?.name ?? ""} onView={onView} />,
          { id, duration: 6000 }
        );
        if (!pathnameRef.current.startsWith("/manager/dashboard")) setDashboardDot(true);
      });

    // Shift stopped
    [...prevShiftsRef.current.entries()]
      .filter(([id]) => !currentIds.has(id))
      .forEach(([, shift]) => {
        const mins = Math.floor((Date.now() - new Date(shift.startTime).getTime()) / 60000);
        const id = `stop-${shift._id}`;
        const onView = () => { navigateRef.current("/manager/dashboard"); toast.dismiss(id); };
        toast.custom(
          (t) => <ShiftToast t={t} type="stop" name={shift.worker?.name ?? "Worker"} site={shift.site?.name ?? ""} duration={mins} onView={onView} />,
          { id, duration: 6000 }
        );
        if (!pathnameRef.current.startsWith("/manager/dashboard")) setDashboardDot(true);
      });

    // Update snapshot
    const newMap = new Map<string, any>();
    currentActive.forEach((s: any) => newMap.set(s._id, s));
    prevShiftsRef.current = newMap;
  }, [dataUpdatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

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
          <img src="/new-logo2.webp" alt="ShiftEasy" className="w-8 h-8 rounded-lg object-contain shrink-0" />
          <span className="text-sm font-bold text-text">ShiftEasy</span>
        </div>

        {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
          const active = isActive(path);
          const isDashboard = path === "/manager/dashboard";
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`relative flex items-center transition-colors rounded-xl
                flex-col gap-1 py-2
                md:flex-row md:gap-3 md:py-2.5 md:px-3 md:w-full md:hover:bg-bg3
                ${active ? "text-blue md:bg-bg3" : "text-text3 hover:text-text"}`}
            >
              <span className="relative">
                <Icon size={18} />
                {isDashboard && dashboardDot && (
                  <>
                    <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-green border-2 border-bg2 animate-pulse" />
                    <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-green/40 animate-ping" />
                  </>
                )}
              </span>
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
