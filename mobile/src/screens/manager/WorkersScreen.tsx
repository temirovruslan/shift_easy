import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  TextInput, Modal, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  getAllWorkers, getArchivedWorkers, createWorker, restoreWorker,
} from "../../api/manager";
import { colors, fonts } from "../../theme";
import type { ManagerStackParamList } from "../../navigation/ManagerNavigator";

type Nav = NativeStackNavigationProp<ManagerStackParamList>;
type Filter = "all" | "active" | "pending" | "archived";

function getInitials(name: string) {
  return (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ── Add Worker Sheet ───────────────────────────────────────────────────────────

function AddWorkerSheet({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [occupation, setOccupation] = useState("");
  const [error, setError] = useState("");
  const insets = useSafeAreaInsets();

  const mutation = useMutation({
    mutationFn: () => createWorker({ name: name.trim(), email: email.trim(), occupation: occupation.trim() }),
    onSuccess: () => { onCreated(); onClose(); },
    onError: (err: any) => setError(err?.response?.data?.message ?? "Something went wrong"),
  });

  const handleSubmit = () => {
    if (!name.trim()) { setError("Name is required"); return; }
    if (!email.trim()) { setError("Email is required"); return; }
    setError("");
    mutation.mutate();
  };

  const fields = [
    { label: "Full name", icon: "person-outline", value: name, onChange: setName, placeholder: "e.g. Ahmed Al-Rashid", keyboard: "default" as const, cap: "words" as const },
    { label: "Email", icon: "mail-outline", value: email, onChange: setEmail, placeholder: "e.g. ahmed@company.com", keyboard: "email-address" as const, cap: "none" as const },
    { label: "Occupation", icon: "briefcase-outline", value: occupation, onChange: setOccupation, placeholder: "e.g. Electrician", keyboard: "default" as const, cap: "words" as const },
  ];

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)" }} onPress={onClose} activeOpacity={1} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: colors.line, paddingBottom: insets.bottom + 16 }}>
            <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line }} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}>
              <View>
                <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.text }}>Add Worker</Text>
                <Text style={{ fontSize: 12, color: colors.text3, marginTop: 2 }}>Worker logs in with these credentials</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.bg3 }}>
                <Ionicons name="close" size={15} color={colors.text3} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12, paddingHorizontal: 20 }}>
              {fields.map(({ label, icon, value, onChange, placeholder, keyboard, cap }) => (
                <View key={label} style={{ gap: 6 }}>
                  <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5, paddingLeft: 4 }}>{label}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 }}>
                    <Ionicons name={icon as any} size={15} color={colors.text3} />
                    <TextInput
                      style={{ flex: 1, fontSize: 14, fontFamily: fonts.regular, color: colors.text }}
                      value={value}
                      onChangeText={onChange}
                      placeholder={placeholder}
                      placeholderTextColor={colors.text3}
                      keyboardType={keyboard}
                      autoCapitalize={cap}
                    />
                  </View>
                </View>
              ))}

              {error ? <Text style={{ fontSize: 12, color: colors.red, paddingLeft: 4 }}>{error}</Text> : null}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={mutation.isPending}
                style={{ backgroundColor: colors.blue, borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4, opacity: mutation.isPending ? 0.5 : 1 }}
                activeOpacity={0.8}
              >
                <Ionicons name="person-add-outline" size={15} color="#fff" />
                <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: "#fff" }}>
                  {mutation.isPending ? "Creating…" : "Add Worker"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function WorkersScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const { data: workersRaw = [], isLoading } = useQuery({
    queryKey: ["workers"],
    queryFn: () => getAllWorkers().then((r) => r.data.data ?? r.data),
  });

  const { data: archivedRaw = [] } = useQuery({
    queryKey: ["archivedWorkers"],
    queryFn: () => getArchivedWorkers().then((r) => r.data.data ?? r.data),
  });

  const workers: any[] = workersRaw;
  const archivedWorkers: any[] = archivedRaw;

  const q = search.toLowerCase();

  const filtered = workers.filter((w: any) => {
    const matchSearch = w.name.toLowerCase().includes(q) || (w.occupation ?? "").toLowerCase().includes(q);
    if (filter === "active") return w.isActivated && matchSearch;
    if (filter === "pending") return !w.isActivated && matchSearch;
    return matchSearch;
  });

  const filteredArchived = archivedWorkers.filter((w: any) =>
    w.name.toLowerCase().includes(q) || (w.occupation ?? "").toLowerCase().includes(q),
  );

  const handleRestore = async (workerId: string) => {
    setRestoringId(workerId);
    try {
      await restoreWorker(workerId);
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      queryClient.invalidateQueries({ queryKey: ["archivedWorkers"] });
    } finally {
      setRestoringId(null);
    }
  };

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "pending", label: "Pending" },
    { key: "archived", label: "Archived" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 24, color: colors.text }}>Workers</Text>
          {filter !== "archived" && (
            <TouchableOpacity
              onPress={() => setShowAddSheet(true)}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.blue, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 }}
              activeOpacity={0.8}
            >
              <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#fff", lineHeight: 20 }}>+</Text>
              <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: "#fff" }}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12 }}>
          <Ionicons name="search-outline" size={15} color={colors.text3} />
          <TextInput
            style={{ flex: 1, fontSize: 14, fontFamily: fonts.regular, color: colors.text }}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or occupation..."
            placeholderTextColor={colors.text3}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close" size={14} color={colors.text3} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4, marginBottom: 16 }}>
          {FILTERS.map(({ key, label }) => {
            const active = filter === key;
            const isArchived = key === "archived";
            const activeColor = isArchived ? "#f59e0b" : colors.blue;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setFilter(key)}
                style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100, backgroundColor: active ? activeColor : colors.bg3, borderWidth: active ? 0 : 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", gap: 6 }}
                activeOpacity={0.7}
              >
                <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: active ? "#fff" : colors.text3, textTransform: "capitalize" }}>{label}</Text>
                {isArchived && archivedWorkers.length > 0 && (
                  <View style={{ backgroundColor: active ? "rgba(255,255,255,0.25)" : colors.line, borderRadius: 100, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: active ? "#fff" : colors.text3 }}>{archivedWorkers.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* List */}
        {isLoading ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <ActivityIndicator color={colors.blue} />
          </View>
        ) : (
          <View style={{ backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, overflow: "hidden" }}>
            {filter === "archived" ? (
              filteredArchived.length === 0 ? (
                <Text style={{ fontSize: 14, color: colors.text3, textAlign: "center", paddingVertical: 32 }}>No archived workers</Text>
              ) : (
                filteredArchived.map((w: any, i: number) => (
                  <View
                    key={w._id}
                    style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: i < filteredArchived.length - 1 ? 1 : 0, borderColor: colors.line }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: colors.text3 }}>{getInitials(w.name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.text3 }}>{w.name}</Text>
                      <Text style={{ fontSize: 11, color: colors.text3, marginTop: 2 }}>{w.occupation} · {w.sites?.[0]?.name ?? "No site"}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRestore(w._id)}
                      disabled={restoringId === w._id}
                      style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.blue + "1a", opacity: restoringId === w._id ? 0.5 : 1 }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="refresh-outline" size={11} color={colors.blue} />
                      <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: colors.blue }}>
                        {restoringId === w._id ? "…" : "Restore"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )
            ) : filtered.length === 0 ? (
              <Text style={{ fontSize: 14, color: colors.text3, textAlign: "center", paddingVertical: 32 }}>No workers found</Text>
            ) : (
              filtered.map((w: any, i: number) => (
                <TouchableOpacity
                  key={w._id}
                  onPress={() => navigation.navigate("WorkerDetail", { workerId: w._id })}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: i < filtered.length - 1 ? 1 : 0, borderColor: colors.line }}
                  activeOpacity={0.7}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 12, fontFamily: fonts.bold, color: "#fff" }}>{getInitials(w.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.text }}>{w.name}</Text>
                    <Text style={{ fontSize: 11, color: colors.text3, marginTop: 2 }}>{w.occupation} · {w.sites?.[0]?.name ?? "No site"}</Text>
                  </View>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, backgroundColor: w.isActivated ? colors.green + "26" : "#f59e0b26" }}>
                    <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: w.isActivated ? colors.green : "#f59e0b" }}>
                      {w.isActivated ? "Active" : "Pending"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {showAddSheet && (
        <AddWorkerSheet
          onClose={() => setShowAddSheet(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["workers"] });
          }}
        />
      )}
    </SafeAreaView>
  );
}
