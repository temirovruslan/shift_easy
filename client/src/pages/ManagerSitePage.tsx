import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, MapPin, Building2, UserPlus, Pencil, Archive, RotateCcw } from "lucide-react";
import { getSites, createSite, archiveSite, activateSite } from "../api/sites";
import { getAllWorkers } from "../api/worker";
import NavbarManager from "../components/NavbarManager";
import Loader from "../components/Loader";
import AssignWorkersModal, { type WorkerOption } from "../components/AssignWorkersModal";
import { useAuth } from "../context/AuthContext";
import type { Site } from "../types";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["bg-blue", "bg-green", "bg-red", "bg-amber-500", "bg-purple-500"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

// ─── WORKER AVATARS ───────────────────────────────────────────────────────────

const WorkerAvatars = ({ workers }: { workers: Site["workers"] }) => {
  const visible = workers.slice(0, 3);
  const extra = workers.length - visible.length;
  return (
    <div className="flex items-center">
      {visible.map((w, i) => (
        <div
          key={w._id}
          style={{ zIndex: visible.length - i, marginLeft: i === 0 ? 0 : -8 }}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-bg2 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
        >
          {getInitials(w.name)}
        </div>
      ))}
      {extra > 0 && (
        <div
          style={{ zIndex: 0, marginLeft: -8 }}
          className="w-7 h-7 rounded-full bg-bg3 border border-border ring-2 ring-bg2 flex items-center justify-center text-[10px] font-semibold text-text3"
        >
          +{extra}
        </div>
      )}
    </div>
  );
};

// ─── SITE CARD ────────────────────────────────────────────────────────────────

const SiteCard = ({
  site,
  selected,
  onSelect,
}: {
  site: Site;
  selected: boolean;
  onSelect: (s: Site) => void;
}) => {
  const archived = site.status === "archived";
  return (
    <button
      onClick={() => onSelect(site)}
      className={`w-full text-left rounded-2xl p-5 border transition-colors ${
        selected
          ? "bg-blue/5 border-blue/40"
          : archived
          ? "bg-bg2 border-border opacity-60 hover:opacity-80"
          : "bg-bg2 border-border hover:border-blue/25"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className={`font-bold text-base leading-tight flex-1 min-w-0 truncate ${archived ? "text-text3" : "text-text"}`}>
          {site.name}
        </p>
        {archived ? (
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-border text-text3">
            Archived
          </span>
        ) : (
          <span className="shrink-0 flex items-center gap-1.5 text-[10px] font-semibold text-green">
            <span className="w-1.5 h-1.5 rounded-full bg-green inline-block" />
            Active
          </span>
        )}
      </div>

      <p className="text-xs text-text3 mb-4">{site.address}</p>

      {!archived && (
        <div className="flex gap-2 mb-4">
          {[
            { value: "0",                       label: "On shift" },
            { value: "0h",                      label: "Today"    },
            { value: String(site.workers.length), label: "Workers"  },
          ].map(({ value, label }) => (
            <div key={label} className="flex-1 bg-bg3 rounded-xl py-2.5 px-2 text-center">
              <p className="text-base font-bold text-blue">{value}</p>
              <p className="text-[10px] text-text3 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <WorkerAvatars workers={site.workers} />
        <span className={`text-xs font-semibold ${selected ? "text-blue" : "text-text3"}`}>
          {selected ? "Selected ✓" : archived ? "Restore ›" : "View detail ›"}
        </span>
      </div>
    </button>
  );
};

// ─── SITE DRAWER ──────────────────────────────────────────────────────────────

const SiteDrawer = ({
  site,
  availableWorkers,
  onClose,
  onArchive,
  onActivate,
  onAssigned,
  onEditNavigate,
}: {
  site: Site;
  availableWorkers: WorkerOption[];
  onClose: () => void;
  onArchive: () => void;
  onActivate: () => void;
  onAssigned: (workers: WorkerOption[]) => void;
  onEditNavigate: () => void;
}) => {
  const { user } = useAuth();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const isActive = site.status === "active";

  return (
    <>
      <div className="hidden md:flex w-80 bg-bg2 border-l border-border flex-col overflow-hidden shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <p className="text-[10px] font-bold text-text3 uppercase tracking-widest">Project detail</p>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-bg3 text-text3 hover:text-text transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <h2 className="text-xl font-bold text-text mb-0.5 leading-tight">{site.name}</h2>
          <p className="text-sm text-text3 mb-5">{site.address}</p>

          {/* Live stats */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <div className="bg-bg3 border border-border rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue">0</p>
              <p className="text-[10px] text-text3 mt-0.5">On shift now</p>
            </div>
            <div className="bg-bg3 border border-border rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue">0h</p>
              <p className="text-[10px] text-text3 mt-0.5">Today total</p>
            </div>
          </div>

          {/* Info rows */}
          <div className="mb-5">
            {[
              { label: "This week",      value: "0h",                         accent: false },
              { label: "Total workers",  value: String(site.workers.length),  accent: false },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-border">
                <span className="text-sm text-text3">{label}</span>
                <span className="text-sm font-semibold text-text">{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2.5 border-b border-border">
              <span className="text-sm text-text3">Status</span>
              <span className={`flex items-center gap-1.5 text-sm font-semibold ${isActive ? "text-green" : "text-text3"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green" : "bg-text3"}`} />
                {isActive ? "Active" : "Archived"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-text3">Manager</span>
              <span className="text-sm font-semibold text-text">{user?.name || "—"}</span>
            </div>
          </div>

          {/* Workers */}
          <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-3">Workers on site</p>
          {site.workers.length === 0 ? (
            <p className="text-sm text-text3 text-center py-6">No workers assigned yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {site.workers.map((worker, i) => (
                <div key={worker._id} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                    {getInitials(worker.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{worker.name}</p>
                    <p className="text-xs text-text3">{(worker as any).occupation || "Worker"}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-green" : "bg-border"}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-border flex flex-col gap-2 shrink-0">
          {isActive && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="w-full py-3 rounded-xl bg-bg3 border border-border text-sm font-semibold text-text flex items-center justify-center gap-2 hover:border-blue/30 hover:text-blue transition-colors"
            >
              <UserPlus size={14} /> Assign worker
            </button>
          )}
          <button
            onClick={onEditNavigate}
            className="w-full py-3 rounded-xl bg-bg3 border border-border text-sm font-semibold text-text flex items-center justify-center gap-2 hover:border-blue/30 transition-colors"
          >
            <Pencil size={14} /> Edit site info
          </button>
          {isActive ? (
            <button
              onClick={onArchive}
              className="w-full py-3 rounded-xl bg-red/10 border border-red/20 text-sm font-semibold text-red flex items-center justify-center gap-2 hover:bg-red/15 transition-colors"
            >
              <Archive size={14} /> Archive site
            </button>
          ) : (
            <button
              onClick={onActivate}
              className="w-full py-3 rounded-xl bg-green/10 border border-green/20 text-sm font-semibold text-green flex items-center justify-center gap-2 hover:bg-green/15 transition-colors"
            >
              <RotateCcw size={14} /> Restore site
            </button>
          )}
        </div>
      </div>

      {showAssignModal && (
        <AssignWorkersModal
          siteId={site._id}
          availableWorkers={availableWorkers}
          onClose={() => setShowAssignModal(false)}
          onAssigned={(workers) => {
            onAssigned(workers);
            setShowAssignModal(false);
          }}
        />
      )}
    </>
  );
};

// ─── ADD SITE SHEET ───────────────────────────────────────────────────────────

interface AddSiteSheetProps {
  onClose: () => void;
  onCreated: (site: Site) => void;
}

const AddSiteSheet = ({ onClose, onCreated }: AddSiteSheetProps) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !address.trim()) { setError("Please fill in all fields"); return; }
    try {
      setLoading(true);
      const res = await createSite({ name: name.trim(), address: address.trim() });
      onCreated(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg border-t border-border rounded-t-3xl w-full max-w-sm md:rounded-2xl md:border md:border-border">
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between px-5 pt-4 pb-5">
          <div>
            <h2 className="text-lg font-bold text-text">New Project</h2>
            <p className="text-xs text-text3 mt-0.5">Add a work location</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg3 text-text3 hover:text-text transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 pb-8">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-text3 uppercase tracking-widest px-1">Project name</label>
            <div className="flex items-center gap-3 bg-bg3 border border-border rounded-2xl px-4 py-3.5 focus-within:border-blue/50 transition-colors">
              <Building2 size={15} className="text-text3 shrink-0" />
              <input
                type="text"
                placeholder="e.g. Ülemiste City"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent text-sm text-text placeholder:text-text3 outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-text3 uppercase tracking-widest px-1">Address</label>
            <div className="flex items-center gap-3 bg-bg3 border border-border rounded-2xl px-4 py-3.5 focus-within:border-blue/50 transition-colors">
              <MapPin size={15} className="text-text3 shrink-0" />
              <input
                type="text"
                placeholder="e.g. Pärnu mnt 15, Tallinn"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="flex-1 bg-transparent text-sm text-text placeholder:text-text3 outline-none"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red px-1">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue rounded-2xl py-4 text-sm font-bold text-white disabled:opacity-50 mt-1"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── PAGE ─────────────────────────────────────────────────────────────────────

const ManagerSitePage = () => {
  const navigate = useNavigate();
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);

  const queryClient = useQueryClient();

  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: async () => { const res = await getSites(); return res.data ?? []; },
    staleTime: 60_000,
  });

  const { data: allWorkers = [] } = useQuery<WorkerOption[]>({
    queryKey: ["workers"],
    queryFn: async () => { const res = await getAllWorkers(); return res.data ?? []; },
    staleTime: 5 * 60_000,
    enabled: !!selectedSite,
  });

  const availableWorkers = allWorkers.filter(
    (w) => !selectedSite?.workers.some((sw) => sw._id === w._id)
  );

  const handleCardClick = (site: Site) => {
    if (window.innerWidth < 768) {
      navigate(`/manager/sites/${site._id}`);
      return;
    }
    setSelectedSite((prev) => (prev?._id === site._id ? null : site));
  };

  const handleArchive = async () => {
    if (!selectedSite) return;
    try {
      await archiveSite(selectedSite._id);
      const updated = { ...selectedSite, status: "archived" as const };
      queryClient.setQueryData<Site[]>(["sites"], (prev) =>
        (prev ?? []).map((s) => s._id === selectedSite._id ? updated : s)
      );
      setSelectedSite(updated);
    } catch (err) { console.error(err); }
  };

  const handleActivate = async () => {
    if (!selectedSite) return;
    try {
      await activateSite(selectedSite._id);
      const updated = { ...selectedSite, status: "active" as const };
      queryClient.setQueryData<Site[]>(["sites"], (prev) =>
        (prev ?? []).map((s) => s._id === selectedSite._id ? updated : s)
      );
      setSelectedSite(updated);
    } catch (err) { console.error(err); }
  };

  const handleAssigned = (newWorkers: WorkerOption[]) => {
    if (!selectedSite) return;
    const updated = { ...selectedSite, workers: [...selectedSite.workers, ...newWorkers] };
    queryClient.setQueryData<Site[]>(["sites"], (prev) =>
      (prev ?? []).map((s) => s._id === selectedSite._id ? updated : s)
    );
    setSelectedSite(updated);
  };

  if (isLoading) return <Loader />;

  const activeSites = sites.filter((s) => s.status === "active");
  const archivedSites = sites.filter((s) => s.status === "archived");

  return (
    <div className="bg-bg pb-24 md:ml-52 md:pb-0 md:h-screen md:flex md:overflow-hidden min-h-screen">

      {/* Scrollable list area */}
      <div className="flex-1 md:overflow-y-auto">
        <div className="px-5 pt-14 md:px-8 md:pt-8 md:pb-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-text">Projects</h1>
            <button
              onClick={() => setShowAddSheet(true)}
              className="flex items-center gap-1.5 bg-blue rounded-xl px-4 py-2 text-sm font-bold text-white hover:bg-blue/90 transition-colors"
            >
              <span className="text-base leading-none">+</span> Add project
            </button>
          </div>

          {sites.length > 0 && (
            <p className="text-[10px] font-semibold text-text3 uppercase tracking-widest mb-6">
              {activeSites.length} active · {archivedSites.length} archived
            </p>
          )}

          {sites.length === 0 ? (
            <p className="text-sm text-text3 text-center mt-16">
              No projects yet. Tap + Add to create one.
            </p>
          ) : (
            <div className="flex flex-col gap-3 max-w-2xl">
              {activeSites.map((site) => (
                <SiteCard
                  key={site._id}
                  site={site}
                  selected={selectedSite?._id === site._id}
                  onSelect={handleCardClick}
                />
              ))}

              {archivedSites.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mt-2 mb-1">
                    Archived
                  </p>
                  {archivedSites.map((site) => (
                    <SiteCard
                      key={site._id}
                      site={site}
                      selected={selectedSite?._id === site._id}
                      onSelect={handleCardClick}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop side drawer */}
      {selectedSite && (
        <SiteDrawer
          site={selectedSite}
          availableWorkers={availableWorkers}
          onClose={() => setSelectedSite(null)}
          onArchive={handleArchive}
          onActivate={handleActivate}
          onAssigned={handleAssigned}
          onEditNavigate={() => navigate(`/manager/sites/${selectedSite._id}`)}
        />
      )}

      {showAddSheet && (
        <AddSiteSheet
          onClose={() => setShowAddSheet(false)}
          onCreated={(newSite) => {
            queryClient.setQueryData<Site[]>(["sites"], (prev) => [newSite, ...(prev ?? [])]);
            setShowAddSheet(false);
          }}
        />
      )}

      <NavbarManager />
    </div>
  );
};

export default ManagerSitePage;
