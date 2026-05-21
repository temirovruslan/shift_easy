import { useEffect, useState } from "react";
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

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning 👋";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const ManagerDashboardPage = () => {
  const [managerInfo, setManagerInfo] = useState<any>(null);
  const [shiftsWorker, setShiftsWorker] = useState<any[]>([]);
  const [sitesInfo, setSitesinfo] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const [userRes, shiftsRes, sitesRes, workersRes] = await Promise.all([
          getUser(),
          getAllShifts(),
          getSites(),
          getAllWorkers(),
        ]);
        setManagerInfo(userRes.data);
        setShiftsWorker(shiftsRes.data);
        setSitesinfo(sitesRes.data);
        setWorkers(workersRes.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserInfo();
  }, []);

  if (loading) return <Loader />;

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const activeShifts = shiftsWorker.filter((s) => s.status === "active");
  const onShiftNow = activeShifts.length;

  const todayMinutes = shiftsWorker
    .filter((s) => new Date(s.startTime) >= todayMidnight)
    .reduce((sum, s) => {
      if (s.status === "completed") return sum + (s.duration ?? 0);
      return (
        sum + Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000)
      );
    }, 0);

  const weekMinutes = shiftsWorker
    .filter((s) => new Date(s.startTime) >= getMondayMidnight())
    .reduce((sum, s) => {
      if (s.status === "completed") return sum + (s.duration ?? 0);
      return (
        sum + Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000)
      );
    }, 0);

  return (
    <div className="min-h-screen bg-bg px-5 pt-14 pb-24">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
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
                <span className="text-xs font-bold text-amber-500">
                  {onShiftNow} on shift
                </span>
              </div>
            )}
            <div className="w-9 h-9 rounded-full bg-blue flex items-center justify-center text-sm font-bold text-white shrink-0">
              {managerInfo ? getInitials(managerInfo.name) : "—"}
            </div>
          </div>
        </div>

        {/* 4 stat cards */}
        <div className="grid grid-cols-2 gap-2 mb-5 mx-10">
          <div
            className={`border rounded-xl px-3.5 py-3 transition-colors ${
              onShiftNow > 0
                ? "bg-green/4 border-green/25"
                : "bg-bg3 border-border"
            }`}
          >
            <p
              className={`text-2xl font-bold leading-tight ${onShiftNow > 0 ? "text-green" : "text-text"}`}
            >
              {onShiftNow}
            </p>
            <p className="text-[10px] text-text3 font-medium mt-1">
              On shift now
            </p>
          </div>
          <div className="bg-bg3 border border-border rounded-xl px-3.5 py-3">
            <p className="text-2xl font-bold text-blue leading-tight">
              {formatDuration(todayMinutes)}
            </p>
            <p className="text-[10px] text-text3 font-medium mt-1">
              Total hours today
            </p>
          </div>
          <div className="bg-bg3 border border-border rounded-xl px-3.5 py-3">
            <p className="text-2xl font-bold text-text leading-tight">
              {workers.length}
            </p>
            <p className="text-[10px] text-text3 font-medium mt-1">
              Total workers
            </p>
            <p className="text-[10px] text-text3/50 mt-0.5">
              {sitesInfo.length} site{sitesInfo.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="bg-bg3 border border-border rounded-xl px-3.5 py-3">
            <p className="text-2xl font-bold text-text leading-tight">
              {formatDuration(weekMinutes)}
            </p>
            <p className="text-[10px] text-text3 font-medium mt-1">
              This week total
            </p>
          </div>
        </div>

        {/* On site now */}
        <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-3">
          On site now · {onShiftNow}
        </p>

        {/* Active workers */}
        {onShiftNow === 0 ? (
          <div className="bg-bg3 border border-border rounded-2xl px-4 py-5 text-center mb-5">
            <p className="text-sm text-text3">No one on shift right now</p>
          </div>
        ) : (
          <div className="bg-bg3 border border-border rounded-2xl overflow-hidden mb-5">
            {activeShifts.map((s, i) => {
              const elapsed = Math.floor(
                (Date.now() - new Date(s.startTime).getTime()) / 60000,
              );
              return (
                <div
                  key={s._id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${
                    i < activeShifts.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-blue ring-2 ring-blue/20 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {getInitials(s.worker.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text truncate">
                      {s.worker.name}
                    </p>
                    <p className="text-xs text-text3 mt-0.5">
                      {s.site.name} · {formatTime(s.startTime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <p className="text-sm font-bold text-green">
                      {formatDuration(elapsed)}
                    </p>
                    <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Off shift workers */}
        {(() => {
          const activeWorkerIds = new Set(
            activeShifts.map((s) => s.worker._id),
          );
          const offShift = workers.filter((w) => !activeWorkerIds.has(w._id));
          if (offShift.length === 0) return null;
          return (
            <>
              <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-3">
                Off shift · {offShift.length}
              </p>
              <div className="bg-bg3 border border-border rounded-2xl overflow-hidden opacity-50">
                {offShift.map((w, i) => (
                  <div
                    key={w._id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      i < offShift.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-text3/30 flex items-center justify-center text-xs font-bold text-text3 shrink-0">
                      {getInitials(w.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text3 truncate">
                        {w.name}
                      </p>
                      <p className="text-xs text-text3/60 mt-0.5">
                        {w.occupation ?? "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          );
        })()}

        {/* Weekly bar chart */}
        {(() => {
          const monday = getMondayMidnight();
          const todayDayIdx =
            new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
          const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

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
                  return (
                    sum +
                    Math.floor(
                      (Date.now() - new Date(s.startTime).getTime()) / 60000,
                    )
                  );
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
                <rect
                  x={x + 2}
                  y={y - 3}
                  width={Math.max(width - 4, 0)}
                  height={3}
                  rx={1.5}
                  fill="#2a2a35"
                />
              );
            }
            if (height === 0) return null;
            return (
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={5}
                fill={entry.isToday ? "#30d158" : "rgba(10,132,255,0.7)"}
              />
            );
          };

          return (
            <>
              <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-3 mt-6">
                Hours this week
              </p>
              <div className="bg-bg3 border border-border rounded-2xl px-2 pt-4 pb-3 mb-5">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart
                    data={chartData}
                    barCategoryGap="10%"
                    margin={{ top: 22, right: 4, bottom: 0, left: 4 }}
                  >
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={<CustomTick />}
                      interval={0}
                      height={24}
                    />
                    <Bar dataKey="minutes" shape={renderBar}>
                      {chartData.map((_, i) => (
                        <Cell key={i} />
                      ))}
                      <LabelList
                        dataKey="minutes"
                        position="top"
                        content={({
                          x,
                          y,
                          width,
                          value,
                          index,
                        }: any) => {
                          if (!value || chartData[index]?.isFuture)
                            return null;
                          return (
                            <text
                              x={
                                (x as number) + (width as number) / 2
                              }
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
                <div className="border-t border-border pt-2.5 px-2">
                  <p className="text-xs text-text3">
                    Total so far:{" "}
                    <span className="text-text font-bold">
                      {formatDuration(weekMinutes)}
                    </span>
                  </p>
                </div>
              </div>
            </>
          );
        })()}

        {/* Sites overview */}
        {sitesInfo.length > 0 &&
          (() => {
            const todayMid = new Date();
            todayMid.setHours(0, 0, 0, 0);

            const activeSiteCount = activeShifts.reduce<Record<string, number>>(
              (acc, s) => {
                acc[s.site._id] = (acc[s.site._id] ?? 0) + 1;
                return acc;
              },
              {},
            );

            const siteTodayMins = shiftsWorker
              .filter((s) => new Date(s.startTime) >= todayMid)
              .reduce<Record<string, number>>((acc, s) => {
                const mins =
                  s.status === "completed"
                    ? (s.duration ?? 0)
                    : Math.floor(
                        (Date.now() - new Date(s.startTime).getTime()) / 60000,
                      );
                acc[s.site._id] = (acc[s.site._id] ?? 0) + mins;
                return acc;
              }, {});

            const siteWorkerCount = workers.reduce<Record<string, number>>(
              (acc, w) => {
                (w.sites ?? []).forEach((site: any) => {
                  acc[site._id] = (acc[site._id] ?? 0) + 1;
                });
                return acc;
              },
              {},
            );

            return (
              <>
                <p className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-3">
                  Sites
                </p>
                <div className="bg-bg3 border border-border rounded-2xl overflow-hidden mb-5">
                  {sitesInfo.map((site, i) => {
                    const mins = siteTodayMins[site._id] ?? 0;
                    const wCount = siteWorkerCount[site._id] ?? 0;
                    const onCount = activeSiteCount[site._id] ?? 0;
                    return (
                      <div
                        key={site._id}
                        className={`flex items-center gap-3 px-4 py-3.5 ${
                          i < sitesInfo.length - 1
                            ? "border-b border-border"
                            : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text truncate">
                            {site.name}
                          </p>
                          <p className="text-xs text-text3 mt-0.5">
                            {wCount} worker{wCount !== 1 ? "s" : ""}
                            {onCount > 0 && (
                              <span className="text-green">
                                {" "}
                                · {onCount} on shift
                              </span>
                            )}
                          </p>
                        </div>
                        {mins > 0 && (
                          <p className="text-sm font-bold text-blue shrink-0">
                            {formatDuration(mins)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
      </div>
      <NavbarManager />
    </div>
  );
};

export default ManagerDashboardPage;
