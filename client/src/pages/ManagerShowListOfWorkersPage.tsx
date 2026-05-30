import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  UserPlus,
  Search,
  ChevronDown,
  ChevronRight,
  Mail,
  Briefcase,
  User,
} from "lucide-react";
import NavbarManager from "../components/NavbarManager";
import Loader from "../components/Loader";
import {
  getAllWorkers,
  createWorker,
  getWorker,
  removeWorker,
} from "../api/worker";
import { getSites } from "../api/sites";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const AVATAR_COLORS = [
  "bg-blue",
  "bg-green",
  "bg-red",
  "bg-amber-500",
  "bg-purple-500",
];

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

const StatusBadge = ({ isActivated }: { isActivated: boolean }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
      isActivated ? "bg-green/15 text-green" : "bg-amber-500/15 text-amber-500"
    }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${isActivated ? "bg-green" : "bg-amber-500"}`}
    />
    {isActivated ? "Active" : "Pending"}
  </span>
);

// ─── FILTER DROPDOWN ──────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  active,
  options,
  onSelect,
}: {
  label: string;
  active: boolean;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
          active
            ? "bg-blue/10 border-blue/40 text-blue"
            : "bg-bg3 border-border text-text3 hover:border-blue/30"
        }`}
      >
        {label}
        <ChevronDown
          size={11}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full mt-1.5 left-0 min-w-36 bg-bg2 border border-border rounded-2xl overflow-hidden shadow-xl">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onSelect(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left transition-colors hover:bg-bg3
                  ${label === opt.label ? "text-blue font-semibold" : "text-text"}`}
              >
                {label === opt.label && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue shrink-0" />
                )}
                {label !== opt.label && (
                  <div className="w-1.5 h-1.5 shrink-0" />
                )}
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── WORKER DRAWER ────────────────────────────────────────────────────────────

const WorkerDrawer = ({
  worker,
  onClose,
  onRemoved,
}: {
  worker: any;
  onClose: () => void;
  onRemoved: (id: string) => void;
}) => {
  const { data: detail = worker } = useQuery({
    queryKey: ["worker", worker._id],
    queryFn: async () => {
      const res = await getWorker(worker._id);
      return res.data ?? res;
    },
  });

  const [removing, setRemoving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const initials = getInitials(detail.name);
  const colorClass =
    AVATAR_COLORS[detail.name.charCodeAt(0) % AVATAR_COLORS.length];
  const joinedDate = new Date(detail.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <>
      <div className="hidden md:flex w-80 bg-bg2 border-l border-border flex-col overflow-hidden shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <p className="text-[10px] font-bold text-text3 uppercase tracking-widest">
            Worker detail
          </p>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-bg3 text-text3 hover:text-text transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Avatar + name */}
          <div className="flex flex-col items-center text-center mb-5">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white mb-3 ${colorClass}`}
            >
              {initials}
            </div>
            <h2 className="text-lg font-bold text-text leading-tight">
              {detail.name}
            </h2>
            <p className="text-xs text-text3 mt-0.5">
              {detail.occupation ?? "—"}
              {detail.sites?.[0] ? ` · ${detail.sites[0].name}` : ""}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <div className="bg-bg3 border border-border rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-blue">—</p>
              <p className="text-[10px] text-text3 mt-0.5">This week</p>
            </div>
            <div className="bg-bg3 border border-border rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-text">—</p>
              <p className="text-[10px] text-text3 mt-0.5">All time</p>
            </div>
          </div>

          {/* Info rows */}
          <div className="mb-5">
            {[
              { label: "Email", value: detail.email, cls: "text-blue" },
              {
                label: "Status",
                value: detail.isActivated ? "Active" : "Pending",
                cls: detail.isActivated ? "text-green" : "text-amber-500",
              },
              {
                label: "Project",
                value: detail.sites?.[0]?.name ?? "No project",
                cls: "text-text",
              },
              { label: "Joined", value: joinedDate, cls: "text-text" },
              {
                label: "Last shift",
                value: detail.isActivated ? "—" : "Never",
                cls: "text-text",
              },
            ].map(({ label, value, cls }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0"
              >
                <span className="text-sm text-text3">{label}</span>
                <span className={`text-sm font-semibold ${cls}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-border flex flex-col gap-2 shrink-0">
          <button className="w-full py-3 rounded-xl bg-bg3 border border-border text-sm font-semibold text-text flex items-center justify-between px-4 hover:border-blue/30 transition-colors">
            Move to another project
            <ChevronRight size={14} className="text-text3" />
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-3 rounded-xl bg-red/10 border border-red/20 text-sm font-semibold text-red hover:bg-red/15 transition-colors"
          >
            Remove from company
          </button>
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative bg-bg border border-border rounded-2xl w-80 px-6 py-6">
            <h3 className="text-lg font-bold text-text mb-1">Remove worker?</h3>
            <p className="text-sm text-text3 mb-5">
              <span className="text-text font-semibold">{detail.name}</span>{" "}
              will be archived and removed from the active list.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-bg3 border border-border text-sm font-semibold text-text"
              >
                Cancel
              </button>
              <button
                disabled={removing}
                onClick={async () => {
                  setRemoving(true);
                  try {
                    await removeWorker(detail._id);
                    onRemoved(detail._id);
                  } finally {
                    setRemoving(false);
                    setShowConfirm(false);
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-red text-sm font-bold text-white disabled:opacity-50"
              >
                {removing ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── ADD WORKER MODAL ─────────────────────────────────────────────────────────

const AddWorkerModal = ({
  sites,
  onClose,
  onCreated,
}: {
  sites: any[];
  onClose: () => void;
  onCreated: () => void;
}) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [occupation, setOccupation] = useState("");
  const [siteId, setSiteId] = useState("");
  const [siteOpen, setSiteOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { mutate: addWorker, isPending } = useMutation({
    mutationFn: (payload: any) => createWorker(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      onCreated();
      onClose();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message ?? "Something went wrong");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim() || name.trim().length < 2) { setFormError("Full name must be at least 2 characters"); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setFormError("Enter a valid email address"); return; }
    addWorker({ name: name.trim(), email: email.trim(), occupation: occupation.trim(), siteId: siteId || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-bg border-t border-border rounded-t-3xl w-full max-w-sm md:rounded-2xl md:border md:border-border">
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between px-5 pt-4 pb-5">
          <div>
            <h2 className="text-lg font-bold text-text">Add Worker</h2>
            <p className="text-xs text-text3 mt-0.5">
              They'll receive a login invite
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg3 text-text3 hover:text-text transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 pb-8">
          {[
            {
              label: "Full name",
              value: name,
              set: setName,
              type: "text",
              ph: "Mart Tamm",
              icon: User,
            },
            {
              label: "Email",
              value: email,
              set: setEmail,
              type: "email",
              ph: "mart@ehituse.ee",
              icon: Mail,
            },
            {
              label: "Occupation",
              value: occupation,
              set: setOccupation,
              type: "text",
              ph: "Ehitustööline",
              icon: Briefcase,
            },
          ].map(({ label, value, set, type, ph, icon: Icon }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text3 uppercase tracking-widest px-1">
                {label}
              </label>
              <div className="flex items-center gap-3 bg-bg3 border border-border rounded-2xl px-4 py-3.5 focus-within:border-blue/50 transition-colors">
                <Icon size={15} className="text-text3 shrink-0" />
                <input
                  type={type}
                  placeholder={ph}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-text placeholder:text-text3 outline-none"
                />
              </div>
            </div>
          ))}

          {sites.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text3 uppercase tracking-widest px-1">
                Project (optional)
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSiteOpen((v) => !v)}
                  className={`w-full flex items-center justify-between gap-3 bg-bg3 border rounded-2xl px-4 py-3.5 text-sm transition-colors text-left ${siteOpen ? "border-blue/50" : "border-border"}`}
                >
                  <span className={siteId ? "text-text" : "text-text3"}>
                    {siteId
                      ? sites.find((s) => s._id === siteId)?.name
                      : "Select a project…"}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`text-text3 shrink-0 transition-transform ${siteOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {siteOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setSiteOpen(false)}
                    />
                    <div className="absolute z-20 left-0 right-0 bottom-full mb-1.5 bg-bg2 border border-border rounded-2xl overflow-hidden shadow-xl">
                      {[{ _id: "", name: "No project" }, ...sites].map((s) => (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => {
                            setSiteId(s._id);
                            setSiteOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-bg3
                            ${siteId === s._id ? "text-blue font-semibold" : s._id === "" ? "text-text3" : "text-text"}`}
                        >
                          {siteId === s._id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue shrink-0" />
                          )}
                          {siteId !== s._id && (
                            <div className="w-1.5 h-1.5 shrink-0" />
                          )}
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {formError && <p className="text-xs text-red px-1">{formError}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue rounded-2xl py-4 text-sm font-bold text-white disabled:opacity-50 mt-1 flex items-center justify-center gap-2"
          >
            <UserPlus size={15} />
            {isPending ? "Sending invite..." : "Send invite"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── PAGE ─────────────────────────────────────────────────────────────────────

const ManagerShowListOfWorkersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── All hooks must be at top, before any early return ──
  const { data: workers = [], isLoading: workersLoading } = useQuery({
    queryKey: ["workers"],
    queryFn: async () => {
      const res = await getAllWorkers();
      return Array.isArray(res) ? res : (res.data ?? []);
    },
    staleTime: 5 * 60_000,
  });
  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const res = await getSites();
      const all = Array.isArray(res) ? res : (res.data ?? []);
      return all.filter((s: any) => s.status === "active");
    },
    staleTime: 5 * 60_000,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "pending"
  >("all");
  const [activeSiteFilter, setActiveSiteFilter] = useState("All projects");
  const [selectedWorker, setSelectedWorker] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  if (workersLoading || sitesLoading) return <Loader />;

  const uniqueSites: string[] = Array.from(
    new Set(
      workers.flatMap((w: any) => w.sites?.map((s: any) => s.name) ?? []),
    ),
  );
  const siteOptions = ["All projects", ...uniqueSites];

  const q = search.toLowerCase();
  const filtered = workers.filter((w: any) => {
    const matchSearch =
      w.name.toLowerCase().includes(q) ||
      w.email?.toLowerCase().includes(q) ||
      w.occupation?.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? w.isActivated : !w.isActivated);
    const matchSite =
      activeSiteFilter === "All projects" ||
      w.sites?.some((s: any) => s.name === activeSiteFilter);
    return matchSearch && matchStatus && matchSite;
  });

  const activeCount = workers.filter((w: any) => w.isActivated).length;
  const pendingCount = workers.filter((w: any) => !w.isActivated).length;

  const handleWorkerClick = (worker: any) => {
    if (window.innerWidth < 768) {
      navigate(`/manager/worker/${worker._id}`);
    } else {
      setSelectedWorker((prev: any) =>
        prev?._id === worker._id ? null : worker,
      );
    }
  };

  const handleRemoved = (_id: string) => {
    queryClient.invalidateQueries({ queryKey: ["workers"] });
    setSelectedWorker(null);
  };

  const statusLabel =
    statusFilter === "all"
      ? "All workers"
      : statusFilter === "active"
        ? "Active"
        : "Pending";

  return (
    <div className="bg-bg pb-24 md:ml-52 md:pb-0 md:h-screen md:flex md:overflow-hidden min-h-screen">
      {/* Main area */}
      <div className="flex-1 md:overflow-y-auto">
        <div className="px-5 pt-14 md:px-8 md:pt-8 md:pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-bold text-text">Workers</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-blue rounded-xl px-4 py-2 text-sm font-bold text-white hover:bg-blue/90 transition-colors"
            >
              <span className="text-base leading-none">+</span> Add worker
            </button>
          </div>

          {/* Search + filters */}
          <div className="flex flex-col gap-3 mb-5 md:flex-row md:items-center">
            <div className="flex items-center gap-2 bg-bg3 border border-border rounded-xl px-3 py-2.5 flex-1 focus-within:border-blue/50 transition-colors">
              <Search size={14} className="text-text3 shrink-0" />
              <input
                type="text"
                placeholder="Search workers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-text placeholder:text-text3 outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-text3 hover:text-text"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto md:overflow-visible pb-0.5 md:pb-0">
              <FilterDropdown
                label={statusLabel}
                active={statusFilter !== "all"}
                options={[
                  { value: "all", label: "All workers" },
                  { value: "active", label: "Active" },
                  { value: "pending", label: "Pending" },
                ]}
                onSelect={(v) => setStatusFilter(v as any)}
              />
              {uniqueSites.length > 0 && (
                <FilterDropdown
                  label={activeSiteFilter}
                  active={activeSiteFilter !== "All projects"}
                  options={siteOptions.map((s) => ({ value: s, label: s }))}
                  onSelect={setActiveSiteFilter}
                />
              )}
            </div>
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden md:block bg-bg2 border border-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Worker",
                    "Occupation",
                    "Project",
                    "Status",
                    "This week",
                    "Last shift",
                  ].map((col) => (
                    <th
                      key={col}
                      className="text-left text-[10px] font-bold text-text3 uppercase tracking-widest px-4 py-3 first:pl-5"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-sm text-text3 py-10"
                    >
                      No workers found
                    </td>
                  </tr>
                ) : (
                  filtered.map((worker: any, i: number) => {
                    const selected = selectedWorker?._id === worker._id;
                    return (
                      <tr
                        key={worker._id}
                        onClick={() => handleWorkerClick(worker)}
                        className={`border-b border-border last:border-b-0 cursor-pointer transition-colors ${
                          selected ? "bg-blue/5" : "hover:bg-bg3"
                        } ${!worker.isActivated ? "opacity-50" : ""}`}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                            >
                              {getInitials(worker.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-text leading-tight">
                                {worker.name}
                              </p>
                              <p className="text-[11px] text-text3 truncate">
                                {worker.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-text">
                          {worker.occupation ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-text">
                          {worker.sites?.[0]?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge isActivated={worker.isActivated} />
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue">
                          —
                        </td>
                        <td className="px-4 py-3 text-sm text-text3">
                          {worker.isActivated ? "—" : "Never"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-border">
              <p className="text-xs text-text3">
                {workers.length} workers · {activeCount} active · {pendingCount}{" "}
                pending
              </p>
            </div>
          </div>

          {/* ── Mobile list ── */}
          <div className="md:hidden flex flex-col gap-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-text3 text-center py-10">
                No workers found
              </p>
            ) : (
              filtered.map((worker: any, i: number) => (
                <button
                  key={worker._id}
                  onClick={() => handleWorkerClick(worker)}
                  className={`w-full text-left flex items-center gap-3 bg-bg2 border border-border rounded-2xl px-4 py-4 transition-colors hover:border-blue/20 ${!worker.isActivated ? "opacity-60" : ""}`}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                  >
                    {getInitials(worker.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text truncate">
                      {worker.name}
                    </p>
                    <p className="text-xs text-text3 truncate">
                      {worker.occupation} ·{" "}
                      {worker.sites?.[0]?.name ?? "No project"}
                    </p>
                  </div>
                  <StatusBadge isActivated={worker.isActivated} />
                </button>
              ))
            )}
            <p className="text-xs text-text3 text-center pt-2">
              {workers.length} workers · {activeCount} active · {pendingCount}{" "}
              pending
            </p>
          </div>
        </div>
      </div>

      {/* Desktop drawer */}
      {selectedWorker && (
        <WorkerDrawer
          worker={selectedWorker}
          onClose={() => setSelectedWorker(null)}
          onRemoved={handleRemoved}
        />
      )}

      {/* Add worker modal */}
      {showAddModal && (
        <AddWorkerModal
          sites={sites}
          onClose={() => setShowAddModal(false)}
          onCreated={() => setShowAddModal(false)}
        />
      )}

      <NavbarManager />
    </div>
  );
};

export default ManagerShowListOfWorkersPage;
