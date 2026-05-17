import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Archive,
  Users,
  Clock,
  Activity,
  UserPlus,
} from "lucide-react";
import { getSite, archiveSite, activateSite } from "../api/sites";
import { getAllWorkers } from "../api/worker";
import EditSiteSection from "../components/EditSiteSection";
import NavbarManager from "../components/NavbarManager";
import Loader from "../components/Loader";
import AssignWorkersModal, {
  type WorkerOption,
} from "../components/AssignWorkersModal";
import type { Site } from "../types";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue",
  "bg-green",
  "bg-red",
  "bg-amber-500",
  "bg-purple-500",
];
const WORKERS_PREVIEW_COUNT = 4;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// ─── PAGE ─────────────────────────────────────────────────────────────────────

const ManagerSiteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [site, setSite] = useState<Site | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAllWorkers, setShowAllWorkers] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [availableWorkers, setAvailableWorkers] = useState<WorkerOption[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [siteRes, workersRes] = await Promise.all([ // [1]
          getSite(id!),
          getAllWorkers(),
        ]);
        const siteData: Site = siteRes.data;
        const allWorkers: WorkerOption[] = workersRes.data;
        const filtered = allWorkers.filter(
          (w) => !siteData.workers.some((sw) => sw._id === w._id),
        );
        setSite(siteData);
        setAvailableWorkers(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchData();
  }, [id]);

  const handleArchive = async () => {
    if (!site) return;
    setArchiving(true);
    try {
      await archiveSite(site._id);
      navigate("/manager/sites");
    } catch (err) {
      console.error(err);
      setArchiving(false);
    }
  };

  const handleActivate = async () => {
    if (!site) return;
    try {
      await activateSite(site._id);
      setSite((prev) => (prev ? { ...prev, status: "active" } : prev));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssigned = (newlyAssigned: WorkerOption[]) => {
    setSite((prev) =>
      prev ? { ...prev, workers: [...prev.workers, ...newlyAssigned] } : prev,
    );
    setAvailableWorkers((prev) =>
      prev.filter((w) => !newlyAssigned.some((a) => a._id === w._id)),
    );
  };

  if (!isLoaded) return <Loader />;
  if (!site) return null;

  const isActive = site.status === "active";
  const visibleWorkers = showAllWorkers
    ? site.workers
    : site.workers.slice(0, WORKERS_PREVIEW_COUNT);
  const hiddenCount = site.workers.length - WORKERS_PREVIEW_COUNT;

  return (
    <div className="min-h-screen bg-bg px-5 pt-14 pb-24">
      <div className="max-w-sm mx-auto">
        {/* ── Back ── */}
        <button
          onClick={() => navigate("/manager/sites")}
          className="flex items-center gap-1 text-blue text-sm mb-6"
        >
          <ChevronLeft size={16} />
          Sites
        </button>

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0 pr-3">
            <h1 className="text-2xl font-bold text-text leading-tight">
              {site.name}
            </h1>
            <p className="text-sm text-text3 mt-1">{site.address}</p>
          </div>
          <span
            className={`shrink-0 mt-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
              isActive ? "bg-green/15 text-green" : "bg-border text-text3"
            }`}
          >
            {isActive ? "Active" : "Archived"}
          </span>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            {
              icon: Activity,
              value: "0",
              label: "On shift",
              color: "text-blue",
              bg: "bg-blue/10",
            },
            {
              icon: Clock,
              value: "0h",
              label: "Today",
              color: "text-blue",
              bg: "bg-blue/10",
            },
            {
              icon: Users,
              value: `${site.workers.length}`,
              label: "Workers",
              color: "text-text",
              bg: "bg-bg3",
            },
          ].map(({ icon: Icon, value, label, color, bg }) => (
            <div
              key={label}
              className="bg-bg3 border border-border rounded-2xl py-3 px-2 text-center"
            >
              <div
                className={`w-7 h-7 rounded-xl ${bg} flex items-center justify-center mx-auto mb-1.5`}
              >
                <Icon size={14} className={color} />
              </div>
              <p className={`text-lg font-bold leading-none ${color}`}>
                {value}
              </p>
              <p className="text-[10px] text-text3 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Edit site ── */}
        <EditSiteSection
          siteId={site._id}
          name={site.name}
          address={site.address}
          onUpdate={(updated) =>
            setSite((prev) => (prev ? { ...prev, ...updated } : prev))
          }
        />

        {/* ── Workers ── */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-text3 uppercase tracking-widest">
            Workers ({site.workers.length})
          </p>
          {isActive && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-1 text-[14px] font-semibold text-blue"
            >
              <UserPlus size={17} />
              Add
            </button>
          )}
        </div>

        <div className="bg-bg3 border border-border rounded-2xl overflow-hidden mb-3">
          {site.workers.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <div className="w-10 h-10 rounded-2xl bg-bg2 flex items-center justify-center">
                <Users size={18} className="text-text3" />
              </div>
              <p className="text-sm text-text3">No workers assigned yet</p>
            </div>
          ) : (
            <>
              {visibleWorkers.map((worker, i) => (
                <div
                  key={worker._id}
                  className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                  >
                    {getInitials(worker.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text truncate">
                      {worker.name}
                    </p>
                    <p className="text-[11px] text-text3">Worker</p>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-green" : "bg-border"}`}
                  />
                </div>
              ))}

              {!showAllWorkers && hiddenCount > 0 && (
                <button
                  onClick={() => setShowAllWorkers(true)}
                  className="w-full py-3 text-sm font-semibold text-blue text-center border-t border-border"
                >
                  Show {hiddenCount} more
                </button>
              )}
            </>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col gap-2 mt-5">
          {!isActive && (
            <button
              onClick={handleActivate}
              className="w-full bg-green/10 border border-green/30 rounded-2xl py-4 text-sm font-bold text-green"
            >
              Activate site
            </button>
          )}

          {isActive && (
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="w-full bg-bg3 border border-border rounded-2xl py-4 flex items-center justify-center gap-2 text-sm font-semibold text-text3 disabled:opacity-50 hover:border-red/30 hover:text-red transition-colors"
            >
              <Archive size={15} />
              {archiving ? "Archiving..." : "Archive site"}
            </button>
          )}
        </div>
      </div>

      {/* ── Assign modal ── */}
      {showAssignModal && (
        <AssignWorkersModal
          siteId={site._id}
          availableWorkers={availableWorkers}
          onClose={() => setShowAssignModal(false)}
          onAssigned={handleAssigned}
        />
      )}

      <NavbarManager />
    </div>
  );
};

export default ManagerSiteDetailPage;

// ─── HOW THIS PAGE WORKS ─────────────────────────────────────────────────────

// ! [1]
// Promise.all runs both API calls at the same time instead of one after the other.
// Without it: getSite finishes → then getAllWorkers starts → slower.
// With it:    both run in parallel → page loads faster.
//
// Result comes back as an array, we destructure it:
// siteRes    → result of getSite()
// workersRes → result of getAllWorkers()
//
// id! → the ! tells TypeScript "I know id is not undefined, trust me".
// id comes from useParams which can be string | undefined by default.

// ── OVERVIEW ────────────────────────────────────────────────────────────────
// Manager opens a single site → sees stats, workers list, can edit
// name/address, assign new workers, archive or reactivate the site.
//
// ── DATA FLOW ────────────────────────────────────────────────────────────────
// On mount, two API calls run at the SAME TIME using Promise.all:
//   1. getSite(id)     → full site data including workers[]
//   2. getAllWorkers()  → every worker in the company
//
// Why Promise.all? Instead of waiting for call 1 to finish then call 2,
// both run in parallel — faster loading.
//
// Then filters out workers already on this site:
//   availableWorkers = allWorkers minus site.workers
// So the assign modal only shows workers not already here.
//
// ── STATE ────────────────────────────────────────────────────────────────────
// site             → full site object (name, address, workers[], status)
// isLoaded         → false until both API calls finish → shows Loader
// showAllWorkers   → shows first 4 workers, button reveals the rest
// archiving        → disables archive button while request is running
// availableWorkers → workers that can still be assigned here
// showAssignModal  → controls whether the assign modal is visible
//
// ── HANDLERS ─────────────────────────────────────────────────────────────────
// handleArchive
//   → calls archiveSite API
//   → on success navigates back to /manager/sites
//   → sets archiving=true to disable button while waiting
//
// handleActivate
//   → calls activateSite API
//   → updates site.status to "active" locally without refetching
//   → setSite(prev => ({ ...prev, status: "active" }))
//      prev is the old site object, we spread it and override just status
//
// handleAssigned (called after modal successfully assigns workers)
//   → adds newly assigned workers into site.workers[] locally
//   → removes them from availableWorkers[] so they don't appear in modal again
//   → no refetch needed — we update state directly
//
// ── WORKERS LIST ─────────────────────────────────────────────────────────────
// Shows first 4 workers (WORKERS_PREVIEW_COUNT constant).
// If more exist → "Show X more" button appears, clicking sets showAllWorkers=true.
//
// Avatar colors cycle through AVATAR_COLORS array using i % 5.
// Example with 7 workers: 0,1,2,3,4,0,1 — colors repeat from start.
//
// getInitials("Ali Reza") → splits by space → ["Ali","Reza"] →
//   takes first letter of each → ["A","R"] → joins → "AR"
//
// ── STATS ROW ────────────────────────────────────────────────────────────────
// Built as an array of objects and mapped into JSX.
// Avoids repeating the same card layout 3 times.
// "On shift" and "Today" are 0 for now — live data comes in a later feature.
//
// ── ASSIGN MODAL ─────────────────────────────────────────────────────────────
// Rendered at the bottom outside the main div so it overlays the whole screen.
// Only mounts when showAssignModal is true — saves memory when not needed.
//
// ─────────────────────────────────────────────────────────────────────────────
