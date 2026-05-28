import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getMyShifts, startShift, stopShift } from "../../api/shifts";
import { getMe } from "../../api/user";
import { colors, fonts } from "../../theme";

const pad = (n: number) => String(n).padStart(2, "0");

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const getMondayMidnight = () => {
  const d = new Date();
  const diff = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

function useElapsed(startTime: string | null) {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!startTime) { setSeconds(0); return; }
    const tick = () => setSeconds(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
    tick();
    ref.current = setInterval(tick, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [startTime]);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return { display: `${pad(h)}:${pad(m)}:${pad(s)}`, seconds };
}

export default function HomeScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigation = useNavigation<any>();
  const [notes, setNotes] = useState("");
  const [materials, setMaterials] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    select: (r) => r.data.data,
  });

  const { data: shifts = [], isLoading } = useQuery<any[]>({
    queryKey: ["shifts"],
    queryFn: async () => (await getMyShifts()).data.data,
    refetchInterval: 30_000,
  });

  const activeShift = shifts.find((s) => s.status === "active");
  const completedShifts = shifts.filter((s) => s.status === "completed");
  const assignedSite = meData?.sites?.[0];
  const firstName = (meData?.name ?? user?.name ?? "").split(" ")[0];
  const { display: elapsed, seconds: elapsedSeconds } = useElapsed(activeShift?.startTime ?? null);

  const avgMinutes =
    completedShifts.length > 0
      ? completedShifts.reduce((acc: number, s: any) => acc + (s.duration ?? 0), 0) / completedShifts.length
      : 480;
  const progressPct = Math.min(Math.round((elapsedSeconds / 60 / avgMinutes) * 100), 100);

  const now = new Date();
  const sumHours = (filter: (s: any) => boolean) =>
    Math.round(completedShifts.filter(filter).reduce((acc: number, s: any) => acc + (s.duration ?? 0), 0) / 60);
  const weeklyHours = sumHours((s) => new Date(s.startTime) >= getMondayMidnight());
  const monthlyHours = sumHours((s) => {
    const d = new Date(s.startTime);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const clockInMutation = useMutation({
    mutationFn: (siteId: string) => startShift(siteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shifts"] }),
  });

  const clockOutMutation = useMutation({
    mutationFn: () => stopShift({ notes, materials }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shifts"] });
      setNotes("");
      setMaterials("");
      setSubmitted(false);
    },
  });

  const handleStop = () => {
    setSubmitted(true);
    if (notes.trim().length < 10) return;
    clockOutMutation.mutate();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={colors.blue} />
      </SafeAreaView>
    );
  }

  // ── Active shift ────────────────────────────────────────────────────────────
  if (activeShift) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row items-start justify-between mt-4 mb-6">
            <View>
              <Text className="text-sm text-text2 mb-0.5">Shift in progress</Text>
              <Text className="text-2xl text-text" style={{ fontFamily: fonts.bold }}>{firstName}</Text>
            </View>
            <View className="flex-row items-center gap-1.5 bg-red/15 border border-red/30 rounded-full px-3 py-1.5 mt-1">
              <View className="w-1.5 h-1.5 rounded-full bg-red" />
              <Text className="text-xs text-red" style={{ fontFamily: fonts.semibold }}>Live</Text>
            </View>
          </View>

          {/* Timer card */}
          <View className="bg-blue/10 border border-blue/20 rounded-2xl p-6 mb-3 items-center">
            <Text className="text-[10px] text-blue uppercase tracking-widest mb-3" style={{ fontFamily: fonts.bold }}>
              Elapsed time
            </Text>
            <Text className="text-5xl text-blue mb-1" style={{ fontFamily: fonts.bold, letterSpacing: -1 }}>
              {elapsed}
            </Text>
            <Text className="text-xs text-text2">
              Started at {formatTime(activeShift.startTime)} ·{" "}
              {new Date(activeShift.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </Text>
            <View className="mt-5 w-full">
              <Text className="text-xs text-text3 mb-2">{progressPct}% of your average shift</Text>
              <View className="w-full h-1.5 bg-line rounded-full overflow-hidden">
                <View className="h-full bg-blue rounded-full" style={{ width: `${progressPct}%` }} />
              </View>
            </View>
          </View>

          {/* Site */}
          <View className="bg-bg3 border border-line rounded-2xl p-4 mb-4">
            <Text className="text-[10px] text-text3 uppercase tracking-widest mb-2" style={{ fontFamily: fonts.bold }}>Project</Text>
            <Text className="text-sm text-text" style={{ fontFamily: fonts.semibold }}>{activeShift.site?.name ?? "—"}</Text>
          </View>

          {/* Notes */}
          <View className="mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm text-text" style={{ fontFamily: fonts.semibold }}>Notes</Text>
              {submitted && notes.trim().length < 10 && (
                <Text className="text-xs text-red" style={{ fontFamily: fonts.medium }}>
                  {notes.length === 0 ? "Required" : "Too short (min 10)"}
                </Text>
              )}
            </View>
            <TextInput
              className="bg-bg3 border border-line rounded-2xl px-4 text-text"
              style={{ paddingVertical: 12, fontSize: 14, fontFamily: fonts.regular, minHeight: 90, textAlignVertical: "top" }}
              value={notes}
              onChangeText={setNotes}
              placeholder="What did you work on?"
              placeholderTextColor={colors.text3}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Materials */}
          <View className="mb-5">
            <Text className="text-sm text-text2 mb-2">
              Materials used <Text className="text-text3">(optional)</Text>
            </Text>
            <TextInput
              className="bg-bg3 border border-line rounded-2xl px-4 text-text"
              style={{ paddingVertical: 12, fontSize: 14, fontFamily: fonts.regular }}
              value={materials}
              onChangeText={setMaterials}
              placeholder="Add materials..."
              placeholderTextColor={colors.text3}
            />
          </View>

          {/* Stop shift */}
          <TouchableOpacity
            className={`bg-red/15 border border-red/30 rounded-2xl py-6 items-center ${clockOutMutation.isPending ? "opacity-50" : ""}`}
            onPress={handleStop}
            disabled={clockOutMutation.isPending}
            activeOpacity={0.8}
          >
            {clockOutMutation.isPending ? (
              <ActivityIndicator color={colors.red} />
            ) : (
              <>
                <View className="w-10 h-10 rounded-full border border-red/50 items-center justify-center mb-2">
                  <Ionicons name="stop" size={16} color={colors.red} />
                </View>
                <Text className="text-base text-red" style={{ fontFamily: fonts.bold }}>Stop shift</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Home (no active shift) ──────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* Header */}
        <View className="flex-row items-start justify-between mt-4 mb-6">
          <View>
            <Text className="text-sm text-text2">Hello 👋</Text>
            <Text className="text-2xl text-text" style={{ fontFamily: fonts.bold }}>{firstName}</Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-blue items-center justify-center mt-0.5"
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.8}
          >
            <Text className="text-sm text-white" style={{ fontFamily: fonts.bold }}>
              {getInitials(meData?.name ?? user?.name ?? "?")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Assigned site card */}
        {assignedSite && (
          <View className="bg-bg3 border border-line rounded-2xl p-4 mb-3">
            <Text className="text-[10px] text-text3 uppercase tracking-widest mb-2" style={{ fontFamily: fonts.bold }}>
              Assigned project
            </Text>
            <Text className="text-sm text-text" style={{ fontFamily: fonts.semibold }}>{assignedSite.name}</Text>
            {assignedSite.address ? (
              <Text className="text-xs text-text2">{assignedSite.address}</Text>
            ) : null}
            <View className="flex-row items-center gap-1.5 mt-3">
              <View className="w-1.5 h-1.5 rounded-full bg-text3" />
              <Text className="text-xs text-text3">No active shift</Text>
            </View>
          </View>
        )}

        {/* Start shift / not assigned */}
        {assignedSite ? (
          <TouchableOpacity
            className={`bg-green/10 border border-green/30 rounded-2xl py-6 items-center mb-3 ${clockInMutation.isPending ? "opacity-50" : ""}`}
            onPress={() => clockInMutation.mutate(assignedSite._id)}
            disabled={clockInMutation.isPending}
            activeOpacity={0.8}
          >
            {clockInMutation.isPending ? (
              <ActivityIndicator color={colors.green} />
            ) : (
              <>
                <View className="w-10 h-10 rounded-full border border-green items-center justify-center mb-2">
                  <Ionicons name="play" size={18} color={colors.green} />
                </View>
                <Text className="text-base text-green" style={{ fontFamily: fonts.bold }}>Start shift</Text>
                <Text className="text-xs text-text2 mt-0.5">{assignedSite.name}</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View className="bg-bg3 border border-line rounded-2xl py-6 items-center mb-3">
            <Text className="text-sm text-text3" style={{ fontFamily: fonts.semibold }}>Not assigned to any project</Text>
            <Text className="text-xs text-text3 mt-1">Ask your manager to assign you</Text>
          </View>
        )}

        {clockInMutation.isError && (
          <Text className="text-xs text-red text-center mb-3">
            {(clockInMutation.error as any)?.response?.data?.message ?? "Failed to start shift"}
          </Text>
        )}

        {/* Stats */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-bg3 border border-line rounded-2xl p-4">
            <Text className="text-xl text-text" style={{ fontFamily: fonts.bold }}>{weeklyHours}h</Text>
            <Text className="text-xs text-text2 mt-1">This week</Text>
          </View>
          <View className="flex-1 bg-bg3 border border-line rounded-2xl p-4">
            <Text className="text-xl text-text" style={{ fontFamily: fonts.bold }}>{monthlyHours}h</Text>
            <Text className="text-xs text-text2 mt-1">This month</Text>
          </View>
        </View>

        {/* Recent shifts */}
        {completedShifts.length > 0 && (
          <>
            <Text className="text-[10px] text-text3 uppercase tracking-widest mb-3" style={{ fontFamily: fonts.bold }}>
              Recent shifts
            </Text>
            {completedShifts.slice(0, 3).map((shift: any, i: number) => (
              <View
                key={shift._id}
                className={`flex-row items-center justify-between py-3 ${i < Math.min(completedShifts.length, 3) - 1 ? "border-b border-line" : ""}`}
              >
                <View>
                  <Text className="text-sm text-text" style={{ fontFamily: fonts.semibold }}>{formatDate(shift.startTime)}</Text>
                  <Text className="text-xs text-text2 mt-0.5">
                    {formatTime(shift.startTime)}–{shift.endTime ? formatTime(shift.endTime) : "—"} · {shift.site?.name}
                  </Text>
                </View>
                <Text className="text-sm text-blue" style={{ fontFamily: fonts.bold }}>
                  {shift.duration != null ? formatDuration(shift.duration) : "—"}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
