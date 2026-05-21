import { useEffect, useState, useCallback } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import NavbarManager from "../components/NavbarManager";
import Loader from "../components/Loader";
import { getAllShifts } from "../api/shifts";
import { getAllWorkers } from "../api/worker";
import { getSites } from "../api/sites";

const POLL_INTERVAL = 30_000;

const getMondayMidnight = () => {
  const d = new Date();
  const diff = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatGroupDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dayMonth = d
    .toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    .toUpperCase();
  if (d >= today) return `TODAY, ${dayMonth}`;
  if (d >= yesterday) return `YESTERDAY, ${dayMonth}`;
  return dayMonth;
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const abbrevName = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return name;
  return `${parts[0]} ${parts[1][0]}.`;
};

// ─── Picker bottom sheet ──────────────────────────────────────────────────────

const PickerSheet = ({
  title,
  allLabel,
  options,
  selected,
  onApply,
  onClose,
}: {
  title: string;
  allLabel: string;
  options: { id: string; label: string; sublabel?: string }[];
  selected: string | null;
  onApply: (id: string | null) => void;
  onClose: () => void;
}) => {
  const [pending, setPending] = useState(selected);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-bg border-t border-border rounded-t-3xl w-full max-w-sm px-5 pt-4 pb-10">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <h2 className="text-lg font-bold text-text mb-4">{title}</h2>

        <button
          onClick={() => setPending(null)}
          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-2 border transition-colors ${
            pending === null
              ? "bg-blue/10 border-blue/30"
              : "bg-bg3 border-border"
          }`}
        >
          <span
            className={`text-sm font-semibold ${pending === null ? "text-blue" : "text-text"}`}
          >
            {allLabel}
          </span>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              pending === null ? "border-blue bg-blue" : "border-border"
            }`}
          >
            {pending === null && (
              <div className="w-2 h-2 rounded-full bg-white" />
            )}
          </div>
        </button>

        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setPending(opt.id)}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-2 border transition-colors ${
              pending === opt.id
                ? "bg-blue/10 border-blue/30"
                : "bg-bg3 border-border"
            }`}
          >
            <div className="text-left">
              <p
                className={`text-sm font-semibold ${pending === opt.id ? "text-blue" : "text-text"}`}
              >
                {opt.label}
              </p>
              {opt.sublabel && (
                <p className="text-xs text-text3 mt-0.5">{opt.sublabel}</p>
              )}
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                pending === opt.id ? "border-blue bg-blue" : "border-border"
              }`}
            >
              {pending === opt.id && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
          </button>
        ))}

        <button
          onClick={() => {
            onApply(pending);
            onClose();
          }}
          className="w-full bg-blue rounded-2xl py-4 text-sm font-bold text-white mt-2"
        >
          Apply
        </button>
        <button
          onClick={onClose}
          className="w-full text-center text-sm text-text3 mt-3"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ─── Shift row ────────────────────────────────────────────────────────────────

