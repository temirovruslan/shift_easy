import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  getSite, getAllWorkers, updateSite, archiveSite,
  activateSite, assignWorkers,
} from "../../api/manager";
import { colors, fonts } from "../../theme";
import type { ManagerStackParamList } from "../../navigation/ManagerNavigator";

type Nav = NativeStackNavigationProp<ManagerStackParamList>;
type Route = RouteProp<ManagerStackParamList, "SiteDetail">;

// ── Types ──────────────────────────────────────────────────────────────────────

type Worker = { _id: string; name: string; email?: string };
type Site = {
  _id: string;
  name: string;
  address: string;
  status: "active" | "archived";
  workers: Worker[];
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [colors.blue, colors.green, colors.red, "#f59e0b", colors.purple];
const PREVIEW_COUNT = 4;

function getInitials(name: string) {
  return (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ── Editable Field ─────────────────────────────────────────────────────────────

function EditableField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (v: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) { setEditing(false); setDraft(value); return; }
    setSaving(true);
    await onSave(trimmed);
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => { setEditing(false); setDraft(value); };

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      <Text style={{ fontSize: 10, fontFamily: fonts.semibold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.bg2,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: editing ? colors.blue + "99" : "transparent",
          }}
        >
          {editing ? (
            <TextInput
              autoFocus
              value={draft}
              onChangeText={setDraft}
              style={{ fontSize: 14, fontFamily: fonts.semibold, color: colors.text, padding: 0 }}
            />
          ) : (
            <Text style={{ fontSize: 14, fontFamily: fonts.semibold, color: colors.text }}>{value}</Text>
          )}
        </View>

        {editing ? (
          <View style={{ flexDirection: "row", gap: 6 }}>
            <TouchableOpacity
              onPress={handleCancel}
              style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line }}
            >
              <Ionicons name="close" size={15} color={colors.text3} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.blue, opacity: saving ? 0.5 : 1 }}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="checkmark" size={15} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => { setDraft(value); setEditing(true); }}
            style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line }}
          >
            <Ionicons name="pencil-outline" size={14} color={colors.text3} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Assign Workers Sheet ───────────────────────────────────────────────────────

