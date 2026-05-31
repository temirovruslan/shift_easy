import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
} from "recharts";
import NavbarManager from "../components/NavbarManager";
import { getUser } from "../api/user";
import { getAllShifts } from "../api/shifts";
import { getSites } from "../api/sites";
import { getAllWorkers } from "../api/worker";
import Loader from "../components/Loader";
import { Pagination } from "../components/ui/Pagination";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const getInitials = (name: string) =>
  name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

// ─── Bar chart ────────────────────────────────────────────────────────────────

const WeekChart = ({
  shiftsWorker,
  weekMinutes,
}: {
  shiftsWorker: any[];
  weekMinutes: number;
}) => {
  const monday = getMondayMidnight();
  const todayDayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const dayMinutes = DAY_LABELS.map((_, i) => {
    const dayStart = new Date(monday);
    dayStart.setDate(monday.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    return shiftsWorker
      .filter((s) => {
        const t = new Date(s.startTime);
        return t >= dayStart && t < dayEnd;
      })
      .reduce((sum, s) => {
        if (s.status === "completed") return sum + (s.duration ?? 0);
        if (i === todayDayIdx && s.status === "active")
          return sum + Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000);
        return sum;
      }, 0);
  });

  const chartData = DAY_LABELS.map((label, i) => ({
    day: label,
    minutes: i > todayDayIdx ? 0 : dayMinutes[i],
    isToday: i === todayDayIdx,
    isFuture: i > todayDayIdx,
  }));

  const CustomTick = ({ x, y, payload, index }: any) => (
    <text
      x={x}
      y={y + 10}
      textAnchor="middle"
      fontSize={10}
      fontWeight="bold"
      fill={index === todayDayIdx ? "#30d158" : "#55556a"}
    >
      {payload.value}
    </text>
  );

  const renderBar = (props: any) => {
    const { x, y, width, height, index } = props;
    const entry = chartData[index];
    if (!entry) return null;
    if (entry.isFuture) {
      return (
        <rect x={x + 2} y={y - 3} width={Math.max(width - 4, 0)} height={3} rx={1.5} fill="#2a2a35" />
      );
    }
    if (height === 0) return null;
    return (
      <rect
        x={x} y={y} width={width} height={height} rx={5}
        fill={entry.isToday ? "#30d158" : "rgba(10,132,255,0.7)"}
      />
    );
  };

  return (
    <div className="bg-bg3 border border-border rounded-2xl px-2 pt-4 pb-3">
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData} barCategoryGap="10%" margin={{ top: 22, right: 4, bottom: 0, left: 4 }}>
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={<CustomTick />} interval={0} height={24} />
          <Bar dataKey="minutes" shape={renderBar}>
            {chartData.map((_, i) => <Cell key={i} />)}
            <LabelList
              dataKey="minutes"
              position="top"
              content={({ x, y, width, value, index }: any) => {
                if (!value || chartData[index]?.isFuture) return null;
                return (
                  <text
                    x={(x as number) + (width as number) / 2}
                    y={(y as number) - 6}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight="bold"
                    fill="#8888a0"
                  >
                    {`${Math.round((value as number) / 60)}h`}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="border-t border-border pt-2.5 px-2 flex items-center justify-between">
        <p className="text-xs text-text3">Total this week</p>
        <p className="text-xs font-bold text-blue">{formatDuration(weekMinutes)}</p>
      </div>
    </div>
  );
};

// ─── Page ──────────────────────────────────────────────────────────────────────

const ManagerDashboardPage = () => {
  const navigate = useNavigate();
  const [offShiftPage, setOffShiftPage] = useState(1);
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: managerInfo, isLoading: userLoading } = useQuery<any>({
    queryKey: ["managerProfile"],
    queryFn: async () => { const res = await getUser(); return res.data; },
    staleTime: 5 * 60_000,
  });

  const { data: shiftsWorker = [], isLoading: shiftsLoading, dataUpdatedAt } = useQuery<any[]>({
    queryKey: ["allShifts"],
    queryFn: async () => { const res = await getAllShifts(); return res.data ?? []; },
    staleTime: 0,
    refetchInterval: 5_000,
  });

  const { data: sitesInfo = [], isLoading: sitesLoading } = useQuery<any[]>({
    queryKey: ["sites"],
    queryFn: async () => { const res = await getSites(); return res.data ?? []; },
    staleTime: 5 * 60_000,
  });

  const { data: workers = [], isLoading: workersLoading } = useQuery<any[]>({
    queryKey: ["workers"],
    queryFn: async () => { const res = await getAllWorkers(); return res.data ?? []; },
    staleTime: 5 * 60_000,
  });

  if (userLoading || shiftsLoading || sitesLoading || workersLoading) return <Loader />;

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const activeShifts = shiftsWorker.filter((s) => s.status === "active");
  const onShiftNow = activeShifts.length;

  const todayMinutes = shiftsWorker
    .filter((s) => new Date(s.startTime) >= todayMidnight)
    .reduce((sum, s) => {
      if (s.status === "completed") return sum + (s.duration ?? 0);
      return sum + Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000);
    }, 0);

  const weekMinutes = shiftsWorker
    .filter((s) => new Date(s.startTime) >= getMondayMidnight())
    .reduce((sum, s) => {
      if (s.status === "completed") return sum + (s.duration ?? 0);
      return sum + Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000);
    }, 0);

  const activeWorkerIds = new Set(activeShifts.map((s) => s.worker._id));
  const offShiftWorkers = workers.filter((w) => !activeWorkerIds.has(w._id));

  // Per-site stats
  const activeSiteCount = activeShifts.reduce<Record<string, number>>((acc, s) => {
    acc[s.site._id] = (acc[s.site._id] ?? 0) + 1;
    return acc;
  }, {});
  const siteTodayMins = shiftsWorker
    .filter((s) => new Date(s.startTime) >= todayMidnight)
    .reduce<Record<string, number>>((acc, s) => {
      const mins =
        s.status === "completed"
          ? (s.duration ?? 0)
          : Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000);
      acc[s.site._id] = (acc[s.site._id] ?? 0) + mins;
      return acc;
    }, {});
  const siteWorkerCount = workers.reduce<Record<string, number>>((acc, w) => {
    (w.sites ?? []).forEach((site: any) => {
      acc[site._id] = (acc[site._id] ?? 0) + 1;
    });
    return acc;
  }, {});

  // ── Stat cards data ──
  const statCards = [
    {
      value: String(onShiftNow),
      label: "On shift now",
      sub: onShiftNow > 0 ? "+1 vs yesterday" : undefined,
      color: onShiftNow > 0 ? "text-green" : "text-text",
      bg: onShiftNow > 0 ? "bg-green/4 border-green/25" : "bg-bg3 border-border",
      subColor: "text-green",
    },
    {
      value: formatDuration(todayMinutes),
      label: "Total hours today",
      sub: undefined,
      color: "text-blue",
      bg: "bg-bg3 border-border",
      subColor: "",
    },
    {
      value: String(workers.length),
      label: "Total workers",
      sub: `${sitesInfo.length} project${sitesInfo.length !== 1 ? "s" : ""}`,
      color: "text-text",
      bg: "bg-bg3 border-border",
      subColor: "text-text3",
    },
    {
      value: formatDuration(weekMinutes),
      label: "This week total",
      sub: "On track",
      color: "text-text",
      bg: "bg-bg3 border-border",
      subColor: "text-green",
    },
  ];

  return (
    <div className="bg-bg min-h-screen pb-24 md:ml-52 md:pb-0 md:h-screen md:flex md:overflow-hidden">

      {/* ── Main scrollable area ── */}
      <div className="flex-1 md:overflow-y-auto">
        <div className="px-5 pt-14 md:px-8 md:pt-8 md:pb-8">

          {/* ── Desktop topbar ── */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text">Dashboard</h1>
              {onShiftNow > 0 && (
                <span className="flex items-center gap-1.5 bg-green/10 border border-green/20 px-3 py-1 rounded-full text-xs font-bold text-green">
                  <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/manager/workers")}
                className="flex items-center gap-2 px-4 py-2 bg-blue rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                + Add worker
              </button>
              <button
                onClick={() => navigate("/manager/profile")}
                className="w-9 h-9 rounded-full bg-blue flex items-center justify-center text-sm font-bold text-white hover:opacity-80 transition-opacity shrink-0"
              >
                {managerInfo ? getInitials(managerInfo.name) : "—"}
              </button>
            </div>
          </div>

          {/* ── Mobile header ── */}
          <div className="md:hidden flex items-start justify-between mb-5">
            <div>
              <p className="text-xs text-text3">{getGreeting()}</p>
              <h1 className="text-2xl font-bold text-text mt-0.5">
                {managerInfo?.name?.split(" ")[0]}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {onShiftNow > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-bold text-amber-500">{onShiftNow} on shift</span>
                </div>
              )}
              <button
                onClick={() => navigate("/manager/profile")}
                className="w-9 h-9 rounded-full bg-blue flex items-center justify-center text-sm font-bold text-white shrink-0"
              >
                {managerInfo ? getInitials(managerInfo.name) : "—"}
              </button>
            </div>
          </div>

          {/* ── 4 stat cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {statCards.map(({ value, label, sub, color, bg, subColor }) => (
              <div key={label} className={`border rounded-xl px-4 py-4 ${bg}`}>
                <p className={`text-2xl font-bold leading-tight ${color}`}>{value}</p>
                <p className="text-[11px] text-text3 font-medium mt-1">{label}</p>
                {sub && <p className={`text-[10px] mt-0.5 ${subColor}`}>{sub}</p>}
              </div>
            ))}
          </div>

          {/* ── Desktop 2-col layout ── */}
          <div className="md:grid md:grid-cols-[1fr_340px] md:gap-6">

            {/* ── Left: On site now ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-text3 uppercase tracking-widest">
                  On site now · {onShiftNow}
                </p>
                <span className="flex items-center gap-1.5 bg-green/10 border border-green/25 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse shrink-0" />
                  <span className="text-[11px] font-semibold text-green">
                    {dataUpdatedAt
                      ? (() => {
                          const sec = Math.floor((Date.now() - dataUpdatedAt) / 1000);
                          return sec < 5 ? "Live" : sec < 60 ? `${sec}s ago` : `${Math.floor(sec / 60)}m ago`;
                        })()
                      : "Live"}
                  </span>
                </span>
              </div>

              {onShiftNow === 0 ? (
                <div className="bg-bg3 border border-border rounded-2xl px-4 py-6 text-center mb-5">
                  <p className="text-sm text-text3">No one on shift right now</p>
                </div>
              ) : (
                <div className="bg-bg3 border border-border rounded-2xl overflow-hidden mb-5">
                  {activeShifts.map((s, i) => {
                    const elapsed = Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000);
                    return (
                      <div
                        key={s._id}
                        className={`flex items-center gap-3 px-4 py-3.5 ${i < activeShifts.length - 1 ? "border-b border-border" : ""}`}
                      >
                        <div className="w-9 h-9 rounded-full bg-blue ring-2 ring-blue/20 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {getInitials(s.worker.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text truncate">{s.worker.name}</p>
                          <p className="text-xs text-text3 mt-0.5 truncate">{s.site.name} · since {formatTime(s.startTime)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <p className="text-sm font-bold text-green">{formatDuration(elapsed)}</p>
                          <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Off shift */}
              {offShiftWorkers.length > 0 && (() => {
                const PAGE_SIZE = 5;
                const totalPages = Math.max(1, Math.ceil(offShiftWorkers.length / PAGE_SIZE));
                const visible = offShiftWorkers.slice((offShiftPage - 1) * PAGE_SIZE, offShiftPage * PAGE_SIZE);
                return (
                  <>
                    <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-3">
                      Off shift · {offShiftWorkers.length}
                    </p>
                    <div className="bg-bg3 border border-border rounded-2xl overflow-hidden opacity-50 mb-3">
                      {visible.map((w, i) => (
                        <div
                          key={w._id}
                          className={`flex items-center gap-3 px-4 py-3 ${i < visible.length - 1 ? "border-b border-border" : ""}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-text3/30 flex items-center justify-center text-xs font-bold text-text3 shrink-0">
                            {getInitials(w.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text3 truncate">{w.name}</p>
                            <p className="text-xs text-text3/60 mt-0.5">Off shift</p>
                          </div>
                          <span className="text-xs text-text3">—</span>
                        </div>
                      ))}
                    </div>
                    <Pagination
                      page={offShiftPage}
                      totalPages={totalPages}
                      onPageChange={setOffShiftPage}
                      className="mb-5"
                    />
                  </>
                );
              })()}
            </div>

            {/* ── Right: chart + sites ── */}
            <div>
              <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-3">
                Hours this week
              </p>
              <div className="mb-5">
                <WeekChart shiftsWorker={shiftsWorker} weekMinutes={weekMinutes} />
              </div>

              {sitesInfo.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-3">
                    Projects
                  </p>
                  <div className="bg-bg3 border border-border rounded-2xl overflow-hidden">
                    {sitesInfo.map((site, i) => {
                      const mins = siteTodayMins[site._id] ?? 0;
                      const wCount = siteWorkerCount[site._id] ?? 0;
                      const onCount = activeSiteCount[site._id] ?? 0;
                      return (
                        <div
                          key={site._id}
                          className={`flex items-center gap-3 px-4 py-3.5 ${i < sitesInfo.length - 1 ? "border-b border-border" : ""}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text truncate">{site.name}</p>
                            <p className="text-xs text-text3 mt-0.5">
                              {wCount} worker{wCount !== 1 ? "s" : ""}
                              {onCount > 0 && <span className="text-green"> · {onCount} on shift</span>}
                            </p>
                          </div>
                          {mins > 0 && (
                            <p className="text-sm font-bold text-blue shrink-0">{formatDuration(mins)}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      <NavbarManager />
    </div>
  );
};

export default ManagerDashboardPage;
