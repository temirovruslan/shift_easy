import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, X, Download, Search } from "lucide-react";
import NavbarManager from "../components/NavbarManager";
import Loader from "../components/Loader";
import { getAllShifts } from "../api/shifts";
import { getAllWorkers } from "../api/worker";
import { getSites } from "../api/sites";

const POLL_INTERVAL = 10_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getMondayMidnight = () => {
  const d = new Date();
  const diff = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getMonthWeeks = (): { start: Date; end: Date; label: string }[] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0);
  const firstDay = new Date(year, month, 1);
  const dow = firstDay.getDay();
  const firstMonday = new Date(firstDay);
  firstMonday.setDate(firstDay.getDate() - (dow === 0 ? 6 : dow - 1));
  firstMonday.setHours(0, 0, 0, 0);

  const weeks: { start: Date; end: Date; label: string }[] = [];
  let ws = new Date(firstMonday);
  while (ws <= lastDay) {
    const we = new Date(ws);
    we.setDate(ws.getDate() + 6);
    we.setHours(23, 59, 59, 999);
    const fmt = (d: Date) => `${d.getDate()} ${d.toLocaleDateString("en-GB", { month: "short" })}`;
    const label =
      ws.getMonth() === we.getMonth()
        ? `${ws.getDate()}–${we.getDate()} ${ws.toLocaleDateString("en-GB", { month: "short" })}`
        : `${fmt(ws)} – ${fmt(we)}`;
    weeks.push({ start: new Date(ws), end: new Date(we), label });
    ws.setDate(ws.getDate() + 7);
  }
  return weeks;
};

const getWeekDays = (): Date[] => {
  const monday = getMondayMidnight();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

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
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const abbrevName = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return name;
  return `${parts[0]} ${parts[1][0]}.`;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Picker sheet (mobile) ────────────────────────────────────────────────────

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
  const [search, setSearch] = useState("");

  const visibleOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg border-t border-border rounded-t-3xl w-full max-w-sm px-5 pt-4 pb-10 md:rounded-2xl md:border md:border-border md:pb-6">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <h2 className="text-lg font-bold text-text mb-3">{title}</h2>

        {options.length > 4 && (
          <div className="flex items-center gap-2 bg-bg3 border border-border rounded-2xl px-4 py-3 mb-4 focus-within:border-blue/50 transition-colors">
            <Search size={14} className="text-text3 shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-text placeholder:text-text3 outline-none"
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-text3 hover:text-text">
                <X size={12} />
              </button>
            )}
          </div>
        )}

        <div className="max-h-72 overflow-y-auto pr-1">
          {!search && (
            <button
              onClick={() => setPending(null)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-2 border transition-colors ${
                pending === null ? "bg-blue/10 border-blue/30" : "bg-bg3 border-border"
              }`}
            >
              <span className={`text-sm font-semibold ${pending === null ? "text-blue" : "text-text"}`}>
                {allLabel}
              </span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${pending === null ? "border-blue bg-blue" : "border-border"}`}>
                {pending === null && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          )}

          {visibleOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setPending(opt.id)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl mb-2 border transition-colors ${
                pending === opt.id ? "bg-blue/10 border-blue/30" : "bg-bg3 border-border"
              }`}
            >
              <div className="text-left">
                <p className={`text-sm font-semibold ${pending === opt.id ? "text-blue" : "text-text"}`}>
                  {opt.label}
                </p>
                {opt.sublabel && <p className="text-xs text-text3 mt-0.5">{opt.sublabel}</p>}
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${pending === opt.id ? "border-blue bg-blue" : "border-border"}`}>
                {pending === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          ))}

          {visibleOptions.length === 0 && (
            <p className="text-sm text-text3 text-center py-4">No results</p>
          )}
        </div>

        <button
          onClick={() => { onApply(pending); onClose(); }}
          className="w-full bg-blue rounded-2xl py-4 text-sm font-bold text-white mt-2"
        >
          Apply
        </button>
        <button onClick={onClose} className="w-full text-center text-sm text-text3 mt-3">
          Cancel
        </button>
      </div>
    </div>
  );
};

