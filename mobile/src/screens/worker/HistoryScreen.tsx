import { useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getMyShifts } from "../../api/shifts";
import { colors, fonts } from "../../theme";

const pad = (n: number) => String(n).padStart(2, "0");
const today = new Date();

const getMondayMidnight = () => {
  const d = new Date();
  const diff = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });

const toHours = (m: number) => Math.floor(m / 60);
const toMins = (m: number) => Math.round(m % 60);
const durationPct = (duration: number) => Math.min(Math.round((duration / 480) * 100), 100);

const TABS = ["This week", "Month", "All time"];

function ProgressBar({ duration, width = 64 }: { duration: number; width?: number }) {
  return (
    <View style={{ width, height: 2, backgroundColor: colors.line, borderRadius: 1, overflow: "hidden" }}>
      <View style={{ width: `${durationPct(duration)}%`, height: "100%", backgroundColor: colors.blue, borderRadius: 1 }} />
    </View>
  );
}

function DurationLabel({ duration }: { duration: number }) {
  const h = toHours(duration);
  const m = toMins(duration);
  return (
    <View style={{ width: 40, alignItems: "flex-end" }}>
      <Text style={{ fontSize: 14, fontFamily: fonts.bold, color: colors.blue, lineHeight: 18 }}>{h}h</Text>
      {m > 0 && (
        <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: colors.red, lineHeight: 14 }}>{m}m</Text>
      )}
    </View>
  );
}

