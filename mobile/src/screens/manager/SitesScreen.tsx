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
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getSites, createSite } from "../../api/manager";
import { colors, fonts } from "../../theme";
import type { ManagerStackParamList } from "../../navigation/ManagerNavigator";

type Nav = NativeStackNavigationProp<ManagerStackParamList>;

// ── Types ──────────────────────────────────────────────────────────────────────

type Worker = { _id: string; name: string };
type Site = {
  _id: string;
  name: string;
  address: string;
  status: "active" | "archived";
  workers: Worker[];
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [colors.blue, colors.green, colors.red, "#f59e0b", colors.purple];

function getInitials(name: string) {
  return (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ── Worker Avatars ─────────────────────────────────────────────────────────────

function WorkerAvatars({ workers }: { workers: Worker[] }) {
  const visible = workers.slice(0, 3);
  const extra = workers.length - visible.length;
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {visible.map((w, i) => (
        <View
          key={w._id}
          style={{
            width: 26, height: 26, borderRadius: 13,
            backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
            alignItems: "center", justifyContent: "center",
            marginLeft: i === 0 ? 0 : -8,
            zIndex: visible.length - i,
            borderWidth: 2, borderColor: colors.bg3,
          }}
        >
          <Text style={{ fontSize: 9, fontFamily: fonts.bold, color: "#fff" }}>
            {getInitials(w.name)}
          </Text>
        </View>
      ))}
      {extra > 0 && (
        <View
          style={{
            width: 26, height: 26, borderRadius: 13,
            backgroundColor: colors.bg2,
            alignItems: "center", justifyContent: "center",
            marginLeft: -8, zIndex: 0,
            borderWidth: 2, borderColor: colors.bg3,
          }}
        >
          <Text style={{ fontSize: 9, fontFamily: fonts.bold, color: colors.text3 }}>
            +{extra}
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Site Card ──────────────────────────────────────────────────────────────────

function SiteCard({ site, onPress }: { site: Site; onPress: () => void }) {
  const archived = site.status === "archived";
  const statColor = archived ? colors.text3 : colors.blue;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        opacity: archived ? 0.5 : 1,
        backgroundColor: colors.bg3,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: archived ? colors.text3 : colors.text }}>
        {site.name}
      </Text>
      <Text style={{ fontSize: 12, color: colors.text3, marginTop: 2 }}>{site.address}</Text>

      {/* Stats row */}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        {[
          { value: "0", label: "On shift" },
          { value: "0h", label: "Today" },
          { value: String(site.workers.length), label: "Workers" },
        ].map(({ value, label }) => (
          <View
            key={label}
            style={{
              flex: 1,
              backgroundColor: colors.bg2,
              borderRadius: 12,
              paddingVertical: 8,
              paddingHorizontal: 4,
              alignItems: "center",
            }}
          >
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: statColor }}>{value}</Text>
            <Text style={{ fontSize: 10, color: colors.text3, marginTop: 2 }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <WorkerAvatars workers={site.workers} />
        {archived ? (
          <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 10, fontFamily: fonts.semibold, color: colors.text3 }}>Archived</Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green }} />
            <Text style={{ fontSize: 10, fontFamily: fonts.semibold, color: colors.green }}>Active</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Add Site Sheet ─────────────────────────────────────────────────────────────

function AddSiteSheet({ onClose, onCreated }: { onClose: () => void; onCreated: (site: Site) => void }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const insets = useSafeAreaInsets();

  const mutation = useMutation({
    mutationFn: () => createSite({ name: name.trim(), address: address.trim() }),
    onSuccess: (res) => onCreated(res.data.data ?? res.data),
    onError: (err: any) => setError(err?.response?.data?.message ?? "Something went wrong"),
  });

  const handleSubmit = () => {
    if (!name.trim() || !address.trim()) { setError("Please fill in all fields"); return; }
    setError("");
    mutation.mutate();
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)" }}
          onPress={onClose}
          activeOpacity={1}
        />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
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
            {/* Drag handle */}
            <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}>
              <View>
                <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.text }}>New Site</Text>
                <Text style={{ fontSize: 12, color: colors.text3, marginTop: 2 }}>Add a work location</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.bg3 }}
              >
                <Ionicons name="close" size={15} color={colors.text3} />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={{ gap: 12, paddingHorizontal: 20 }}>
              {/* Site name */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5, paddingLeft: 4 }}>
                  Site name
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 }}>
                  <Ionicons name="business-outline" size={15} color={colors.text3} />
                  <TextInput
                    style={{ flex: 1, fontSize: 14, fontFamily: fonts.regular, color: colors.text }}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Manchester City Centre"
                    placeholderTextColor={colors.text3}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Address */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5, paddingLeft: 4 }}>
                  Address
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 }}>
                  <Ionicons name="location-outline" size={15} color={colors.text3} />
                  <TextInput
                    style={{ flex: 1, fontSize: 14, fontFamily: fonts.regular, color: colors.text }}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="e.g. 12 King St, Manchester"
                    placeholderTextColor={colors.text3}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {error ? (
                <Text style={{ fontSize: 12, color: colors.red, paddingLeft: 4 }}>{error}</Text>
              ) : null}

              <TouchableOpacity
                style={{ backgroundColor: colors.blue, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 4, opacity: mutation.isPending ? 0.5 : 1 }}
                onPress={handleSubmit}
                disabled={mutation.isPending}
                activeOpacity={0.8}
              >
                {mutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: "#fff" }}>Create Site</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function SitesScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [showAddSheet, setShowAddSheet] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: () => getSites().then((r) => r.data),
  });

  const sites: Site[] = data?.data ?? data ?? [];
  const activeSites = sites.filter((s) => s.status === "active");
  const archivedSites = sites.filter((s) => s.status === "archived");

  const handleCreated = (newSite: Site) => {
    queryClient.setQueryData(["sites"], (old: any) => {
      const arr: Site[] = old?.data ?? old ?? [];
      const next = [newSite, ...arr];
      return old?.data ? { ...old, data: next } : next;
    });
    setShowAddSheet(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 24, color: colors.text }}>Sites</Text>
          <TouchableOpacity
            onPress={() => setShowAddSheet(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.blue, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 }}
            activeOpacity={0.8}
          >
            <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#fff", lineHeight: 20 }}>+</Text>
            <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: "#fff" }}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Summary */}
        {sites.length > 0 && (
          <Text style={{ fontSize: 10, fontFamily: fonts.semibold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>
            {activeSites.length} active · {archivedSites.length} archived
          </Text>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={{ alignItems: "center", marginTop: 48 }}>
            <ActivityIndicator color={colors.blue} />
          </View>
        )}

        {/* Empty state */}
        {!isLoading && sites.length === 0 && (
          <Text style={{ fontSize: 14, color: colors.text3, textAlign: "center", marginTop: 64 }}>
            No sites yet. Tap + Add to create one.
          </Text>
        )}

        {/* Active sites */}
        {!isLoading && (
          <View style={{ gap: 12 }}>
            {activeSites.map((site) => (
              <SiteCard
                key={site._id}
                site={site}
                onPress={() => navigation.navigate("SiteDetail", { siteId: site._id })}
              />
            ))}

            {archivedSites.length > 0 && (
              <>
                <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5, marginTop: 12 }}>
                  Archived
                </Text>
                {archivedSites.map((site) => (
                  <SiteCard
                    key={site._id}
                    site={site}
                    onPress={() => navigation.navigate("SiteDetail", { siteId: site._id })}
                  />
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {showAddSheet && (
        <AddSiteSheet
          onClose={() => setShowAddSheet(false)}
          onCreated={handleCreated}
        />
      )}
    </SafeAreaView>
  );
}
