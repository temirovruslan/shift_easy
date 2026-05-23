import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { getAllShifts, getAllWorkers, getSites } from "../../api/manager";
import { getMe } from "../../api/user";
import { colors, fonts } from "../../theme";
import type { ManagerStackParamList } from "../../navigation/ManagerNavigator";

type Nav = NativeStackNavigationProp<ManagerStackParamList>;

// ── Helpers ────────────────────────────────────────────────────────────────────

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

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning 👋";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

// ── Week Bar Chart ─────────────────────────────────────────────────────────────

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const CHART_H = 80;
const VALUE_H = 18;

function WeekChart({ shifts, weekMinutes }: { shifts: any[]; weekMinutes: number }) {
  const monday = getMondayMidnight();
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const dayMinutes = DAY_LABELS.map((_, i) => {
    const dayStart = new Date(monday);
    dayStart.setDate(monday.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    return shifts
      .filter((s) => { const t = new Date(s.startTime); return t >= dayStart && t < dayEnd; })
      .reduce((sum, s) => {
        if (s.status === "completed") return sum + (s.duration ?? 0);
        if (i === todayIdx && s.status === "active")
          return sum + Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000);
        return sum;
      }, 0);
  });

  const maxMinutes = Math.max(...dayMinutes, 60);

  const chartData = DAY_LABELS.map((label, i) => ({
    label,
    minutes: i > todayIdx ? 0 : dayMinutes[i],
    isToday: i === todayIdx,
    isFuture: i > todayIdx,
  }));

  return (
    <View style={{ backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 8, paddingTop: 16, paddingBottom: 0 }}>
      {/* Bars */}
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: CHART_H + VALUE_H }}>
        {chartData.map((item, i) => {
          const barH = item.isFuture || item.minutes === 0
            ? 0
            : Math.max((item.minutes / maxMinutes) * CHART_H, 6);

          return (
            <View key={i} style={{ flex: 1, alignItems: "center", height: CHART_H + VALUE_H, justifyContent: "flex-end" }}>
              {/* Value label zone */}
              <View style={{ height: VALUE_H, justifyContent: "flex-end", alignItems: "center" }}>
                {item.minutes > 0 && !item.isFuture && (
                  <Text style={{ fontSize: 9, fontFamily: fonts.bold, color: "#8888a0", marginBottom: 4 }}>
                    {`${Math.round(item.minutes / 60)}h`}
                  </Text>
                )}
              </View>
              {/* Bar or stub */}
              {item.isFuture ? (
                <View style={{ width: "55%", height: 3, borderRadius: 2, backgroundColor: colors.line }} />
              ) : barH > 0 ? (
                <View style={{ width: "55%", height: barH, borderRadius: 5, backgroundColor: item.isToday ? colors.green : "rgba(10,132,255,0.7)" }} />
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Day labels */}
      <View style={{ flexDirection: "row", marginTop: 6 }}>
        {chartData.map((item, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: item.isToday ? colors.green : colors.text3 }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={{ borderTopWidth: 1, borderColor: colors.line, marginTop: 10, paddingVertical: 10, paddingHorizontal: 8 }}>
        <Text style={{ fontSize: 12, color: colors.text3 }}>
          Total so far:{" "}
          <Text style={{ fontFamily: fonts.bold, color: colors.text }}>{formatDuration(weekMinutes)}</Text>
        </Text>
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe().then((r) => r.data),
    select: (d) => d?.data ?? d,
  });

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery<any[]>({
    queryKey: ["allShifts"],
    queryFn: async () => (await getAllShifts()).data.data,
    refetchInterval: 30_000,
  });

  const { data: workers = [] } = useQuery<any[]>({
    queryKey: ["workers"],
    queryFn: async () => (await getAllWorkers()).data.data,
  });

  const { data: sites = [] } = useQuery<any[]>({
    queryKey: ["sites"],
    queryFn: async () => (await getSites()).data.data,
  });

  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
  const activeShifts = shifts.filter((s) => s.status === "active");
  const onShiftNow = activeShifts.length;

  const todayMinutes = shifts
    .filter((s) => new Date(s.startTime) >= todayMidnight)
    .reduce((sum, s) => {
      if (s.status === "completed") return sum + (s.duration ?? 0);
      return sum + Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000);
    }, 0);

  const weekMinutes = shifts
    .filter((s) => new Date(s.startTime) >= getMondayMidnight())
    .reduce((sum, s) => {
      if (s.status === "completed") return sum + (s.duration ?? 0);
      return sum + Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000);
    }, 0);

  const activeWorkerIds = new Set(activeShifts.map((s) => s.worker._id));
  const offShiftWorkers = workers.filter((w) => !activeWorkerIds.has(w._id));

  const activeSiteCount = activeShifts.reduce<Record<string, number>>((acc, s) => {
    acc[s.site._id] = (acc[s.site._id] ?? 0) + 1; return acc;
  }, {});

  const siteTodayMins = shifts
    .filter((s) => new Date(s.startTime) >= todayMidnight)
    .reduce<Record<string, number>>((acc, s) => {
      const mins = s.status === "completed" ? (s.duration ?? 0)
        : Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000);
      acc[s.site._id] = (acc[s.site._id] ?? 0) + mins; return acc;
    }, {});

  const siteWorkerCount = workers.reduce<Record<string, number>>((acc, w) => {
    (w.sites ?? []).forEach((site: any) => { acc[site._id] = (acc[site._id] ?? 0) + 1; });
    return acc;
  }, {});

  const firstName = (meData?.name ?? user?.name ?? "").split(" ")[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginTop: 16, marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 12, color: colors.text3 }}>{getGreeting()}</Text>
            <Text style={{ fontSize: 24, color: colors.text, marginTop: 2, fontFamily: fonts.bold }}>{firstName}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
            {onShiftNow > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.amber + "26", borderWidth: 1, borderColor: colors.amber + "4d", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.amber }} />
                <Text style={{ fontSize: 12, color: colors.amber, fontFamily: fonts.bold }}>{onShiftNow} on shift</Text>
              </View>
            )}
            <TouchableOpacity
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center" }}
              onPress={() => navigation.navigate("ManagerProfile")}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 13, color: "#fff", fontFamily: fonts.bold }}>
                {meData ? getInitials(meData.name) : "—"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {shiftsLoading ? (
          <View style={{ height: 128, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={colors.blue} />
          </View>
        ) : (
          <>
            {/* Stat cards */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              <View style={{ flex: 1, minWidth: "45%", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: onShiftNow > 0 ? colors.green + "0d" : colors.bg3, borderColor: onShiftNow > 0 ? colors.green + "40" : colors.line }}>
                <Text style={{ fontSize: 20, fontFamily: fonts.bold, color: onShiftNow > 0 ? colors.green : colors.text, lineHeight: 24 }}>{onShiftNow}</Text>
                <Text style={{ fontSize: 10, color: colors.text3, marginTop: 4, fontFamily: fonts.medium }}>On shift now</Text>
              </View>
              <View style={{ flex: 1, minWidth: "45%", backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
                <Text style={{ fontSize: 20, fontFamily: fonts.bold, color: colors.blue, lineHeight: 24 }}>{formatDuration(todayMinutes)}</Text>
                <Text style={{ fontSize: 10, color: colors.text3, marginTop: 4, fontFamily: fonts.medium }}>Total hours today</Text>
              </View>
              <View style={{ flex: 1, minWidth: "45%", backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
                <Text style={{ fontSize: 20, fontFamily: fonts.bold, color: colors.text, lineHeight: 24 }}>{workers.length}</Text>
                <Text style={{ fontSize: 10, color: colors.text3, marginTop: 4, fontFamily: fonts.medium }}>Total workers</Text>
                <Text style={{ fontSize: 10, color: colors.text3 + "80", marginTop: 2 }}>{sites.length} site{sites.length !== 1 ? "s" : ""}</Text>
              </View>
              <View style={{ flex: 1, minWidth: "45%", backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
                <Text style={{ fontSize: 20, fontFamily: fonts.bold, color: colors.text, lineHeight: 24 }}>{formatDuration(weekMinutes)}</Text>
                <Text style={{ fontSize: 10, color: colors.text3, marginTop: 4, fontFamily: fonts.medium }}>This week total</Text>
              </View>
            </View>

            {/* On site now */}
            <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>
              On site now · {onShiftNow}
            </Text>
            {onShiftNow === 0 ? (
              <View style={{ backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 20, alignItems: "center", marginBottom: 20 }}>
                <Text style={{ fontSize: 14, color: colors.text3 }}>No one on shift right now</Text>
              </View>
            ) : (
              <View style={{ backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
                {activeShifts.map((s, i) => {
                  const elapsed = Math.floor((Date.now() - new Date(s.startTime).getTime()) / 60000);
                  return (
                    <View key={s._id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: i < activeShifts.length - 1 ? 1 : 0, borderColor: colors.line }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 12, color: "#fff", fontFamily: fonts.bold }}>{getInitials(s.worker.name)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontFamily: fonts.semibold, color: colors.text }}>{s.worker.name}</Text>
                        <Text style={{ fontSize: 12, color: colors.text3, marginTop: 2 }}>{s.site.name} · {formatTime(s.startTime)}</Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: colors.green }}>{formatDuration(elapsed)}</Text>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Off shift */}
            {offShiftWorkers.length > 0 && (
              <>
                <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>
                  Off shift · {offShiftWorkers.length}
                </Text>
                <View style={{ backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, overflow: "hidden", opacity: 0.5, marginBottom: 20 }}>
                  {offShiftWorkers.map((w, i) => (
                    <View key={w._id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: i < offShiftWorkers.length - 1 ? 1 : 0, borderColor: colors.line }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.text3 + "4d", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 11, color: colors.text3, fontFamily: fonts.bold }}>{getInitials(w.name)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontFamily: fonts.semibold, color: colors.text3 }}>{w.name}</Text>
                        <Text style={{ fontSize: 11, color: colors.text3 + "99", marginTop: 2 }}>{w.occupation ?? "—"}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Weekly chart */}
            <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12, marginTop: 4 }}>
              Hours this week
            </Text>
            <View style={{ marginBottom: 20 }}>
              <WeekChart shifts={shifts} weekMinutes={weekMinutes} />
            </View>

            {/* Sites */}
            {sites.length > 0 && (
              <>
                <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Sites</Text>
                <View style={{ backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
                  {sites.map((site: any, i: number) => {
                    const mins = siteTodayMins[site._id] ?? 0;
                    const wCount = siteWorkerCount[site._id] ?? 0;
                    const onCount = activeSiteCount[site._id] ?? 0;
                    return (
                      <View key={site._id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: i < sites.length - 1 ? 1 : 0, borderColor: colors.line }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontFamily: fonts.semibold, color: colors.text }}>{site.name}</Text>
                          <Text style={{ fontSize: 12, color: colors.text3, marginTop: 2 }}>
                            {wCount} worker{wCount !== 1 ? "s" : ""}
                            {onCount > 0 && <Text style={{ color: colors.green }}> · {onCount} on shift</Text>}
                          </Text>
                        </View>
                        {mins > 0 && (
                          <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: colors.blue }}>{formatDuration(mins)}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
