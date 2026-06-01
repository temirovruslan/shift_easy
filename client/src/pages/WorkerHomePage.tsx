import { useAuth } from "../context/AuthContext";
import { Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyShift, startMyShift, stopMyShift } from "../api/shifts";
import { getUser } from "../api/user";
import type { Shift } from "../types";
import Loader from "../components/Loader";
import { useNavigate } from "react-router-dom";
import NavBarWorker from "../components/NavBar";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const formatElapsed = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const getMondayMidnight = () => {
  const d = new Date();
  const diff = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const sumHours = (shifts: Shift[], filter: (s: Shift) => boolean) =>
  Math.round(
    shifts.filter(filter).reduce((acc, s) => acc + (s.duration || 0), 0) / 60,
  );

// ─── PAGE ─────────────────────────────────────────────────────────────────────

const WorkerHomePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");
  const [materials, setMaterials] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<Shift[]>({
    queryKey: ["myShifts"],
    queryFn: async () => { const res = await getMyShift(); return res.data.data ?? []; },
    staleTime: 30_000,
  });

  const { data: profile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["workerProfile"],
    queryFn: async () => { const res = await getUser(); return res.data; },
    staleTime: 5 * 60_000,
  });

  const currentShift = shifts.find((s) => s.status === "active");

  useEffect(() => {
    if (!currentShift) return;
    const start = new Date(currentShift.startTime).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [currentShift]);

  if (shiftsLoading || profileLoading) return <Loader />;

  const now = new Date();
  const firstName = user?.name.split(" ")[0];
  const assignedSite = profile?.sites?.[0] ?? shifts[0]?.site;

  const greeting = (() => {
    const h = now.getHours();
    if (h < 12) return { text: "Good morning", emoji: "🌅" };
    if (h < 17) return { text: "Good afternoon", emoji: "☀️" };
    return { text: "Good evening", emoji: "🌙" };
  })();
  const todayLabel = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });

  const completedShifts = shifts.filter((s) => s.status === "completed");
  const completedCount = completedShifts.length;
  const totalCompletedMinutes = completedShifts.reduce(
    (acc, s) => acc + (s.duration || 0),
    0,
  );
  const avgShiftMinutes =
    completedCount > 0 ? totalCompletedMinutes / completedCount : 480;
  const progressPct = Math.min(
    Math.round((elapsed / 60 / avgShiftMinutes) * 100),
    100,
  );

  const notesValid = notes.trim().length >= 10;

  const shiftStart = async () => {
    if (!assignedSite) return;
    try {
      await startMyShift({ siteId: assignedSite._id });
      await queryClient.invalidateQueries({ queryKey: ["myShifts"] });
    } catch (error) {
      console.error(error);
    }
  };

  const shiftStop = async () => {
    try {
      await stopMyShift({ notes, materials });
      await queryClient.invalidateQueries({ queryKey: ["myShifts"] });
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
          <div className="bg-red/5 border border-red/15 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-text tracking-tight">{firstName}</h2>
              <span className="flex items-center gap-1.5 bg-red/10 border border-red/25 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-red animate-pulse shrink-0" />
                <span className="text-[11px] font-semibold text-red">Live</span>
              </span>
            </div>
            <p className="text-sm text-text2 leading-snug">{currentShift.site.name}</p>
          </div>

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

          <div className="bg-bg3 border border-border rounded-2xl p-4 mb-4">
            <p className="text-[10px] text-text3 uppercase tracking-widest mb-2">
              Site
            </p>
            <p className="text-sm font-semibold text-text">
              {currentShift.site.name}
            </p>
          </div>

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
                    Min 10 characters
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
        <NavBarWorker />
      </div>
    );

  // ── Home screen ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-bg px-5 pt-14 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-text3">{greeting.text} {greeting.emoji}</p>
            <h2 className="text-2xl font-bold text-text tracking-tight my-0.5">
              {firstName}
            </h2>
            <p className="text-xs text-text3">{todayLabel}</p>
          </div>
          <button
            onClick={() => navigate("/profile/worker")}
            className="w-11 h-11 rounded-full bg-blue ring-2 ring-blue/30 flex items-center justify-center shrink-0"
          >
            <span className="text-sm font-bold text-white">
              {firstName?.slice(0, 2).toUpperCase()}
            </span>
          </button>
        </div>

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

        {assignedSite ? (
          <button
            onClick={shiftStart}
            className="w-full bg-green-d border border-green-border rounded-2xl py-6 flex flex-col items-center gap-2 mb-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-full border border-green flex items-center justify-center">
              <Play size={18} className="text-green fill-green" />
            </div>
            <span className="text-base font-bold text-green">Start shift</span>
            <span className="text-xs text-text2">{assignedSite.name}</span>
          </button>
        ) : (
          <div className="w-full bg-bg3 border border-border rounded-2xl py-6 flex flex-col items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-text3">
              Not assigned to any site
            </span>
            <span className="text-xs text-text3">
              Ask your manager to assign you
            </span>
          </div>
        )}

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

        <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-3">
          Recent shifts
        </p>
        <div className="flex flex-col gap-2">
          {shifts.slice(0, 3).map((shift) => (
            <div
              key={shift._id}
              className="flex items-center justify-between gap-3 py-3 border-b border-border"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text">
                  {formatDate(shift.startTime)}
                </p>
                <p className="text-xs text-text2 mt-0.5 truncate">
                  {formatTime(shift.startTime)}–{formatTime(shift.endTime)} ·{" "}
                  {shift.site?.name}
                </p>
              </div>
              <span className="text-sm font-bold text-blue whitespace-nowrap shrink-0">
                {formatDuration(shift.duration)}
              </span>
            </div>
          ))}
        </div>
      <NavBarWorker />
    </div>
  );
};

export default WorkerHomePage;
