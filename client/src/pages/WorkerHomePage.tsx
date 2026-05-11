import { useAuth } from "../context/AuthContext";
import NavBar from "../components/NavBar";
import { Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { getMyShift, startMyShift, stopMyShift } from "../api/shifts";
import type { Shift } from "../types";
import Loader from "../components/Loader";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0"); // [1]

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`; // [2]
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today"; // [3]
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }); // [4]
};

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60; // [5]
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const formatElapsed = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`; // [12]
};

const getMondayMidnight = () => {
  const d = new Date();
  const diff = d.getDay() === 0 ? 6 : d.getDay() - 1; // [6]
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0); // [7]
  return d;
};

const sumHours = (shifts: Shift[], filter: (s: Shift) => boolean) =>
  Math.round(
    shifts.filter(filter).reduce((acc, s) => acc + (s.duration || 0), 0) / 60,
  ); // [8]

// ─── PAGE ─────────────────────────────────────────────────────────────────────

const WorkerHomePage = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentShift, setCurrentShift] = useState<Shift | undefined>(
    undefined,
  );
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");
  const [materials, setMaterials] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const refreshShifts = async () => {
    const res = await getMyShift();
    const data: Shift[] = res.data.data;
    setShifts(data);
    setCurrentShift(data.find((s) => s.status === "active"));
    return data;
  };

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        await refreshShifts();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchShifts();
  }, []);

  useEffect(() => {
    if (!currentShift) return;
    const start = new Date(currentShift.startTime).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id); // [13]
  }, [currentShift]);

  if (loading) return <Loader />;

  const now = new Date();
  const firstName = user?.name.split(" ")[0];
  const assignedSite = shifts[0]?.site; // [9]

  const completedShifts = shifts.filter((s) => s.status === "completed");
  const completedCount = completedShifts.length;
  const totalCompletedMinutes = completedShifts.reduce(
    (acc, s) => acc + (s.duration || 0),
    0,
  );
  const avgShiftMinutes =
    completedCount > 0 ? totalCompletedMinutes / completedCount : 480; // [14]
  const progressPct = Math.min(
    Math.round((elapsed / 60 / avgShiftMinutes) * 100),
    100,
  );

  const notesValid = notes.trim().length >= 5;

  const shiftStart = async () => {
    try {
      await startMyShift({ siteId: assignedSite._id });
      await refreshShifts();
    } catch (error) {
      console.error(error);
    }
  };

  const shiftStop = async () => {
    try {
      await stopMyShift({ notes, materials });
      await refreshShifts();
      setNotes("");
      setMaterials("");
      setSubmitted(false);
    } catch (error) {
      console.error(error);
    }
  };

  const weeklyHours = sumHours(
    shifts,
    (s) => new Date(s.startTime) >= getMondayMidnight(),
  );
  const monthlyHours = sumHours(shifts, (s) => {
    const d = new Date(s.startTime);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });

  // ── Active shift screen ───────────────────────────────────────────────────

  if (currentShift)
    return (
      <div className="min-h-screen bg-bg px-5 pt-14 pb-20">
        <div className="max-w-sm mx-auto">
          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-text2 mb-0.5">Shift in progress</p>
              <h2 className="text-2xl font-bold text-text tracking-tight">
                {firstName}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 bg-red/15 border border-red/30 rounded-full px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red animate-pulse" />
              <span className="text-xs font-semibold text-red">Live</span>
            </div>
          </div>

          {/* ── Timer card ── */}
          <div className="bg-blue/10 border border-blue/20 rounded-2xl p-6 mb-3 flex flex-col items-center text-center">
            <p className="text-[10px] text-blue uppercase tracking-widest mb-3">
              Elapsed time
            </p>
            <p className="text-5xl font-bold text-blue tracking-tight mb-1">
              {formatElapsed(elapsed)}
            </p>
            <p className="text-xs text-text2">
              Started at {formatTime(currentShift.startTime)} ·{" "}
              {new Date(currentShift.startTime).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>

            {/* ── Progress bar ── */}
            <div className="mt-5 w-full">
              <span className="text-xs text-text3 block mb-2">
                {progressPct}% of your average shift
              </span>
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue rounded-full transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* ── Site card ── */}
          <div className="bg-bg3 border border-border rounded-2xl p-4 mb-4">
            <p className="text-[10px] text-text3 uppercase tracking-widest mb-2">
              Site
            </p>
            <p className="text-sm font-semibold text-text">
              {currentShift.site.name}
            </p>
          </div>

          {/* ── Notes & stop ── */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
              if (notesValid) shiftStop();
            }}
          >
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-text">Notes</p>
                {submitted && notes.length === 0 && (
                  <span className="text-xs font-medium text-red">Required</span>
                )}
                {submitted && notes.length > 0 && !notesValid && (
                  <span className="text-xs font-medium text-red">
                    Too short
                  </span>
                )}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you work on?"
                rows={3}
                className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text3 resize-none outline-none focus:border-blue/50"
              />
            </div>

            <div className="mb-5">
              <p className="text-sm text-text2 mb-2">
                Materials used <span className="text-text3">(optional)</span>
              </p>
              <input
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="Add materials..."
                className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text3 outline-none focus:border-blue/50"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red/15 border border-red/30 rounded-2xl py-5 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-full border border-red/50 flex items-center justify-center">
                <Square size={16} className="text-red fill-red" />
              </div>
              <span className="text-base font-bold text-red">Stop shift</span>
            </button>
          </form>
        </div>
        <NavBar />
      </div>
    );

  // ── Home screen ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-bg px-5 pt-14 pb-20">
      <div className="max-w-sm mx-auto">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-text2">Hello 👋</p>
            <h2 className="text-2xl font-bold text-text tracking-tight">
              {firstName}
            </h2>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {firstName?.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </div>

        {/* ── Site card ── */}
        {assignedSite && (
          <div className="bg-bg3 border border-border rounded-2xl p-4 mb-3">
            <p className="text-[10px] text-text3 uppercase tracking-widest mb-2">
              Assigned site
            </p>
            <p className="text-sm font-semibold text-text">
              {assignedSite.name}
            </p>
            <p className="text-xs text-text2">{assignedSite.address}</p>
            <div className="flex items-center gap-1.5 mt-3">
              <div className="w-1.5 h-1.5 rounded-full bg-text3" />
              <span className="text-xs text-text3">No active shift</span>
            </div>
          </div>
        )}

        {/* ── Start shift ── */}
        <button
          onClick={shiftStart}
          className="w-full bg-green-d border border-green-border rounded-2xl py-6 flex flex-col items-center gap-2 mb-3 active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-full border border-green flex items-center justify-center">
            <Play size={18} className="text-green fill-green" />
          </div>
          <span className="text-base font-bold text-green">Start shift</span>
          <span className="text-xs text-text2">{assignedSite?.name}</span>
        </button>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { value: weeklyHours, label: "This week" },
            { value: monthlyHours, label: "This month" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="bg-bg3 border border-border rounded-2xl p-4"
            >
              <p className="text-xl font-bold text-text">{value}h</p>
              <p className="text-xs text-text2 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Recent shifts ── */}
        <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-3">
          Recent shifts
        </p>
        <div className="flex flex-col gap-2">
          {shifts.slice(0, 3).map(
            (
              shift, // [11]
            ) => (
              <div
                key={shift._id}
                className="flex items-center justify-between py-3 border-b border-border"
              >
                <div>
                  <p className="text-sm font-semibold text-text">
                    {formatDate(shift.startTime)}
                  </p>
                  <p className="text-xs text-text2 mt-0.5">
                    {formatTime(shift.startTime)}–{formatTime(shift.endTime)} ·{" "}
                    {shift.site?.name}
                  </p>
                </div>
                <span className="text-sm font-bold text-blue">
                  {formatDuration(shift.duration)}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
      <NavBar />
    </div>
  );
};

export default WorkerHomePage;

// ─── NOTES ───────────────────────────────────────────────────────────────────
// [1]  pad — forces 2 digits. 9 → "09", 45 → "45". Used so time looks like
//      08:05 not 8:5.
//
// [2]  formatTime — converts "2026-05-06T08:05:00Z" → "08:05".
//      new Date() first, then pull hours and minutes.
//
// [3]  formatDate — returns "Today" / "Yesterday" for recent shifts,
//      otherwise "Tue, 6 May". toDateString() strips the time so
//      two dates on the same day are equal.
//
// [4]  toLocaleDateString("en-GB") — formats as "Tue, 6 May".
//      "en-GB" = British English format (day before month).
//
// [5]  % is remainder (modulo). 510 % 60 = 30 leftover minutes.
//      Math.floor(510 / 60) = 8 hours. Result: "8h 30m".
//
// [6]  getDay() returns 0=Sun, 1=Mon ... 6=Sat.
//      Sunday is treated as 6 (end of week), not 0 (start).
//      This gives us how many days back Monday is.
//
// [7]  setHours(0,0,0,0) — resets time to midnight exactly.
//      So we compare from Monday 00:00:00, not Monday 14:32:07.
//
// [8]  sumHours — filters shifts by a condition, adds up durations
//      (in minutes), divides by 60 to get hours. Both weeklyHours
//      and monthlyHours call this with different filter conditions.
//
// [9]  shifts[0]?.site — takes the site from the first shift.
//      The ?. means: if shifts is empty, don't crash — return undefined.
//
// [11] key={shift._id} — React needs a unique key per list item to track
//      changes efficiently. We use MongoDB's _id, not the array index.
//
// [12] formatElapsed — converts raw seconds to HH:MM:SS for the live timer.
//      e.g. 3723 → "01:02:03".
//
// [13] clearInterval cleanup — when the component unmounts or currentShift
//      changes, the old interval is cleared so it doesn't keep ticking
//      in the background.
//
// [14] avgShiftMinutes — average duration of all completed shifts in minutes.
//      Falls back to 480 (8 hours) if no completed shifts exist yet.
// ─────────────────────────────────────────────────────────────────────────────
