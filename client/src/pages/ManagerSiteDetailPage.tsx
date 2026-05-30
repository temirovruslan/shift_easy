import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Archive, Users, Clock, Activity, UserPlus } from "lucide-react";
import { getSite, archiveSite, activateSite } from "../api/sites";
import { getAllWorkers } from "../api/worker";
import EditSiteSection from "../components/EditSiteSection";
import NavbarManager from "../components/NavbarManager";
import Loader from "../components/Loader";
import AssignWorkersModal, { type WorkerOption } from "../components/AssignWorkersModal";
import type { Site } from "../types";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["bg-blue", "bg-green", "bg-red", "bg-amber-500", "bg-purple-500"];
const WORKERS_PREVIEW_COUNT = 4;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

// ─── PAGE ─────────────────────────────────────────────────────────────────────

const ManagerSiteDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [showAllWorkers, setShowAllWorkers] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const queryClient = useQueryClient();

  const { data: site, isLoading: siteLoading } = useQuery<Site>({
    queryKey: ["site", id],
    queryFn: async () => { const res = await getSite(id!); return res.data; },
    staleTime: 60_000,
  });

  const { data: allWorkers = [] } = useQuery<WorkerOption[]>({
    queryKey: ["workers"],
    queryFn: async () => { const res = await getAllWorkers(); return res.data ?? []; },
    staleTime: 5 * 60_000,
  });

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
      queryClient.setQueryData(["site", id], { ...site, status: "active" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssigned = (newlyAssigned: WorkerOption[]) => {
    if (!site) return;
    queryClient.setQueryData(["site", id], { ...site, workers: [...site.workers, ...newlyAssigned] });
  };

  if (siteLoading) return <Loader />;
  if (!site) return null;

  const isActive = site.status === "active";
  const availableWorkers = allWorkers.filter((w) => !site.workers.some((sw) => sw._id === w._id));
  const visibleWorkers = showAllWorkers ? site.workers : site.workers.slice(0, WORKERS_PREVIEW_COUNT);
  const hiddenCount = site.workers.length - WORKERS_PREVIEW_COUNT;

  return (
    <div className="min-h-screen bg-bg pb-24 md:ml-52 md:pb-8">
      <div className="px-5 pt-14 md:px-8 md:pt-8 max-w-5xl">

        {/* Back */}
        <button
          onClick={() => navigate("/manager/sites")}
          className="flex items-center gap-1 text-blue text-sm mb-6"
        >
          <ChevronLeft size={16} />
          Projects
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0 pr-3">
            <h1 className="text-2xl font-bold text-text leading-tight">{site.name}</h1>
            <p className="text-sm text-text3 mt-1">{site.address}</p>
          </div>
          <span className={`shrink-0 mt-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
            isActive ? "bg-green/15 text-green" : "bg-border text-text3"
          }`}>
            {isActive ? "Active" : "Archived"}
          </span>
        </div>

        {/* ── Desktop 2-col / Mobile single col ── */}
        <div className="md:grid md:grid-cols-[1fr_320px] md:gap-8 md:items-start">

          {/* ── Left column ── */}
          <div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { icon: Activity, value: "0",                     label: "On shift", color: "text-blue", bg: "bg-blue/10" },
                { icon: Clock,    value: "0h",                    label: "Today",    color: "text-blue", bg: "bg-blue/10" },
                { icon: Users,    value: `${site.workers.length}`, label: "Workers",  color: "text-text", bg: "bg-bg3"    },
              ].map(({ icon: Icon, value, label, color, bg }) => (
                <div key={label} className="bg-bg3 border border-border rounded-2xl py-3 px-2 text-center">
                  <div className={`w-7 h-7 rounded-xl ${bg} flex items-center justify-center mx-auto mb-1.5`}>
                    <Icon size={14} className={color} />
                  </div>
                  <p className={`text-lg font-bold leading-none ${color}`}>{value}</p>
                  <p className="text-[10px] text-text3 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Edit */}
            <EditSiteSection
              siteId={site._id}
              name={site.name}
              address={site.address}
              onUpdate={(updated) => setSite((prev) => (prev ? { ...prev, ...updated } : prev))}
            />
          </div>

          {/* ── Right column ── */}
          <div>
            {/* Workers header */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-text3 uppercase tracking-widest">
                Workers ({site.workers.length})
              </p>
              {isActive && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-1 text-sm font-semibold text-blue"
                >
                  <UserPlus size={16} />
                  Add
                </button>
              )}
            </div>

            {/* Workers list */}
            <div className="bg-bg3 border border-border rounded-2xl overflow-hidden mb-4">
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
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                        {getInitials(worker.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text truncate">{worker.name}</p>
                        <p className="text-[11px] text-text3">Worker</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-green" : "bg-border"}`} />
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

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {!isActive && (
                <button
                  onClick={handleActivate}
                  className="w-full bg-green/10 border border-green/30 rounded-2xl py-4 text-sm font-bold text-green hover:bg-green/15 transition-colors"
                >
                  Activate project
                </button>
              )}
              {isActive && (
                <button
                  onClick={handleArchive}
                  disabled={archiving}
                  className="w-full bg-bg3 border border-border rounded-2xl py-4 flex items-center justify-center gap-2 text-sm font-semibold text-text3 disabled:opacity-50 hover:border-red/30 hover:text-red transition-colors"
                >
                  <Archive size={15} />
                  {archiving ? "Archiving..." : "Archive project"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

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
