import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, MapPin, Building2 } from "lucide-react";
import { getSites, createSite } from "../api/sites";
import NavbarManager from "../components/NavbarManager";
import Loader from "../components/Loader";
import type { Site } from "../types";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue",
  "bg-green",
  "bg-red",
  "bg-amber-500",
  "bg-purple-500",
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  (name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// ─── WORKER AVATARS ───────────────────────────────────────────────────────────

const WorkerAvatars = ({ workers }: { workers: Site["workers"] }) => {
  const visible = workers.slice(0, 3);
  const extra = workers.length - visible.length;

  return (
    <div className="flex items-center mt-3">
      {visible.map((w, i) => (
        <div
          key={w._id}
          style={{ zIndex: visible.length - i, marginLeft: i === 0 ? 0 : -8 }}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-bg3 border-2 border-white/20 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
        >
          {getInitials(w.name)}
        </div>
      ))}
      {extra > 0 && (
        <div
          style={{ zIndex: 0, marginLeft: -8 }}
          className="w-7 h-7 rounded-full bg-bg2 border border-border ring-2 ring-bg3 flex items-center justify-center text-[10px] font-semibold text-text3"
        >
          +{extra}
        </div>
      )}
    </div>
  );
};

// ─── SITE CARD ────────────────────────────────────────────────────────────────

const SiteCard = ({ site }: { site: Site }) => {
  const navigate = useNavigate();
  const archived = site.status === "archived";
  const statColor = archived ? "text-text3" : "text-blue";

  const stats = [
    { value: "0", label: "On shift" },
    { value: "0h", label: "Today" },
    { value: site.workers.length, label: "Workers" },
  ];

  return (
    <button
      onClick={() => navigate(`/manager/sites/${site._id}`)}
      className={`w-full text-left bg-bg3 border border-border rounded-2xl p-4 ${archived ? "opacity-50" : ""}`}
    >
      <p
        className={`font-bold text-base ${archived ? "text-text3" : "text-text"}`}
      >
        {site.name}
      </p>
      <p className="text-xs text-text3 mt-0.5">{site.address}</p>

      {/* ── Stats row ── */}
      <div className="flex gap-3 mt-3">
        {stats.map(({ value, label }) => (
          <div
            key={label}
            className="flex-1 bg-bg2 rounded-xl py-2 px-3 text-center"
          >
            <p className={`text-base font-bold ${statColor}`}>{value}</p>
            <p className="text-[10px] text-text3 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between mt-1">
        <WorkerAvatars workers={site.workers} />
        {archived ? (
          <span className="text-[10px] font-semibold text-text3 border border-border rounded-full px-2.5 py-1">
            Archived
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-green">
            <span className="w-1.5 h-1.5 rounded-full bg-green inline-block" />
            Active
          </span>
        )}
      </div>
    </button>
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

    if (!name.trim() || !address.trim()) {
      setError("Please fill in all fields");
      return;
    }
    // trim() removes spaces from start and end: "  Block A  " → "Block A"
    // Protects against input that looks empty but isn't: "   " passes !name

    try {
      setLoading(true);
      const res = await createSite({
        name: name.trim(),
        address: address.trim(),
      });
      onCreated(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-bg border-t border-border rounded-t-3xl w-full max-w-sm">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-5">
          <div>
            <h2 className="text-lg font-bold text-text">New Site</h2>
            <p className="text-xs text-text3 mt-0.5">Add a work location</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg3 text-text3 hover:text-text transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 pb-8">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-text3 uppercase tracking-widest px-1">
              Site name
            </label>
            <div className="flex items-center gap-3 bg-bg3 border border-border rounded-2xl px-4 py-3.5 focus-within:border-blue/50 transition-colors">
              <Building2 size={15} className="text-text3 shrink-0" />
              <input
                type="text"
                placeholder="e.g. Manchester City Centre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-transparent text-sm text-text placeholder:text-text3 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-text3 uppercase tracking-widest px-1">
              Address
            </label>
            <div className="flex items-center gap-3 bg-bg3 border border-border rounded-2xl px-4 py-3.5 focus-within:border-blue/50 transition-colors">
              <MapPin size={15} className="text-text3 shrink-0" />
              <input
                type="text"
                placeholder="e.g. 12 King St, Manchester"
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
            {loading ? "Creating..." : "Create Site"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── PAGE ─────────────────────────────────────────────────────────────────────

const ManagerSitePage = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await getSites();
        setSites(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchSites();
  }, []);

  const handleCreated = (newSite: Site) => {
    setSites((prev) => [newSite, ...prev]); //  [1]
    setShowAddSheet(false);
  };

  const activeSites = sites.filter((s) => s.status === "active");
  const archivedSites = sites.filter((s) => s.status === "archived");

  if (!isLoaded) return <Loader />;

  return (
    <div className="min-h-screen bg-bg px-5 pt-14 pb-24">
      <div className="max-w-sm mx-auto">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-text">Sites</h1>
          <button
            onClick={() => setShowAddSheet(true)}
            className="flex items-center gap-1.5 bg-blue rounded-xl px-4 py-2 text-sm font-bold text-white"
          >
            <span className="text-base leading-none">+</span> Add
          </button>
        </div>

        {/* ── Summary ── */}
        {sites.length > 0 && (
          <p className="text-[10px] font-semibold text-text3 uppercase tracking-widest mb-4">
            {activeSites.length} active · {archivedSites.length} archived
          </p>
        )}

        {/* ── Empty state ── */}
        {sites.length === 0 ? (
          <p className="text-sm text-text3 text-center mt-16">
            No sites yet. Tap + Add to create one.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {activeSites.map((site) => (
              <SiteCard key={site._id} site={site} />
            ))}

            {archivedSites.length > 0 && (
              <>
                <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mt-3">
                  Archived
                </p>
                {archivedSites.map((site) => (
                  <SiteCard key={site._id} site={site} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {showAddSheet && (
        <AddSiteSheet
          onClose={() => setShowAddSheet(false)}
          onCreated={handleCreated}
        />
      )}

      <NavbarManager />
    </div>
  );
};

export default ManagerSitePage;

// * ─── FOOTNOTES ────────────────────────────────────────────────────────────────────

// ! [1]
// handleCreated — called after API creates the site successfully.
// Adds the new site to the TOP of the list without refetching from API.
// prev is the old sites array, we spread it after newSite so it appears first.
// [newSite, ...prev] → [new, old1, old2, old3]

// ─── HOW THIS PAGE WORKS ─────────────────────────────────────────────────────
//
// OVERVIEW
// Manager sees all their company sites — active and archived.
// Can tap a site card to open detail, or tap "+ Add" to create a new site.
//
// ── DATA FLOW ────────────────────────────────────────────────────────────────
// On mount → getSites() fetches all sites for this manager's company.
// Sites are split into two arrays:
//   activeSites   → shown first
//   archivedSites → shown below with an "Archived" label
//
// ── STATE ────────────────────────────────────────────────────────────────────
// sites        → all sites from API
// isLoaded     → shows Loader until fetch completes
// showAddSheet → controls whether the bottom sheet modal is visible
//
// ── handleCreated ────────────────────────────────────────────────────────────
// Called after AddSiteSheet successfully creates a site.
// Adds the new site to the TOP of the list without refetching:
//   setSites(prev => [newSite, ...prev])
// Then closes the sheet.
//
// ── SITE CARD ────────────────────────────────────────────────────────────────
// Each card is a button → clicking navigates to /manager/sites/:id
// Archived cards get opacity-50 to look faded.
// Stats row (On shift, Today, Workers) is built from an array and mapped
// to avoid repeating the same JSX block 3 times.
//
// ── WORKER AVATARS ───────────────────────────────────────────────────────────
// Shows first 3 worker avatars overlapping each other.
// If more than 3 workers → shows "+N" bubble for the rest.
// marginLeft: -8 on each avatar after the first creates the overlap effect.
// zIndex counts down so the first avatar sits on top.
//
// ── ADD SITE SHEET ───────────────────────────────────────────────────────────
// A bottom sheet modal (slides up from bottom).
// Built with: fixed overlay (bg-black/70) + white panel on top.
// Clicking the dark overlay calls onClose — closes without saving.
// On submit:
//   1. Validates name and address are not empty
//   2. Calls createSite API
//   3. On success calls onCreated(res.data) → adds to list + closes sheet
//   4. On error shows error message below the form
//
// ── EMPTY STATE ──────────────────────────────────────────────────────────────
// If sites.length === 0 → shows "No sites yet" message instead of the list.
//
// ─────────────────────────────────────────────────────────────────────────────