const ShiftRow = ({
  shift,
  expanded,
  onToggle,
}: {
  shift: any;
  expanded: boolean;
  onToggle: () => void;
}) => {
  const isActive = shift.status === "active";

  return (
    <div
      className={`rounded-2xl overflow-hidden mb-2 cursor-pointer border transition-colors ${
        isActive ? "bg-green/4 border-green/25" : "bg-bg3 border-border"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text truncate">
            {shift.site.name}
          </p>
          <p className="text-xs text-text3 mt-0.5">
            {formatTime(shift.startTime)}
            {shift.endTime ? ` — ${formatTime(shift.endTime)}` : " — now"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isActive ? (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-green/15 text-green flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              Live
            </span>
          ) : (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-bg2 text-text3 border border-border">
              {formatDuration(shift.duration)}
            </span>
          )}
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${expanded ? "bg-blue/10" : "bg-bg2"}`}
          >
            {expanded ? (
              <ChevronUp size={12} className="text-blue" />
            ) : (
              <ChevronDown size={12} className="text-text3" />
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="bg-bg border-t border-border/60 px-4 py-3.5 flex flex-col gap-2.5">
          <div className="flex justify-between text-xs">
            <span className="text-text3">Start</span>
            <span className="text-text font-semibold">
              {formatTime(shift.startTime)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text3">End</span>
            <span
              className={`font-semibold text-xs ${shift.endTime ? "text-text" : "text-green"}`}
            >
              {shift.endTime ? formatTime(shift.endTime) : "Still active"}
            </span>
          </div>
          {shift.notes && (
            <div className="flex justify-between text-xs gap-4">
              <span className="text-text3 shrink-0">Notes</span>
              <span className="text-text font-semibold text-right">
                {shift.notes}
              </span>
            </div>
          )}
          {shift.materials && (
            <div className="flex justify-between text-xs gap-4">
              <span className="text-text3 shrink-0">Materials</span>
              <span className="text-text font-semibold text-right">
                {shift.materials}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const ManagerShiftsPage = () => {
  const [shifts, setShifts] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filter, setFilter] = useState<"today" | "week" | "all">("today");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [showWorkerPicker, setShowWorkerPicker] = useState(false);
  const [showSitePicker, setShowSitePicker] = useState(false);

  const fetchShifts = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await getAllShifts();
      setShifts(res.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
    getAllWorkers().then((res) => setWorkers(res.data));
    getSites().then((res) => setSites(res.data));
    const interval = setInterval(() => fetchShifts(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchShifts]);

  const formatLastUpdated = () => {
    if (!lastUpdated) return "";
    const sec = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (sec < 60) return `Updated ${sec}s ago`;
    return `Updated ${Math.floor(sec / 60)}m ago`;
  };

  if (loading) return <Loader />;

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const uniqueWorkers = workers;
  const uniqueSites = sites;

  const filtered = shifts.filter((s) => {
    const d = new Date(s.startTime);
    const timeMatch =
      filter === "today"
        ? d >= todayMidnight
        : filter === "week"
          ? d >= getMondayMidnight()
          : true;
    const workerMatch = !selectedWorkerId || s.worker._id === selectedWorkerId;
    const siteMatch = !selectedSiteId || s.site._id === selectedSiteId;
    return timeMatch && workerMatch && siteMatch;
  });

  // Stats respect the worker/site filter but not the time pill
  const statsBase = shifts.filter((s) => {
    const workerMatch = !selectedWorkerId || s.worker._id === selectedWorkerId;
    const siteMatch = !selectedSiteId || s.site._id === selectedSiteId;
    return workerMatch && siteMatch;
  });

  const onShift = statsBase.filter((s) => s.status === "active").length;

  const sumMinutes = (from: Date) =>
    statsBase
      .filter((s) => new Date(s.startTime) >= from)
      .reduce((sum, s) => {
        if (s.status === "completed") return sum + (s.duration ?? 0);
        return sum + Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000);
      }, 0);

  const todayMinutes = sumMinutes(todayMidnight);
  const weekMinutes = sumMinutes(getMondayMidnight());

  const grouped = Object.values(
    filtered.reduce(
      (acc: Record<string, { worker: any; date: string; shifts: any[] }>, s) => {
        const localDate = new Date(s.startTime).toLocaleDateString("en-GB");
        const key = `${s.worker._id}_${localDate}`;
        if (!acc[key]) acc[key] = { worker: s.worker, date: s.startTime, shifts: [] };
        acc[key].shifts.push(s);
        return acc;
      },
      {},
    ),
  );

  const selectedWorkerName = selectedWorkerId
    ? (uniqueWorkers.find((w) => w._id === selectedWorkerId)?.name ?? "")
    : null;
  const selectedSiteName = selectedSiteId
    ? (uniqueSites.find((s) => s._id === selectedSiteId)?.name ?? "")
    : null;

  return (
    <div className="min-h-screen bg-bg px-5 pt-14 pb-24">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-text">Shifts</h1>
          <button
            onClick={() => fetchShifts()}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Time filter pills */}
        <div className="flex gap-2 mb-3">
          {(["today", "week", "all"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filter === key
                  ? "bg-blue text-white"
                  : "bg-bg3 border border-border text-text3"
              }`}
            >
              {key === "today"
                ? "Today"
                : key === "week"
                  ? "This week"
                  : "All time"}
            </button>
          ))}
        </div>

        {/* Worker + site pickers */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setShowWorkerPicker(true)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              selectedWorkerId
                ? "bg-blue/10 border-blue/40 text-blue"
                : "bg-bg3 border-border text-text3"
            }`}
          >
            {selectedWorkerName
              ? abbrevName(selectedWorkerName)
              : "All workers"}
            <ChevronDown size={11} />
          </button>
          <button
            onClick={() => setShowSitePicker(true)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              selectedSiteId
                ? "bg-blue/10 border-blue/40 text-blue"
                : "bg-bg3 border-border text-text3"
            }`}
          >
            {selectedSiteName ?? "All sites"}
            <ChevronDown size={11} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div
            className={`border rounded-2xl px-3 py-4 flex flex-col items-center transition-colors ${
              onShift > 0
                ? "bg-green/4 border-green/25"
                : "bg-bg3 border-border"
            }`}
          >
            <p
              className={`text-2xl font-bold ${onShift > 0 ? "text-green" : "text-text"}`}
            >
              {onShift}
            </p>
            <p className="text-[10px] text-text3 font-medium mt-1">On shift</p>
          </div>
          <div className="bg-bg3 border border-border rounded-2xl px-3 py-4 flex flex-col items-center">
            <p className="text-2xl font-bold text-blue">
              {formatDuration(todayMinutes)}
            </p>
            <p className="text-[10px] text-text3 font-medium mt-1">Today</p>
          </div>
          <div className="bg-bg3 border border-border rounded-2xl px-3 py-4 flex flex-col items-center">
            <p className="text-2xl font-bold text-text">
              {formatDuration(weekMinutes)}
            </p>
            <p className="text-[10px] text-text3 font-medium mt-1">This week</p>
          </div>
        </div>

        {/* Count + last updated */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-text3 text-xs">
            {filtered.length} shift{filtered.length !== 1 ? "s" : ""}
          </p>
          <p className="text-text3 text-xs">{formatLastUpdated()}</p>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <p className="text-center text-text3 text-sm mt-12">
            No shifts for this period
          </p>
        )}

        {/* Grouped shift list */}
        {grouped.map((group) => (
          <div key={group.worker._id} className="mb-4">
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                  group.shifts.some((s) => s.status === "active")
                    ? "bg-blue ring-2 ring-blue/20"
                    : "bg-text3/60"
                }`}
              >
                {getInitials(group.worker.name)}
              </div>
              <p className="text-[11px] font-bold text-text3 uppercase tracking-wider">
                {group.worker.name.split(" ")[0]} —{" "}
                {formatGroupDate(group.date)}
              </p>
            </div>
            {group.shifts.map((s) => (
              <ShiftRow
                key={s._id}
                shift={s}
                expanded={expandedId === s._id}
                onToggle={() =>
                  setExpandedId(expandedId === s._id ? null : s._id)
                }
              />
            ))}
          </div>
        ))}
      </div>

      <NavbarManager />

      {/* Worker picker sheet */}
      {showWorkerPicker && (
        <PickerSheet
          title="Select worker"
          allLabel="All workers"
          options={uniqueWorkers.map((w) => ({ id: w._id, label: w.name }))}
          selected={selectedWorkerId}
          onApply={setSelectedWorkerId}
          onClose={() => setShowWorkerPicker(false)}
        />
      )}

      {/* Site picker sheet */}
      {showSitePicker && (
        <PickerSheet
          title="Select site"
          allLabel="All sites"
          options={uniqueSites.map((s) => ({ id: s._id, label: s.name }))}
          selected={selectedSiteId}
          onApply={setSelectedSiteId}
          onClose={() => setShowSitePicker(false)}
        />
      )}
    </div>
  );
};

export default ManagerShiftsPage;
