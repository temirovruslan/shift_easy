import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import { getMyShift } from "../api/shifts";
import type { Shift } from "../types";
import Loader from "../components/Loader";
import { ChevronDown } from "lucide-react";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");

const today = new Date();

const getMondayMidnight = () => {
  const d = new Date();
  const diff = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

const totalMinutes = (shifts: Shift[]) =>
  shifts.reduce((acc, s) => acc + (s.duration || 0), 0);

const avgMinutes = (shifts: Shift[]) =>
  shifts.length > 0 ? Math.round(totalMinutes(shifts) / shifts.length) : 0;

const toHours = (minutes: number) => Math.floor(minutes / 60);
const toMins = (minutes: number) => Math.round(minutes % 60);

const durationPct = (duration: number) =>
  Math.min(Math.round((duration / 480) * 100), 100);

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const ShiftDetail = ({ shift }: { shift: Shift }) => (
  <div className="flex flex-col gap-2.5">
    <div className="flex justify-between">
      <span className="text-xs text-text3">Time</span>
      <span className="text-xs font-semibold text-text">
        {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
      </span>
    </div>
    <div className="flex justify-between">
      <span className="text-xs text-text3">Site</span>
      <span className="text-xs font-semibold text-blue">
        {shift.site?.name}
      </span>
    </div>
    {shift.materials && (
      <div className="flex justify-between">
        <span className="text-xs text-text3">Materials</span>
        <span className="text-xs font-semibold text-text">
          {shift.materials}
        </span>
      </div>
    )}
    {shift.notes && (
      <p className="text-xs text-text2 mt-1 leading-relaxed">{shift.notes}</p>
    )}
  </div>
);

const DurationLabel = ({ duration }: { duration: number }) => (
  <div className="text-right w-10">
    <p className="text-sm font-bold text-blue leading-tight">
      {toHours(duration)}h
    </p>
    {toMins(duration) > 0 && (
      <p className="text-xs font-bold text-red leading-tight">
        {toMins(duration)}m
      </p>
    )}
  </div>
);

const ProgressBar = ({
  duration,
  width = "w-16",
}: {
  duration: number;
  width?: string;
}) => (
  <div
    className={`${width} h-0.5 bg-border rounded-full overflow-hidden shrink-0`}
  >
    <div
      className="h-full bg-blue rounded-full"
      style={{ width: `${durationPct(duration)}%` }}
    />
  </div>
);

// ─── PAGE ─────────────────────────────────────────────────────────────────────

const TABS = ["This week", "Month", "All time"];

const WorkerHistoryPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const res = await getMyShift();
        setAllShifts(res.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchShifts();
  }, []);

  if (!isLoaded) return <Loader />;

  const completedShifts = allShifts.filter((s) => s.status === "completed");

  const weeklyShifts = completedShifts.filter(
    (s) => new Date(s.startTime) >= getMondayMidnight(),
  );
  const monthlyShifts = completedShifts.filter((s) => {
    const d = new Date(s.startTime);
    return (
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });

  const shiftsForTab =
    activeTab === 0
      ? weeklyShifts
      : activeTab === 1
        ? monthlyShifts
        : completedShifts;

  const tabTotalMinutes = totalMinutes(shiftsForTab);
  const tabShiftCount = shiftsForTab.length;
  const tabAvgMinutes = avgMinutes(shiftsForTab);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(getMondayMidnight());
    d.setDate(d.getDate() + i);
    return d;
  });

  // ── All time: group completed shifts by month (last 12 months) ──
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const shiftsByMonth: Record<string, { label: string; shifts: Shift[] }> = {};
  completedShifts
    .filter((s) => new Date(s.startTime) >= oneYearAgo)
    .forEach((s) => {
      const d = new Date(s.startTime);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      if (!shiftsByMonth[monthKey])
        shiftsByMonth[monthKey] = {
          label: d.toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
          }),
          shifts: [],
        };
      shiftsByMonth[monthKey].shifts.push(s);
    });

  const sortedMonthKeys = Object.keys(shiftsByMonth).sort((a, b) => {
    const [ay, am] = a.split("-").map(Number);
    const [by, bm] = b.split("-").map(Number);
    return by !== ay ? by - ay : bm - am;
  });

  return (
    <div className="min-h-screen bg-bg px-5 pt-14 pb-20">
      <div className="max-w-sm mx-auto">
        {/* ── Header ── */}
        <h2 className="text-2xl font-bold text-text tracking-tight mb-5">
          My shifts
        </h2>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-5">
          {TABS.map((label, i) => (
            <button
              key={label}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === i
                  ? "bg-blue text-white"
                  : "bg-bg3 text-text2 border border-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-bg3 border border-border rounded-2xl p-4">
            <p className="text-xl font-bold text-blue">
              {toHours(tabTotalMinutes)}h
            </p>
            <p className="text-xs text-text2 mt-1">Total hours</p>
          </div>
          <div className="bg-bg3 border border-border rounded-2xl p-4">
            <p className="text-xl font-bold text-text">{tabShiftCount}</p>
            <p className="text-xs text-text2 mt-1">Shifts</p>
          </div>
          <div className="bg-bg3 border border-border rounded-2xl p-4">
            <p className="text-xl font-bold text-blue">
              {toHours(tabAvgMinutes)}h{" "}
              <span className="text-red">{toMins(tabAvgMinutes)}m</span>
            </p>
            <p className="text-xs text-text2 mt-1">Avg shift</p>
          </div>
        </div>

        {/* ── Shift list ── */}
        {activeTab === 0 ? (
          // ── This week: all 7 days Mon→Sun ──────────────────────────────────
          <div className="flex flex-col">
            {weekDays.map((day) => {
              const shift = weeklyShifts.find(
                (s) =>
                  new Date(s.startTime).toDateString() === day.toDateString(),
              );
              const isToday = day.toDateString() === today.toDateString();
              const isOpen = !!shift && selectedShift?._id === shift._id;

              return (
                <div
                  key={day.toISOString()}
                  className={
                    isOpen
                      ? "border border-blue/30 rounded-2xl overflow-hidden mb-2 bg-blue/10"
                      : "border-b border-border mb-2"
                  }
                >
                  <button
                    onClick={() =>
                      shift && setSelectedShift(isOpen ? null : shift)
                    }
                    className="flex items-center py-3 w-full text-left px-3"
                  >
                    <div className="flex-1">
                      <p
                        className={`text-sm font-semibold ${shift ? "text-text" : "text-text3"}`}
                      >
                        {day.toLocaleDateString("en-GB", { weekday: "long" })}
                        {isToday && (
                          <span className="text-xs text-blue ml-2">Today</span>
                        )}
                      </p>
                      <p className="text-xs text-text3 mt-0.5">
                        {day.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div className="mx-4">
                      <ProgressBar duration={shift?.duration ?? 0} />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {shift ? (
                        <DurationLabel duration={shift.duration} />
                      ) : (
                        <span className="text-sm text-text3 w-10 text-right">
                          —
                        </span>
                      )}
                      {shift && (
                        <ChevronDown
                          size={16}
                          className={`text-text3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      )}
                    </div>
                  </button>

                  {isOpen && shift && (
                    <div className="bg-bg2 mx-3 mb-3 rounded-xl px-4 py-3">
                      <ShiftDetail shift={shift} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : activeTab === 2 ? (
          // ── All time: grouped by month ──────────────────────────────────────
          sortedMonthKeys.length === 0 ? (
            <p className="text-sm text-text3 text-center mt-10">
              No shifts yet
            </p>
          ) : (
            <div className="flex flex-col">
              {sortedMonthKeys.map((monthKey) => {
                const { label, shifts: monthShifts } = shiftsByMonth[monthKey];
                const isMonthOpen = selectedMonthKey === monthKey;
                const monthTotalMinutes = totalMinutes(monthShifts);

                return (
                  <div
                    key={monthKey}
                    className={
                      isMonthOpen
                        ? "border border-blue/30 rounded-2xl overflow-hidden mb-2 bg-blue/10"
                        : "border-b border-border"
                    }
                  >
                    <button
                      onClick={() =>
                        setSelectedMonthKey(isMonthOpen ? null : monthKey)
                      }
                      className="flex items-center py-3 w-full text-left px-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text">
                          {label}
                        </p>
                        <p className="text-xs text-text3 mt-0.5">
                          {monthShifts.length} shifts
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right w-12">
                          <p className="text-sm font-bold text-blue leading-tight">
                            {toHours(monthTotalMinutes)}h
                          </p>
                          {toMins(monthTotalMinutes) > 0 && (
                            <p className="text-xs font-bold text-red leading-tight">
                              {toMins(monthTotalMinutes)}m
                            </p>
                          )}
                        </div>
                        <ChevronDown
                          size={16}
                          className={`text-text3 transition-transform ${isMonthOpen ? "rotate-180" : ""}`}
                        />
                      </div>
                    </button>

                    {isMonthOpen && (
                      <div className="mx-3 mb-3 flex flex-col">
                        {monthShifts.map((shift) => {
                          const isOpen = selectedShift?._id === shift._id;
                          return (
                            <div
                              key={shift._id}
                              className={
                                isOpen
                                  ? "border border-blue/30 rounded-2xl overflow-hidden mb-1 mt-2 bg-blue/5"
                                  : "border-b border-border/50"
                              }
                            >
                              <button
                                onClick={() =>
                                  setSelectedShift(isOpen ? null : shift)
                                }
                                className="flex items-center py-2.5 w-full text-left px-2"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-text">
                                    {formatDate(shift.startTime)}
                                  </p>
                                  <p className="text-xs text-text2 mt-0.5">
                                    {formatTime(shift.startTime)}–
                                    {formatTime(shift.endTime)} ·{" "}
                                    {shift.site?.name}
                                  </p>
                                </div>
                                <div className="mx-3">
                                  <ProgressBar
                                    duration={shift.duration}
                                    width="w-12"
                                  />
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <DurationLabel duration={shift.duration} />
                                  <ChevronDown
                                    size={16}
                                    className={`text-text3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                  />
                                </div>
                              </button>
                              {isOpen && (
                                <div className="bg-bg2 mx-2 mb-2 rounded-xl px-4 py-3">
                                  <ShiftDetail shift={shift} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : monthlyShifts.length === 0 ? (
          <p className="text-sm text-text3 text-center mt-10">No shifts yet</p>
        ) : (
          // ── Month: flat list of this month's shifts ─────────────────────────
          <div className="flex flex-col">
            {monthlyShifts.map((shift) => {
              const isOpen = selectedShift?._id === shift._id;
              return (
                <div
                  key={shift._id}
                  className={
                    isOpen
                      ? "border border-blue/30 rounded-2xl overflow-hidden mb-2 bg-blue/10"
                      : "border-b border-border mb-2"
                  }
                >
                  <button
                    onClick={() => setSelectedShift(isOpen ? null : shift)}
                    className="flex items-center py-3 w-full text-left px-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text">
                        {formatDate(shift.startTime)}
                      </p>
                      <p className="text-xs text-text2 mt-0.5">
                        {formatTime(shift.startTime)}–
                        {formatTime(shift.endTime)} · {shift.site?.name}
                      </p>
                    </div>
                    <div className="mx-4">
                      <ProgressBar duration={shift.duration} />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <DurationLabel duration={shift.duration} />
                      <ChevronDown
                        size={16}
                        className={`text-text3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="bg-bg2 mx-3 mb-3 rounded-xl px-4 py-3">
                      <ShiftDetail shift={shift} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <NavBar />
      </div>
    </div>
  );
};

export default WorkerHistoryPage;

// ─── HOW THIS PAGE WORKS ─────────────────────────────────────────────────────
//
// OVERVIEW
// This page shows a worker's shift history in 3 tabs:
// "This week" → "Month" → "All time"
// Each tab filters the same array of shifts differently.
//
// ── DATA FLOW ────────────────────────────────────────────────────────────────
// 1. On mount, fetchShifts() calls the API and stores all shifts in allShifts[]
// 2. completedShifts filters out any active shifts — history shows only done ones
// 3. weeklyShifts, monthlyShifts are derived from completedShifts
// 4. shiftsForTab picks which array to use based on activeTab (0, 1, or 2)
//
// ── TABS ─────────────────────────────────────────────────────────────────────
// activeTab is a number: 0 = This week, 1 = Month, 2 = All time
// Clicking a tab button sets activeTab → page re-renders with new data
//
// ── THIS WEEK TAB (activeTab === 0) ──────────────────────────────────────────
// Always shows all 7 days Mon→Sun regardless of whether a shift exists.
// weekDays is an array of 7 Date objects starting from this Monday.
// For each day it looks for a matching shift by comparing toDateString().
// If no shift that day → shows "—". If shift exists → shows duration + chevron.
// Clicking a row opens ShiftDetail (notes, time, site, materials).
// selectedShift tracks which row is open — clicking again closes it.
//
// ── MONTH TAB (activeTab === 1) ──────────────────────────────────────────────
// Flat list of all shifts this calendar month.
// Same expand/collapse pattern as This week using selectedShift.
//
// ── ALL TIME TAB (activeTab === 2) ───────────────────────────────────────────
// Groups shifts by month into shiftsByMonth object.
// Key is "YYYY-M" (e.g. "2026-4"), value is { label, shifts[] }.
// sortedMonthKeys sorts months newest first.
// Two levels of expand/collapse:
//   Level 1 → selectedMonthKey opens a month group
//   Level 2 → selectedShift opens a single shift inside that month
//
// ── STATS ROW ────────────────────────────────────────────────────────────────
// Always shows stats for the CURRENT tab's shifts:
// Total hours / Shift count / Average shift duration
// These recalculate automatically when activeTab changes.
//
// ── HELPERS USED ─────────────────────────────────────────────────────────────
// pad()             → forces 2-digit numbers for time display (9 → "09")
// formatTime()      → "2026-05-06T08:05:00Z" → "08:05"
// formatDate()      → Date object → "Monday, 6 May"
// totalMinutes()    → adds up all shift durations in an array
// avgMinutes()      → totalMinutes / shift count
// toHours()         → minutes → whole hours (510 → 8)
// toMins()          → leftover minutes after hours (510 → 30)
// durationPct()     → duration as % of 8h day (480 min) for progress bar
// getMondayMidnight()→ returns this Monday at 00:00:00 for weekly filter
//
// ─────────────────────────────────────────────────────────────────────────────
