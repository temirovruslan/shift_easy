import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getAllShifts, getAllWorkers, getSites } from "../../api/manager";
import { colors, fonts } from "../../theme";

// ── Helpers ────────────────────────────────────────────────────────────────────

const getMondayMidnight = () => {
  const d = new Date();
  const diff = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDuration = (minutes: number) => {
  if (!minutes || minutes <= 0) return "0m";
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
  const dayMonth = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
  if (d >= today) return `TODAY, ${dayMonth}`;
  if (d >= yesterday) return `YESTERDAY, ${dayMonth}`;
  return dayMonth;
};

const getInitials = (name: string) =>
  (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const abbrevName = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return name;
  return `${parts[0]} ${parts[1][0]}.`;
};

// ── Picker Sheet ───────────────────────────────────────────────────────────────

type PickerOption = { id: string; label: string };

function PickerSheet({
  title, allLabel, options, selected, onApply, onClose,
}: {
  title: string;
  allLabel: string;
  options: PickerOption[];
  selected: string | null;
  onApply: (id: string | null) => void;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(selected);
  const insets = useSafeAreaInsets();

  const RadioRow = ({ id, label, sublabel }: { id: string | null; label: string; sublabel?: string }) => {
    const active = pending === id;
    return (
      <TouchableOpacity
        onPress={() => setPending(id)}
        style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, marginBottom: 8,
          backgroundColor: active ? colors.blue + "1a" : colors.bg3,
          borderWidth: 1, borderColor: active ? colors.blue + "4d" : colors.line,
        }}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: active ? colors.blue : colors.text }}>
            {label}
          </Text>
          {sublabel ? <Text style={{ fontSize: 11, color: colors.text3, marginTop: 2 }}>{sublabel}</Text> : null}
        </View>
        <View style={{
          width: 20, height: 20, borderRadius: 10, borderWidth: 2,
          borderColor: active ? colors.blue : colors.line,
          backgroundColor: active ? colors.blue : "transparent",
          alignItems: "center", justifyContent: "center", marginLeft: 12,
        }}>
          {active && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)" }}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={{
          backgroundColor: colors.bg,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          borderTopWidth: 1, borderColor: colors.line,
          paddingHorizontal: 20, paddingBottom: insets.bottom + 8,
        }}>
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line }} />
          </View>
          <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginBottom: 16 }}>
            {title}
          </Text>
          <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
            <RadioRow id={null} label={allLabel} />
            {options.map((opt) => (
              <RadioRow key={opt.id} id={opt.id} label={opt.label} />
            ))}
          </ScrollView>
          <TouchableOpacity
            onPress={() => { onApply(pending); onClose(); }}
            style={{ backgroundColor: colors.blue, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 8 }}
            activeOpacity={0.8}
          >
            <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: "#fff" }}>Apply</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ alignItems: "center", paddingVertical: 14 }} activeOpacity={0.7}>
            <Text style={{ fontSize: 13, color: colors.text3 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Shift Row ──────────────────────────────────────────────────────────────────

function ShiftRow({ shift, expanded, onToggle }: { shift: any; expanded: boolean; onToggle: () => void }) {
  const isActive = shift.status === "active";

  return (
    <TouchableOpacity
      onPress={onToggle}
      style={{
        borderRadius: 16, marginBottom: 8, overflow: "hidden",
        backgroundColor: isActive ? colors.green + "0d" : colors.bg3,
        borderWidth: 1, borderColor: isActive ? colors.green + "40" : colors.line,
      }}
      activeOpacity={0.8}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontFamily: fonts.semibold, color: colors.text }} numberOfLines={1}>
            {shift.site?.name ?? "Unknown site"}
          </Text>
          <Text style={{ fontSize: 11, color: colors.text3, marginTop: 2 }}>
            {formatTime(shift.startTime)}
            {shift.endTime ? ` — ${formatTime(shift.endTime)}` : " — now"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {isActive ? (
            <View style={{
              flexDirection: "row", alignItems: "center", gap: 5,
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
              backgroundColor: colors.green + "26",
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green }} />
              <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: colors.green }}>Live</Text>
            </View>
          ) : (
            <View style={{
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
              backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line,
            }}>
              <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: colors.text3 }}>
                {formatDuration(shift.duration)}
              </Text>
            </View>
          )}
          <View style={{
            width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center",
            backgroundColor: expanded ? colors.blue + "1a" : colors.bg2,
          }}>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={12}
              color={expanded ? colors.blue : colors.text3}
            />
          </View>
        </View>
      </View>

      {expanded && (
        <View style={{
          backgroundColor: colors.bg,
          borderTopWidth: 1, borderTopColor: colors.line + "99",
          paddingHorizontal: 16, paddingVertical: 14, gap: 10,
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 12, color: colors.text3 }}>Start</Text>
            <Text style={{ fontSize: 12, fontFamily: fonts.semibold, color: colors.text }}>
              {formatTime(shift.startTime)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 12, color: colors.text3 }}>End</Text>
            <Text style={{ fontSize: 12, fontFamily: fonts.semibold, color: shift.endTime ? colors.text : colors.green }}>
              {shift.endTime ? formatTime(shift.endTime) : "Still active"}
            </Text>
          </View>
          {shift.notes ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
              <Text style={{ fontSize: 12, color: colors.text3, flexShrink: 0 }}>Notes</Text>
              <Text style={{ fontSize: 12, fontFamily: fonts.semibold, color: colors.text, textAlign: "right", flex: 1 }}>
                {shift.notes}
              </Text>
            </View>
          ) : null}
          {shift.materials ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 16 }}>
              <Text style={{ fontSize: 12, color: colors.text3, flexShrink: 0 }}>Materials</Text>
              <Text style={{ fontSize: 12, fontFamily: fonts.semibold, color: colors.text, textAlign: "right", flex: 1 }}>
                {shift.materials}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