// ─── Mobile shift row ──────────────────────────────────────────────────────────

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
          <p className="text-sm font-semibold text-text truncate">{shift.site.name}</p>
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
          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${expanded ? "bg-blue/10" : "bg-bg2"}`}>
            {expanded ? <ChevronUp size={12} className="text-blue" /> : <ChevronDown size={12} className="text-text3" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="bg-bg border-t border-border/60 px-4 py-3.5 flex flex-col gap-2.5">
          <div className="flex justify-between text-xs">
            <span className="text-text3">Start</span>
            <span className="text-text font-semibold">{formatTime(shift.startTime)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text3">End</span>
            <span className={`font-semibold text-xs ${shift.endTime ? "text-text" : "text-green"}`}>
              {shift.endTime ? formatTime(shift.endTime) : "Still active"}
            </span>
          </div>
          {shift.notes && (
            <div className="flex justify-between text-xs gap-4">
              <span className="text-text3 shrink-0">Notes</span>
              <span className="text-text font-semibold text-right">{shift.notes}</span>
            </div>
          )}
          {shift.materials && (
            <div className="flex justify-between text-xs gap-4">
              <span className="text-text3 shrink-0">Materials</span>
              <span className="text-text font-semibold text-right">{shift.materials}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Desktop detail drawer ─────────────────────────────────────────────────────

const ShiftDetailDrawer = ({ shift, onClose }: { shift: any; onClose: () => void }) => {
  const isActive = shift.status === "active";
  const elapsed = isActive
    ? Math.floor((Date.now() - new Date(shift.startTime).getTime()) / 60000)
    : shift.duration ?? 0;

  const infoRows = [
    { label: "Start time", value: formatTime(shift.startTime), color: "text-blue" },
    {
      label: "End time",
      value: shift.endTime ? formatTime(shift.endTime) : "Active",
      color: isActive ? "text-green" : "text-text",
    },
    { label: "Duration",  value: formatDuration(elapsed), color: "text-text" },
    { label: "Project",   value: shift.site?.name ?? "—", color: "text-text" },
    ...(shift.materials ? [{ label: "Materials", value: shift.materials, color: "text-text" }] : []),
  ];

  return (
    <div className="hidden md:flex w-80 bg-bg2 border-l border-border flex-col overflow-hidden shrink-0">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <p className="text-sm font-bold text-text">Shift detail</p>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-bg3 flex items-center justify-center hover:bg-border transition-colors"
        >
          <X size={14} className="text-text3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* Worker avatar */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-14 h-14 rounded-full bg-blue flex items-center justify-center text-white font-bold text-lg mb-2">
            {getInitials(shift.worker.name)}
          </div>
          <p className="text-sm font-bold text-text">{shift.worker.name}</p>
          <p className="text-xs text-text3 mt-0.5">
            Worker · {shift.site?.name} ·{" "}
            {new Date(shift.startTime).toLocaleDateString("en-GB", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Duration block */}
        <div className="bg-blue/10 border border-blue/20 rounded-2xl py-4 text-center mb-5">
          <p className="text-3xl font-bold text-blue">{formatDuration(elapsed)}</p>
          <p className="text-xs text-text3 mt-1">
            {formatTime(shift.startTime)} — {shift.endTime ? formatTime(shift.endTime) : "now"}
          </p>
        </div>

        {/* Info rows */}
        <div className="bg-bg3 border border-border rounded-2xl overflow-hidden mb-4">
          {infoRows.map(({ label, value, color }) => (
            <div
              key={label}
              className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border last:border-b-0"
            >
              <span className="text-xs text-text3 shrink-0 pt-px">{label}</span>
              <span className={`text-xs font-semibold text-right ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {shift.notes && (
          <>
            <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-2">Notes</p>
            <div className="bg-bg3 border border-border rounded-2xl px-4 py-3">
              <p className="text-xs text-text leading-relaxed">{shift.notes}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────────

const ManagerShiftsPage = () => {
  // mobile
  const [filter, setFilter] = useState<"today" | "week" | "month" | "year" | "all">("week");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showWorkerPicker, setShowWorkerPicker] = useState(false);
  const [showSitePicker, setShowSitePicker] = useState(false);

  // shared filters
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  // desktop
  const [desktopView, setDesktopView] = useState<"timesheet" | "list">("timesheet");
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [timeFilterOpen, setTimeFilterOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { data: shifts = [], isLoading } = useQuery<any[]>({
    queryKey: ["allShifts"],
    queryFn: async () => { const res = await getAllShifts(); return res.data ?? []; },
    staleTime: 0,
    refetchInterval: POLL_INTERVAL,
  });

  const { data: workers = [] } = useQuery<any[]>({
    queryKey: ["workers"],
    queryFn: async () => { const res = await getAllWorkers(); return res.data ?? []; },
    staleTime: 5 * 60_000,
  });

  const { data: sites = [] } = useQuery<any[]>({
    queryKey: ["sites"],
    queryFn: async () => { const res = await getSites(); return res.data ?? []; },
    staleTime: 5 * 60_000,
  });

  if (isLoading) return <Loader />;

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const monthStart = new Date(todayMidnight);
  monthStart.setDate(1);

  const yearStart = new Date(todayMidnight);
  yearStart.setMonth(0, 1);

  const filterFrom =
    filter === "today" ? todayMidnight :
    filter === "week"  ? getMondayMidnight() :
    filter === "month" ? monthStart :
    filter === "year"  ? yearStart :
    null;

  // ── Mobile filtered list ──
  const filtered = shifts.filter((s) => {
    const d = new Date(s.startTime);
    const timeMatch = !filterFrom || d >= filterFrom;
    const workerMatch = !selectedWorkerId || s.worker._id === selectedWorkerId;
    const siteMatch = !selectedSiteId || s.site._id === selectedSiteId;
    return timeMatch && workerMatch && siteMatch;
  });

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
    ? (workers.find((w) => w._id === selectedWorkerId)?.name ?? "")
    : null;
  const selectedSiteName = selectedSiteId
    ? (sites.find((s) => s._id === selectedSiteId)?.name ?? "")
    : null;

  // ── Desktop timesheet ──
  const weekDays = getWeekDays();

  const weekShifts = shifts.filter((s) => {
    const d = new Date(s.startTime);
    const weekEnd = new Date(weekDays[6].getTime() + 86_400_000);
    const workerMatch = !selectedWorkerId || s.worker._id === selectedWorkerId;
    const siteMatch = !selectedSiteId || s.site._id === selectedSiteId;
    return d >= weekDays[0] && d < weekEnd && workerMatch && siteMatch;
  });

  const timesheetFilterFrom = filterFrom ?? weekDays[0];

  const timesheetWorkers = Array.from(
    new Map(
      weekShifts
        .filter((s) => new Date(s.startTime) >= timesheetFilterFrom)
        .map((s) => [s.worker._id, s.worker])
    ).values(),
  );

  // ── Monthly timesheet data ──
  const monthWeeks = getMonthWeeks();
  const monthlyTimesheetWorkers = Array.from(
    new Map(filtered.map((s) => [s.worker._id, s.worker])).values(),
  );
  const getMonthCellShifts = (workerId: string, ws: Date, we: Date) =>
    filtered.filter((s) => {
      const d = new Date(s.startTime);
      return s.worker._id === workerId && d >= ws && d <= we;
    });
  const getMonthWeekTotal = (ws: Date, we: Date) =>
    filtered
      .filter((s) => { const d = new Date(s.startTime); return d >= ws && d <= we; })
      .reduce((sum, s) =>
        sum + (s.status === "completed" ? (s.duration ?? 0) : Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000)), 0);

  const getShiftsForCell = (workerId: string, day: Date) => {
    const dayEnd = new Date(day.getTime() + 86_400_000);
    return weekShifts.filter(
      (s) =>
        s.worker._id === workerId &&
        new Date(s.startTime) >= day &&
        new Date(s.startTime) < dayEnd,
    );
  };

  const getDayTotal = (day: Date) => {
    const dayEnd = new Date(day.getTime() + 86_400_000);
    return weekShifts
      .filter((s) => new Date(s.startTime) >= day && new Date(s.startTime) < dayEnd)
      .reduce((sum, s) => {
        if (s.status === "completed") return sum + (s.duration ?? 0);
        return sum + Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000);
      }, 0);
  };

  // ── Desktop list ──
  const listShifts = filtered
    .slice()
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const listTotal = listShifts.reduce((sum, s) => {
    if (s.status === "completed") return sum + (s.duration ?? 0);
    return sum + Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000);
  }, 0);

  const filterLabel =
    filter === "today" ? "Today" :
    filter === "week"  ? "This week" :
    filter === "month" ? "This month" :
    filter === "year"  ? "This year" :
    "All time";

  const timesheetFilterOptions = [
    ["today", "Today"],
    ["week",  "This week"],
    ["month", "This month"],
  ] as const;

  const listFilterOptions = [
    ["today", "Today"],
    ["week",  "This week"],
    ["month", "This month"],
    ["year",  "This year"],
    ["all",   "All time"],
  ] as const;

  return (
    <div className="bg-bg min-h-screen pb-24 md:ml-52 md:pb-0 md:h-screen md:flex md:overflow-hidden">

      {/* ── Main content ── */}
      <div className="flex-1 md:overflow-y-auto">
        <div className="px-5 pt-14 md:px-8 md:pt-8 md:pb-8">

          {/* ── Desktop header ── */}
          <div className="hidden md:flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-text">Shifts</h1>
              <div className="flex gap-1 bg-bg3 rounded-xl p-1">
                {(["timesheet", "list"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setDesktopView(v);
                      setSelectedShift(null);
                      if (v === "timesheet" && filter !== "today" && filter !== "week" && filter !== "month") setFilter("week");
                    }}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors capitalize ${
                      desktopView === v ? "bg-blue text-white" : "text-text3 hover:text-text"
                    }`}
                  >
                    {v === "timesheet" ? "Timesheet" : "List"}
                  </button>
                ))}
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity">
              <Download size={14} />
              Export
            </button>
          </div>

          {/* ── Mobile header ── */}
          <div className="md:hidden mb-4">
            <h1 className="text-2xl font-bold text-text">Shifts</h1>
          </div>

          {/* ── Desktop filter row ── */}
          <div className="hidden md:flex items-center gap-2 mb-6">
            {/* Time range dropdown */}
            <div className="relative">
              <button
                onClick={() => setTimeFilterOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  filter !== "week" ? "bg-blue/10 border-blue/40 text-blue" : "bg-bg3 border-border text-text3 hover:border-blue/40 hover:text-blue"
                }`}
              >
                {filterLabel}
                <ChevronDown size={11} className={`transition-transform ${timeFilterOpen ? "rotate-180" : ""}`} />
              </button>
              {timeFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setTimeFilterOpen(false)} />
                  <div className="absolute z-20 top-full mt-1.5 left-0 min-w-36 bg-bg2 border border-border rounded-2xl overflow-hidden shadow-xl">
                    {(desktopView === "timesheet" ? timesheetFilterOptions : listFilterOptions).map(([val, lbl]) => (
                      <button
                        key={val}
                        onClick={() => { setFilter(val); setTimeFilterOpen(false); }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left transition-colors hover:bg-bg3
                          ${filter === val ? "text-blue font-semibold" : "text-text"}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${filter === val ? "bg-blue" : ""}`} />
                        {lbl}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setShowWorkerPicker(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                selectedWorkerId ? "bg-blue/10 border-blue/40 text-blue" : "bg-bg3 border-border text-text3"
              }`}
            >
              {selectedWorkerName ? abbrevName(selectedWorkerName) : "All workers"}
              <ChevronDown size={11} />
            </button>
            <button
              onClick={() => setShowSitePicker(true)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                selectedSiteId ? "bg-blue/10 border-blue/40 text-blue" : "bg-bg3 border-border text-text3"
              }`}
            >
              {selectedSiteName ?? "All projects"}
              <ChevronDown size={11} />
            </button>
          </div>

          {/* ── Mobile filters ── */}
          <div className="md:hidden">
            <div className="flex gap-2 mb-3">
              {/* Time filter dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMobileFilterOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border bg-blue/10 border-blue/40 text-blue"
                >
                  {filterLabel}
                  <ChevronDown size={11} className={`transition-transform ${mobileFilterOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileFilterOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMobileFilterOpen(false)} />
                    <div className="absolute z-20 top-full mt-1.5 left-0 w-40 bg-bg2 border border-border rounded-2xl overflow-hidden shadow-xl">
                      {(["today", "week", "month", "year", "all"] as const).map((key) => {
                        const lbl = key === "today" ? "Today" : key === "week" ? "This week" : key === "month" ? "This month" : key === "year" ? "This year" : "All time";
                        return (
                          <button
                            key={key}
                            onClick={() => { setFilter(key); setMobileFilterOpen(false); }}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left transition-colors hover:bg-bg3 ${filter === key ? "text-blue font-semibold" : "text-text"}`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${filter === key ? "bg-blue" : ""}`} />
                            {lbl}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setShowWorkerPicker(true)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  selectedWorkerId ? "bg-blue/10 border-blue/40 text-blue" : "bg-bg3 border-border text-text3"
                }`}
              >
                {selectedWorkerName ? abbrevName(selectedWorkerName) : "All workers"}
                <ChevronDown size={11} />
              </button>
              <button
                onClick={() => setShowSitePicker(true)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  selectedSiteId ? "bg-blue/10 border-blue/40 text-blue" : "bg-bg3 border-border text-text3"
                }`}
              >
                {selectedSiteName ?? "All projects"}
                <ChevronDown size={11} />
              </button>
            </div>
          </div>

          {/* ── Desktop timesheet ── */}
          {desktopView === "timesheet" && (
            <div className="hidden md:block">

              {/* ── Monthly view ── */}
              {filter === "month" && (
                <div className="bg-bg3 border border-border rounded-2xl overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-xs font-semibold text-text3 w-44">Worker</th>
                        {monthWeeks.map((week) => (
                          <th key={week.start.toISOString()} className="px-2 py-3 text-xs font-semibold text-center text-text3 whitespace-nowrap">
                            {week.label}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-xs font-semibold text-right text-blue">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyTimesheetWorkers.length === 0 ? (
                        <tr>
                          <td colSpan={monthWeeks.length + 2} className="px-4 py-10 text-center text-sm text-text3">
                            No shifts this month
                          </td>
                        </tr>
                      ) : (
                        monthlyTimesheetWorkers.map((worker) => {
                          const workerTotal = filtered
                            .filter((s) => s.worker._id === worker._id)
                            .reduce((sum, s) => sum + (s.status === "completed" ? (s.duration ?? 0) : Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000)), 0);
                          return (
                            <tr key={worker._id} className="border-b border-border last:border-b-0">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-blue flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                    {getInitials(worker.name)}
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-text leading-tight">{abbrevName(worker.name)}</p>
                                    <p className="text-[10px] text-text3">Worker</p>
                                  </div>
                                </div>
                              </td>
                              {monthWeeks.map((week) => {
                                const cellShifts = getMonthCellShifts(worker._id, week.start, week.end);
                                const totalMins = cellShifts.reduce((sum, s) =>
                                  sum + (s.status === "completed" ? (s.duration ?? 0) : Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000)), 0);
                                const hasActive = cellShifts.some((s) => s.status === "active");
                                return (
                                  <td key={week.start.toISOString()} className="px-2 py-3 text-center">
                                    {totalMins === 0 ? (
                                      <span className="text-text3 text-xs">—</span>
                                    ) : (
                                      <div className={`rounded-xl px-2 py-1.5 inline-block ${hasActive ? "bg-green/10" : "bg-bg2"}`}>
                                        <p className={`text-xs font-bold flex items-center gap-1 ${hasActive ? "text-green" : "text-text"}`}>
                                          {formatDuration(totalMins)}
                                          {hasActive && <span className="w-1 h-1 rounded-full bg-green animate-pulse" />}
                                        </p>
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm font-bold text-blue">{formatDuration(workerTotal)}</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                      {monthlyTimesheetWorkers.length > 0 && (
                        <tr className="border-t border-border bg-bg2/40">
                          <td className="px-4 py-3 text-xs font-semibold text-text3">Total</td>
                          {monthWeeks.map((week) => {
                            const mins = getMonthWeekTotal(week.start, week.end);
                            return (
                              <td key={week.start.toISOString()} className="px-2 py-3 text-center text-xs font-bold">
                                {mins > 0 ? <span className="text-text">{formatDuration(mins)}</span> : <span className="text-text3">—</span>}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-right text-xs font-bold text-blue">
                            {formatDuration(filtered.reduce((sum, s) =>
                              sum + (s.status === "completed" ? (s.duration ?? 0) : Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000)), 0))}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── Weekly / Today view ── */}
              {filter !== "month" && (
              <div className="bg-bg3 border border-border rounded-2xl overflow-auto">
                <table className="w-full min-w-175 text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-xs font-semibold text-text3 w-44">Worker</th>
                      {weekDays.map((day, i) => {
                        const isToday = day.toDateString() === todayMidnight.toDateString();
                        return (
                          <th
                            key={i}
                            className={`px-2 py-3 text-xs font-semibold text-center ${isToday ? "text-blue" : "text-text3"}`}
                          >
                            {DAY_LABELS[i]} {day.getDate()}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {timesheetWorkers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-sm text-text3">
                          No shifts this week
                        </td>
                      </tr>
                    ) : (
                      timesheetWorkers.map((worker) => (
                        <tr key={worker._id} className="border-b border-border last:border-b-0">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-blue flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                {getInitials(worker.name)}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-text leading-tight">{abbrevName(worker.name)}</p>
                                <p className="text-[10px] text-text3">Worker</p>
                              </div>
                            </div>
                          </td>
                          {weekDays.map((day, i) => {
                            const cellShifts = getShiftsForCell(worker._id, day);
                            const isToday = day.toDateString() === todayMidnight.toDateString();
                            if (cellShifts.length === 0) {
                              return (
                                <td key={i} className={`px-2 py-3 text-center ${isToday ? "bg-blue/3" : ""}`}>
                                  <span className="text-text3 text-xs">—</span>
                                </td>
                              );
                            }
                            const totalMins = cellShifts.reduce((sum, s) => {
                              if (s.status === "completed") return sum + (s.duration ?? 0);
                              return sum + Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000);
                            }, 0);
                            const firstShift = cellShifts[0];
                            const hasActive = cellShifts.some((s) => s.status === "active");
                            return (
                              <td
                                key={i}
                                className={`px-1.5 py-2 cursor-pointer ${isToday ? "bg-blue/3" : ""}`}
                                onClick={() => setSelectedShift((prev: any) => prev?._id === firstShift._id ? null : firstShift)}
                              >
                                <div
                                  className={`rounded-xl px-2 py-2 hover:opacity-80 transition-opacity text-center ${
                                    selectedShift?._id === firstShift._id
                                      ? "ring-2 ring-blue/40"
                                      : ""
                                  } ${
                                    hasActive ? "bg-green/10" : isToday ? "bg-blue/10" : "bg-bg2"
                                  }`}
                                >
                                  <p className={`text-xs font-bold leading-tight flex items-center justify-center gap-1 ${hasActive ? "text-green" : isToday ? "text-blue" : "text-text"}`}>
                                    {formatDuration(totalMins)}
                                    {hasActive && <span className="w-1 h-1 rounded-full bg-green animate-pulse" />}
                                  </p>
                                  <p className="text-[10px] text-text3 mt-0.5 leading-tight">
                                    {formatTime(firstShift.startTime)}–{firstShift.endTime ? formatTime(firstShift.endTime) : "now"}
                                  </p>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                    {timesheetWorkers.length > 0 && (
                      <tr className="border-t border-border bg-bg2/40">
                        <td className="px-4 py-3 text-xs font-semibold text-text3">Total</td>
                        {weekDays.map((day, i) => {
                          const mins = getDayTotal(day);
                          const isToday = day.toDateString() === todayMidnight.toDateString();
                          return (
                            <td
                              key={i}
                              className={`px-2 py-3 text-center text-xs font-bold ${
                                isToday ? "text-blue" : mins > 0 ? "text-text" : "text-text3"
                              }`}
                            >
                              {mins > 0 ? formatDuration(mins) : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              )}

            </div>
          )}

          {/* ── Desktop list ── */}
          {desktopView === "list" && (
            <div className="hidden md:block">
              <div className="bg-bg3 border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-xs font-semibold text-text3">Worker</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text3">Date ↓</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text3">Time</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text3">Notes</th>
                      <th className="px-4 py-3 text-xs font-semibold text-text3 text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listShifts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-text3">
                          No shifts for this period
                        </td>
                      </tr>
                    ) : (
                      listShifts.map((s) => {
                        const isActive = s.status === "active";
                        const elapsed = isActive
                          ? Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000)
                          : s.duration ?? 0;
                        const isSelected = selectedShift?._id === s._id;
                        return (
                          <tr
                            key={s._id}
                            className={`border-b border-border last:border-b-0 cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-blue/5"
                                : isActive
                                  ? "bg-green/3 hover:bg-green/5"
                                  : "hover:bg-bg2/50"
                            }`}
                            onClick={() => setSelectedShift((prev: any) => prev?._id === s._id ? null : s)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-blue flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                  {getInitials(s.worker.name)}
                                </div>
                                <p className="text-sm font-semibold text-text">{abbrevName(s.worker.name)}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-text3">
                              {new Date(s.startTime).toLocaleDateString("en-GB", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </td>
                            <td className="px-4 py-3 text-sm text-text3">
                              {formatTime(s.startTime)} – {s.endTime ? formatTime(s.endTime) : "now"}
                            </td>
                            <td className="px-4 py-3 text-sm text-text3 max-w-xs">
                              <span className="truncate block max-w-48">{s.notes ?? "—"}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`text-sm font-bold ${isActive ? "text-green" : "text-blue"}`}>
                                {formatDuration(elapsed)}
                              </span>
                              {isActive && (
                                <span className="inline-block ml-1.5 w-1.5 h-1.5 rounded-full bg-green align-middle animate-pulse" />
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                {listShifts.length > 0 && (
                  <div className="border-t border-border px-4 py-3 flex items-center justify-between">
                    <p className="text-xs text-text3">
                      {listShifts.length} shift{listShifts.length !== 1 ? "s" : ""}
                      {selectedWorkerName && ` · ${selectedWorkerName}`}
                    </p>
                    <p className="text-xs font-bold text-text">Total: {formatDuration(listTotal)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Mobile: stats + grouped list ── */}
          <div className="md:hidden">
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className={`border rounded-xl px-3 py-3 transition-colors ${onShift > 0 ? "bg-green/4 border-green/25" : "bg-bg3 border-border"}`}>
                <p className={`text-lg font-bold leading-tight truncate ${onShift > 0 ? "text-green" : "text-text"}`}>{onShift}</p>
                <p className="text-[10px] text-text3 font-medium mt-1">On shift</p>
              </div>
              <div className="bg-bg3 border border-border rounded-xl px-3 py-3">
                <p className="text-lg font-bold text-blue leading-tight truncate">{formatDuration(todayMinutes)}</p>
                <p className="text-[10px] text-text3 font-medium mt-1">Today</p>
              </div>
              <div className="bg-bg3 border border-border rounded-xl px-3 py-3">
                <p className="text-lg font-bold text-text leading-tight truncate">{formatDuration(weekMinutes)}</p>
                <p className="text-[10px] text-text3 font-medium mt-1">{filterLabel}</p>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-text3 text-xs">{filtered.length} shift{filtered.length !== 1 ? "s" : ""}</p>
            </div>

            {filtered.length === 0 && (
              <p className="text-center text-text3 text-sm mt-12">No shifts for this period</p>
            )}

            {grouped.map((group) => (
              <div key={`${group.worker._id}_${group.date}`} className="mb-4">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${group.shifts.some((s) => s.status === "active") ? "bg-blue ring-2 ring-blue/20" : "bg-text3/60"}`}>
                    {getInitials(group.worker.name)}
                  </div>
                  <p className="text-[11px] font-bold text-text3 uppercase tracking-wider">
                    {group.worker.name.split(" ")[0]} — {formatGroupDate(group.date)}
                  </p>
                </div>
                {group.shifts.map((s) => (
                  <ShiftRow
                    key={s._id}
                    shift={s}
                    expanded={expandedId === s._id}
                    onToggle={() => setExpandedId(expandedId === s._id ? null : s._id)}
                  />
                ))}
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Detail drawer ── */}
      {selectedShift && (
        <ShiftDetailDrawer shift={selectedShift} onClose={() => setSelectedShift(null)} />
      )}

      <NavbarManager />

      {showWorkerPicker && (
        <PickerSheet
          title="Select worker"
          allLabel="All workers"
          options={workers.map((w) => ({ id: w._id, label: w.name }))}
          selected={selectedWorkerId}
          onApply={setSelectedWorkerId}
          onClose={() => setShowWorkerPicker(false)}
        />
      )}
      {showSitePicker && (
        <PickerSheet
          title="Select project"
          allLabel="All projects"
          options={sites.map((s) => ({ id: s._id, label: s.name }))}
          selected={selectedSiteId}
          onApply={setSelectedSiteId}
          onClose={() => setShowSitePicker(false)}
        />
      )}
    </div>
  );
};

export default ManagerShiftsPage;