function ShiftDetail({ shift }: { shift: any }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 12, color: colors.text3 }}>Time</Text>
        <Text style={{ fontSize: 12, fontFamily: fonts.semibold, color: colors.text }}>
          {formatTime(shift.startTime)} – {shift.endTime ? formatTime(shift.endTime) : "—"}
        </Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 12, color: colors.text3 }}>Site</Text>
        <Text style={{ fontSize: 12, fontFamily: fonts.semibold, color: colors.blue }}>{shift.site?.name}</Text>
      </View>
      {shift.materials ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 12, color: colors.text3 }}>Materials</Text>
          <Text style={{ fontSize: 12, fontFamily: fonts.semibold, color: colors.text }}>{shift.materials}</Text>
        </View>
      ) : null}
      {shift.notes ? (
        <Text style={{ fontSize: 12, color: colors.text2, lineHeight: 18, marginTop: 4 }}>{shift.notes}</Text>
      ) : null}
    </View>
  );
}

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  const { data: shifts = [], isLoading } = useQuery<any[]>({
    queryKey: ["shifts"],
    queryFn: async () => (await getMyShifts()).data.data,
  });

  const completed = shifts.filter((s: any) => s.status === "completed");

  const weeklyShifts = completed.filter((s: any) => new Date(s.startTime) >= getMondayMidnight());
  const monthlyShifts = completed.filter((s: any) => {
    const d = new Date(s.startTime);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const shiftsForTab = activeTab === 0 ? weeklyShifts : activeTab === 1 ? monthlyShifts : completed;
  const tabTotalMins = shiftsForTab.reduce((acc: number, s: any) => acc + (s.duration ?? 0), 0);
  const tabAvgMins = shiftsForTab.length > 0 ? Math.round(tabTotalMins / shiftsForTab.length) : 0;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(getMondayMidnight());
    d.setDate(d.getDate() + i);
    return d;
  });

  // All time: group by month
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const shiftsByMonth: Record<string, { label: string; shifts: any[] }> = {};
  completed
    .filter((s: any) => new Date(s.startTime) >= oneYearAgo)
    .forEach((s: any) => {
      const d = new Date(s.startTime);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!shiftsByMonth[key])
        shiftsByMonth[key] = {
          label: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
          shifts: [],
        };
      shiftsByMonth[key].shifts.push(s);
    });
  const sortedMonthKeys = Object.keys(shiftsByMonth).sort((a, b) => {
    const [ay, am] = a.split("-").map(Number);
    const [by, bm] = b.split("-").map(Number);
    return by !== ay ? by - ay : bm - am;
  });

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>

        {/* Header */}
        <Text className="text-2xl text-text mt-4 mb-5" style={{ fontFamily: fonts.bold }}>My shifts</Text>

        {/* Filter tabs */}
        <View className="flex-row gap-2 mb-5">
          {TABS.map((label, i) => (
            <TouchableOpacity
              key={label}
              onPress={() => { setActiveTab(i); setSelectedShiftId(null); }}
              className={`px-4 py-1.5 rounded-full ${activeTab === i ? "bg-blue" : "bg-bg3 border border-line"}`}
              activeOpacity={0.8}
            >
              <Text
                className={`text-sm ${activeTab === i ? "text-white" : "text-text2"}`}
                style={{ fontFamily: fonts.medium }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View className="h-32 items-center justify-center">
            <ActivityIndicator color={colors.blue} />
          </View>
        ) : (
          <>
            {/* Stats */}
            <View className="flex-row gap-2 mb-6">
              <View className="flex-1 bg-bg3 border border-line rounded-2xl p-4">
                <Text style={{ fontSize: 20, fontFamily: fonts.bold, color: colors.blue }}>{toHours(tabTotalMins)}h</Text>
                <Text className="text-xs text-text2 mt-1">Total hours</Text>
              </View>
              <View className="flex-1 bg-bg3 border border-line rounded-2xl p-4">
                <Text style={{ fontSize: 20, fontFamily: fonts.bold, color: colors.text }}>{shiftsForTab.length}</Text>
                <Text className="text-xs text-text2 mt-1">Shifts</Text>
              </View>
              <View className="flex-1 bg-bg3 border border-line rounded-2xl p-4">
                <Text style={{ fontSize: 20, fontFamily: fonts.bold, lineHeight: 28 }}>
                  <Text style={{ color: colors.blue }}>{toHours(tabAvgMins)}h </Text>
                  <Text style={{ color: colors.red }}>{toMins(tabAvgMins)}m</Text>
                </Text>
                <Text className="text-xs text-text2 mt-1">Avg shift</Text>
              </View>
            </View>

            {/* ── This week ── */}
            {activeTab === 0 && (
              <View>
                {weekDays.map((day) => {
                  const shift = weeklyShifts.find(
                    (s: any) => new Date(s.startTime).toDateString() === day.toDateString()
                  );
                  const isToday = day.toDateString() === today.toDateString();
                  const isOpen = !!shift && selectedShiftId === shift._id;

                  return (
                    <View
                      key={day.toISOString()}
                      style={isOpen
                        ? { borderWidth: 1, borderColor: colors.blue + "4d", borderRadius: 16, overflow: "hidden", backgroundColor: colors.blue + "1a", marginBottom: 8 }
                        : { borderBottomWidth: 1, borderBottomColor: colors.line, marginBottom: 8 }
                      }
                    >
                      <TouchableOpacity
                        onPress={() => shift && setSelectedShiftId(isOpen ? null : shift._id)}
                        style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12 }}
                        activeOpacity={shift ? 0.7 : 1}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Text style={{
                              fontSize: 14,
                              fontFamily: fonts.semibold,
                              color: shift ? colors.text : colors.text3,
                            }}>
                              {day.toLocaleDateString("en-GB", { weekday: "long" })}
                            </Text>
                            {isToday && (
                              <Text style={{ fontSize: 12, color: colors.blue, fontFamily: fonts.medium }}>Today</Text>
                            )}
                          </View>
                          <Text style={{ fontSize: 12, color: colors.text3, marginTop: 2 }}>
                            {day.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </Text>
                        </View>
                        <View style={{ marginHorizontal: 16 }}>
                          <ProgressBar duration={shift?.duration ?? 0} />
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          {shift ? (
                            <DurationLabel duration={shift.duration} />
                          ) : (
                            <Text style={{ fontSize: 14, color: colors.text3, width: 40, textAlign: "right" }}>—</Text>
                          )}
                          {shift && (
                            <Ionicons
                              name="chevron-down"
                              size={16}
                              color={colors.text3}
                              style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                      {isOpen && shift && (
                        <View style={{ backgroundColor: colors.bg2, marginHorizontal: 12, marginBottom: 12, borderRadius: 12, padding: 16 }}>
                          <ShiftDetail shift={shift} />
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── Month ── */}
            {activeTab === 1 && (
              monthlyShifts.length === 0 ? (
                <Text className="text-sm text-text3 text-center mt-10">No shifts yet</Text>
              ) : (
                <View>
                  {monthlyShifts.map((shift: any) => {
                    const isOpen = selectedShiftId === shift._id;
                    return (
                      <View
                        key={shift._id}
                        style={isOpen
                          ? { borderWidth: 1, borderColor: colors.blue + "4d", borderRadius: 16, overflow: "hidden", backgroundColor: colors.blue + "1a", marginBottom: 8 }
                          : { borderBottomWidth: 1, borderBottomColor: colors.line, marginBottom: 8 }
                        }
                      >
                        <TouchableOpacity
                          onPress={() => setSelectedShiftId(isOpen ? null : shift._id)}
                          style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12 }}
                          activeOpacity={0.7}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontFamily: fonts.semibold, color: colors.text }}>
                              {formatDate(shift.startTime)}
                            </Text>
                            <Text style={{ fontSize: 12, color: colors.text2, marginTop: 2 }}>
                              {formatTime(shift.startTime)}–{shift.endTime ? formatTime(shift.endTime) : "—"} · {shift.site?.name}
                            </Text>
                          </View>
                          <View style={{ marginHorizontal: 16 }}>
                            <ProgressBar duration={shift.duration} />
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <DurationLabel duration={shift.duration} />
                            <Ionicons
                              name="chevron-down"
                              size={16}
                              color={colors.text3}
                              style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
                            />
                          </View>
                        </TouchableOpacity>
                        {isOpen && (
                          <View style={{ backgroundColor: colors.bg2, marginHorizontal: 12, marginBottom: 12, borderRadius: 12, padding: 16 }}>
                            <ShiftDetail shift={shift} />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )
            )}

            {/* ── All time ── */}
            {activeTab === 2 && (
              sortedMonthKeys.length === 0 ? (
                <Text className="text-sm text-text3 text-center mt-10">No shifts yet</Text>
              ) : (
                <View>
                  {sortedMonthKeys.map((monthKey) => {
                    const { label, shifts: monthShifts } = shiftsByMonth[monthKey];
                    const isMonthOpen = selectedMonthKey === monthKey;
                    const monthTotalMins = monthShifts.reduce((acc: number, s: any) => acc + (s.duration ?? 0), 0);

                    return (
                      <View
                        key={monthKey}
                        style={isMonthOpen
                          ? { borderWidth: 1, borderColor: colors.blue + "4d", borderRadius: 16, overflow: "hidden", backgroundColor: colors.blue + "1a", marginBottom: 8 }
                          : { borderBottomWidth: 1, borderBottomColor: colors.line }
                        }
                      >
                        <TouchableOpacity
                          onPress={() => setSelectedMonthKey(isMonthOpen ? null : monthKey)}
                          style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12 }}
                          activeOpacity={0.7}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontFamily: fonts.semibold, color: colors.text }}>{label}</Text>
                            <Text style={{ fontSize: 12, color: colors.text3, marginTop: 2 }}>{monthShifts.length} shifts</Text>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <DurationLabel duration={monthTotalMins} />
                            <Ionicons
                              name="chevron-down"
                              size={16}
                              color={colors.text3}
                              style={{ transform: [{ rotate: isMonthOpen ? "180deg" : "0deg" }] }}
                            />
                          </View>
                        </TouchableOpacity>

                        {isMonthOpen && (
                          <View style={{ marginHorizontal: 12, marginBottom: 12 }}>
                            {monthShifts.map((shift: any) => {
                              const isOpen = selectedShiftId === shift._id;
                              return (
                                <View
                                  key={shift._id}
                                  style={isOpen
                                    ? { borderWidth: 1, borderColor: colors.blue + "4d", borderRadius: 12, overflow: "hidden", backgroundColor: colors.blue + "0d", marginBottom: 4, marginTop: 8 }
                                    : { borderBottomWidth: 1, borderBottomColor: colors.line + "80" }
                                  }
                                >
                                  <TouchableOpacity
                                    onPress={() => setSelectedShiftId(isOpen ? null : shift._id)}
                                    style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 8 }}
                                    activeOpacity={0.7}
                                  >
                                    <View style={{ flex: 1 }}>
                                      <Text style={{ fontSize: 14, fontFamily: fonts.semibold, color: colors.text }}>
                                        {formatDate(shift.startTime)}
                                      </Text>
                                      <Text style={{ fontSize: 12, color: colors.text2, marginTop: 2 }}>
                                        {formatTime(shift.startTime)}–{shift.endTime ? formatTime(shift.endTime) : "—"} · {shift.site?.name}
                                      </Text>
                                    </View>
                                    <View style={{ marginHorizontal: 12, width: 48, height: 2, backgroundColor: colors.line, borderRadius: 1, overflow: "hidden" }}>
                                      <View style={{ width: `${durationPct(shift.duration)}%`, height: "100%", backgroundColor: colors.blue }} />
                                    </View>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                      <DurationLabel duration={shift.duration} />
                                      <Ionicons
                                        name="chevron-down"
                                        size={16}
                                        color={colors.text3}
                                        style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
                                      />
                                    </View>
                                  </TouchableOpacity>
                                  {isOpen && (
                                    <View style={{ backgroundColor: colors.bg2, marginHorizontal: 8, marginBottom: 8, borderRadius: 10, padding: 14 }}>
                                      <ShiftDetail shift={shift} />
                                    </View>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