type TimeFilter = "today" | "week" | "all";

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "all", label: "All time" },
];

export default function ShiftsScreen() {
  const [filter, setFilter] = useState<TimeFilter>("today");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [showWorkerPicker, setShowWorkerPicker] = useState(false);
  const [showSitePicker, setShowSitePicker] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const {
    data: shiftsRaw = [],
    isLoading,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ["allShifts"],
    queryFn: () => getAllShifts().then((r) => r.data.data ?? r.data),
    refetchInterval: 30_000,
  });

  const { data: workersRaw = [] } = useQuery({
    queryKey: ["workers"],
    queryFn: () => getAllWorkers().then((r) => r.data.data ?? r.data),
  });

  const { data: sitesRaw = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: () => getSites().then((r) => r.data.data ?? r.data),
  });

  const shifts: any[] = shiftsRaw;
  const workers: any[] = workersRaw;
  const sites: any[] = sitesRaw;

  const formatLastUpdated = () => {
    if (!dataUpdatedAt) return "";
    const sec = Math.floor((Date.now() - dataUpdatedAt) / 1000);
    if (sec < 60) return `Updated ${sec}s ago`;
    return `Updated ${Math.floor(sec / 60)}m ago`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.blue} />
      </SafeAreaView>
    );
  }

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const statsBase = shifts.filter((s) => {
    const workerMatch = !selectedWorkerId || s.worker?._id === selectedWorkerId;
    const siteMatch = !selectedSiteId || s.site?._id === selectedSiteId;
    return workerMatch && siteMatch;
  });

  const filtered = statsBase.filter((s) => {
    const d = new Date(s.startTime);
    if (filter === "today") return d >= todayMidnight;
    if (filter === "week") return d >= getMondayMidnight();
    return true;
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
    filtered.reduce((acc: Record<string, { worker: any; date: string; shifts: any[] }>, s) => {
      const localDate = new Date(s.startTime).toLocaleDateString("en-GB");
      const key = `${s.worker?._id}_${localDate}`;
      if (!acc[key]) acc[key] = { worker: s.worker, date: s.startTime, shifts: [] };
      acc[key].shifts.push(s);
      return acc;
    }, {}),
  );

  const selectedWorkerName = selectedWorkerId
    ? (workers.find((w) => w._id === selectedWorkerId)?.name ?? "")
    : null;
  const selectedSiteName = selectedSiteId
    ? (sites.find((s) => s._id === selectedSiteId)?.name ?? "")
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 24, color: colors.text }}>Shifts</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            disabled={isFetching}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, opacity: isFetching ? 0.5 : 1 }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={14} color={colors.blue} />
            <Text style={{ fontSize: 12, fontFamily: fonts.semibold, color: colors.blue }}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Time filter pills */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {TIME_FILTERS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setFilter(key)}
              style={{
                paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100,
                backgroundColor: filter === key ? colors.blue : colors.bg3,
                borderWidth: filter === key ? 0 : 1, borderColor: colors.line,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: filter === key ? "#fff" : colors.text3 }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Worker + site dropdowns */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => setShowWorkerPicker(true)}
            style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100,
              backgroundColor: selectedWorkerId ? colors.blue + "1a" : colors.bg3,
              borderWidth: 1, borderColor: selectedWorkerId ? colors.blue + "66" : colors.line,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: selectedWorkerId ? colors.blue : colors.text3 }}>
              {selectedWorkerName ? abbrevName(selectedWorkerName) : "All workers"}
            </Text>
            <Ionicons name="chevron-down" size={11} color={selectedWorkerId ? colors.blue : colors.text3} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSitePicker(true)}
            style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100,
              backgroundColor: selectedSiteId ? colors.blue + "1a" : colors.bg3,
              borderWidth: 1, borderColor: selectedSiteId ? colors.blue + "66" : colors.line,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: selectedSiteId ? colors.blue : colors.text3 }}>
              {selectedSiteName ?? "All projects"}
            </Text>
            <Ionicons name="chevron-down" size={11} color={selectedSiteId ? colors.blue : colors.text3} />
          </TouchableOpacity>
        </View>

        {/* Stats cards */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          <View style={{
            flex: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12,
            backgroundColor: onShift > 0 ? colors.green + "0d" : colors.bg3,
            borderWidth: 1, borderColor: onShift > 0 ? colors.green + "40" : colors.line,
          }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 22, lineHeight: 26, color: onShift > 0 ? colors.green : colors.text }}>
              {onShift}
            </Text>
            <Text style={{ fontSize: 10, color: colors.text3, fontFamily: fonts.medium, marginTop: 4 }}>On shift</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 22, lineHeight: 26, color: colors.blue }}>
              {formatDuration(todayMinutes)}
            </Text>
            <Text style={{ fontSize: 10, color: colors.text3, fontFamily: fonts.medium, marginTop: 4 }}>Today</Text>
          </View>
          <View style={{ flex: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 22, lineHeight: 26, color: colors.text }}>
              {formatDuration(weekMinutes)}
            </Text>
            <Text style={{ fontSize: 10, color: colors.text3, fontFamily: fonts.medium, marginTop: 4 }}>This week</Text>
          </View>
        </View>

        {/* Count + last updated */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: colors.text3 }}>
            {filtered.length} shift{filtered.length !== 1 ? "s" : ""}
          </Text>
          <Text style={{ fontSize: 12, color: colors.text3 }}>{formatLastUpdated()}</Text>
        </View>

        {/* Empty state */}
        {filtered.length === 0 && (
          <Text style={{ textAlign: "center", fontSize: 14, color: colors.text3, marginTop: 48 }}>
            No shifts for this period
          </Text>
        )}

        {/* Grouped shift list */}
        {grouped.map((group) => (
          <View key={`${group.worker?._id}_${group.date}`} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <View style={{
                width: 32, height: 32, borderRadius: 16,
                alignItems: "center", justifyContent: "center",
                backgroundColor: group.shifts.some((s) => s.status === "active")
                  ? colors.blue
                  : colors.text3 + "99",
              }}>
                <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: "#fff" }}>
                  {getInitials(group.worker?.name ?? "?")}
                </Text>
              </View>
              <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1 }}>
                {(group.worker?.name ?? "").split(" ")[0]} — {formatGroupDate(group.date)}
              </Text>
            </View>
            {group.shifts.map((s) => (
              <ShiftRow
                key={s._id}
                shift={s}
                expanded={expandedId === s._id}
                onToggle={() => setExpandedId(expandedId === s._id ? null : s._id)}
              />
            ))}
          </View>
        ))}
      </ScrollView>

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
    </SafeAreaView>
  );
}