function AssignWorkersSheet({
  siteId,
  available,
  onClose,
  onAssigned,
}: {
  siteId: string;
  available: Worker[];
  onClose: () => void;
  onAssigned: (workers: Worker[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleAssign = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      await assignWorkers(siteId, selected);
      onAssigned(available.filter((w) => selected.includes(w._id)));
      onClose();
    } catch {
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)" }}
          onPress={onClose}
          activeOpacity={1}
        />
        <View
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderColor: colors.line,
            paddingBottom: insets.bottom + 16,
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
            <View>
              <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.text }}>Add Workers</Text>
              <Text style={{ fontSize: 12, color: colors.text3, marginTop: 2 }}>{available.length} available</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.bg3 }}
            >
              <Ionicons name="close" size={15} color={colors.text3} />
            </TouchableOpacity>
          </View>

          {/* Worker list */}
          <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}>
            {available.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
                <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.bg3, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="people-outline" size={20} color={colors.text3} />
                </View>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.text }}>All caught up</Text>
                <Text style={{ fontSize: 12, color: colors.text3 }}>All workers are already assigned</Text>
              </View>
            ) : (
              <View style={{ gap: 6 }}>
                {available.map((worker) => {
                  const isSel = selected.includes(worker._id);
                  return (
                    <TouchableOpacity
                      key={worker._id}
                      onPress={() => toggle(worker._id)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 12,
                        paddingHorizontal: 12, paddingVertical: 10,
                        borderRadius: 16, borderWidth: 1,
                        backgroundColor: isSel ? colors.blue + "1a" : colors.bg3,
                        borderColor: isSel ? colors.blue + "33" : "transparent",
                      }}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.blue + "33", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: colors.blue }}>
                          {getInitials(worker.name)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.text }}>{worker.name}</Text>
                        {worker.email && (
                          <Text style={{ fontSize: 11, color: colors.text3 }}>{worker.email}</Text>
                        )}
                      </View>
                      <View
                        style={{
                          width: 20, height: 20, borderRadius: 10,
                          alignItems: "center", justifyContent: "center",
                          backgroundColor: isSel ? colors.blue : "transparent",
                          borderWidth: isSel ? 0 : 2,
                          borderColor: colors.line,
                        }}
                      >
                        {isSel && <Ionicons name="checkmark" size={12} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Assign button */}
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <TouchableOpacity
              onPress={handleAssign}
              disabled={selected.length === 0 || loading}
              style={{
                backgroundColor: colors.blue, borderRadius: 16, paddingVertical: 16,
                alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
                opacity: selected.length === 0 || loading ? 0.4 : 1,
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={16} color="#fff" />
              <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: "#fff" }}>
                {loading
                  ? "Assigning…"
                  : selected.length > 0
                    ? `Assign ${selected.length} worker${selected.length > 1 ? "s" : ""}`
                    : "Select workers above"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function SiteDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { siteId } = route.params;
  const queryClient = useQueryClient();
  const [showAllWorkers, setShowAllWorkers] = useState(false);
  const [showAssignSheet, setShowAssignSheet] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [activating, setActivating] = useState(false);

  const { data: siteRaw, isLoading } = useQuery({
    queryKey: ["site", siteId],
    queryFn: () => getSite(siteId).then((r) => r.data),
  });

  const { data: workersRaw } = useQuery({
    queryKey: ["workers"],
    queryFn: () => getAllWorkers().then((r) => r.data),
  });

  const site: Site | null = siteRaw?.data ?? siteRaw ?? null;
  const allWorkers: Worker[] = workersRaw?.data ?? workersRaw ?? [];
  const available = allWorkers.filter(
    (w) => !site?.workers.some((sw) => sw._id === w._id),
  );

  const [localSite, setLocalSite] = useState<Site | null>(null);
  const current = localSite ?? site;

  const handleNameSave = async (name: string) => {
    await updateSite(siteId, { name });
    setLocalSite((prev) => (prev ?? site!) && { ...(prev ?? site!), name });
  };

  const handleAddressSave = async (address: string) => {
    await updateSite(siteId, { address });
    setLocalSite((prev) => (prev ?? site!) && { ...(prev ?? site!), address });
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await archiveSite(siteId);
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["site", siteId] });
      navigation.goBack();
    } catch {
      setArchiving(false);
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      await activateSite(siteId);
      const base = localSite ?? site!;
      setLocalSite({ ...base, status: "active" });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["site", siteId] });
    } catch {
      // leave status unchanged on error
    } finally {
      setActivating(false);
    }
  };

  const handleAssigned = (newWorkers: Worker[]) => {
    setLocalSite((prev) => {
      const base = prev ?? site!;
      return { ...base, workers: [...base.workers, ...newWorkers] };
    });
    queryClient.invalidateQueries({ queryKey: ["site", siteId] });
  };

  if (isLoading || !current) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.blue} />
      </SafeAreaView>
    );
  }

  const isActive = current.status === "active";
  const visibleWorkers = showAllWorkers ? current.workers : current.workers.slice(0, PREVIEW_COUNT);
  const hiddenCount = current.workers.length - PREVIEW_COUNT;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 24 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={16} color={colors.blue} />
          <Text style={{ fontSize: 14, color: colors.blue, fontFamily: fonts.medium }}>Sites</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 24, color: colors.text, lineHeight: 30 }}>
              {current.name}
            </Text>
            <Text style={{ fontSize: 13, color: colors.text3, marginTop: 4 }}>{current.address}</Text>
          </View>
          <View
            style={{
              marginTop: 4,
              paddingHorizontal: 10, paddingVertical: 4,
              borderRadius: 100,
              backgroundColor: isActive ? colors.green + "26" : colors.line,
            }}
          >
            <Text style={{ fontSize: 10, fontFamily: fonts.bold, textTransform: "uppercase", letterSpacing: 1, color: isActive ? colors.green : colors.text3 }}>
              {isActive ? "Active" : "Archived"}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
          {[
            { icon: "pulse-outline", value: "0", label: "On shift", color: colors.blue, bg: colors.blue + "1a" },
            { icon: "time-outline", value: "0h", label: "Today", color: colors.blue, bg: colors.blue + "1a" },
            { icon: "people-outline", value: String(current.workers.length), label: "Workers", color: colors.text, bg: colors.bg3 },
          ].map(({ icon, value, label, color, bg }) => (
            <View
              key={label}
              style={{ flex: 1, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, alignItems: "center" }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 10, backgroundColor: bg, alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                <Ionicons name={icon as any} size={14} color={color} />
              </View>
              <Text style={{ fontFamily: fonts.bold, fontSize: 18, color, lineHeight: 20 }}>{value}</Text>
              <Text style={{ fontSize: 10, color: colors.text3, marginTop: 4 }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Edit site */}
        <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
          Edit Site
        </Text>
        <View
          style={{ backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}
        >
          <EditableField
            label="Site name"
            value={current.name}
            onSave={handleNameSave}
          />
          <View style={{ height: 1, backgroundColor: colors.line }} />
          <EditableField
            label="Address"
            value={current.address}
            onSave={handleAddressSave}
          />
        </View>

        {/* Workers header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5 }}>
            Workers ({current.workers.length})
          </Text>
          {isActive && (
            <TouchableOpacity
              onPress={() => setShowAssignSheet(true)}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              activeOpacity={0.7}
            >
              <Ionicons name="person-add-outline" size={16} color={colors.blue} />
              <Text style={{ fontSize: 14, fontFamily: fonts.semibold, color: colors.blue }}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Workers list */}
        <View style={{ backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, overflow: "hidden", marginBottom: 8 }}>
          {current.workers.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 32, gap: 8 }}>
              <View style={{ width: 40, height: 40, borderRadius: 16, backgroundColor: colors.bg2, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="people-outline" size={18} color={colors.text3} />
              </View>
              <Text style={{ fontSize: 14, color: colors.text3 }}>No workers assigned yet</Text>
            </View>
          ) : (
            <>
              {visibleWorkers.map((worker, i) => (
                <View
                  key={worker._id}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 12,
                    paddingHorizontal: 16, paddingVertical: 12,
                    borderBottomWidth: i < visibleWorkers.length - 1 ? 1 : 0,
                    borderColor: colors.line,
                  }}
                >
                  <View
                    style={{
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: "#fff" }}>
                      {getInitials(worker.name)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.text }}>{worker.name}</Text>
                    <Text style={{ fontSize: 11, color: colors.text3 }}>Worker</Text>
                  </View>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isActive ? colors.green : colors.line }} />
                </View>
              ))}

              {!showAllWorkers && hiddenCount > 0 && (
                <TouchableOpacity
                  onPress={() => setShowAllWorkers(true)}
                  style={{ paddingVertical: 12, alignItems: "center", borderTopWidth: 1, borderColor: colors.line }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.blue }}>
                    Show {hiddenCount} more
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Actions */}
        <View style={{ gap: 8, marginTop: 20 }}>
          {!isActive && (
            <TouchableOpacity
              onPress={handleActivate}
              disabled={activating}
              style={{ backgroundColor: colors.green + "1a", borderWidth: 1, borderColor: colors.green + "4d", borderRadius: 16, paddingVertical: 16, alignItems: "center", opacity: activating ? 0.5 : 1 }}
              activeOpacity={0.8}
            >
              <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.green }}>
                {activating ? "Activating…" : "Activate site"}
              </Text>
            </TouchableOpacity>
          )}
          {isActive && (
            <TouchableOpacity
              onPress={handleArchive}
              disabled={archiving}
              style={{ backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, opacity: archiving ? 0.5 : 1 }}
              activeOpacity={0.8}
            >
              <Ionicons name="archive-outline" size={15} color={colors.text3} />
              <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.text3 }}>
                {archiving ? "Archiving…" : "Archive site"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {showAssignSheet && (
        <AssignWorkersSheet
          siteId={siteId}
          available={available}
          onClose={() => setShowAssignSheet(false)}
          onAssigned={handleAssigned}
        />
      )}
    </SafeAreaView>
  );
}
