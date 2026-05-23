import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  Modal, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getWorker, removeWorker, sendInvite, updateWorker } from "../../api/manager";
import { colors, fonts } from "../../theme";
import type { ManagerStackParamList } from "../../navigation/ManagerNavigator";

type Nav = NativeStackNavigationProp<ManagerStackParamList>;
type Route = RouteProp<ManagerStackParamList, "WorkerDetail">;

function getInitials(name: string) {
  return (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ── Confirm Archive Sheet ──────────────────────────────────────────────────────

function ConfirmArchiveSheet({
  workerName, onCancel, onConfirm, loading,
}: { workerName: string; onCancel: () => void; onConfirm: () => void; loading: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onCancel}>
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)" }} onPress={onCancel} activeOpacity={1} />
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: colors.line, paddingHorizontal: 20, paddingTop: 20, paddingBottom: insets.bottom + 24 }}>
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.red + "1a", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Ionicons name="warning-outline" size={22} color={colors.red} />
            </View>
            <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: colors.text, textAlign: "center" }}>Archive worker?</Text>
            <Text style={{ fontSize: 13, color: colors.text3, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
              <Text style={{ fontFamily: fonts.semibold, color: colors.text }}>{workerName}</Text>
              {" "}will be archived and removed from the workers list. They can be restored later.
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={onCancel}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, alignItems: "center" }}
              activeOpacity={0.8}
            >
              <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.text }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.red, alignItems: "center", opacity: loading ? 0.5 : 1 }}
              activeOpacity={0.8}
            >
              <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: "#fff" }}>
                {loading ? "Archiving…" : "Archive"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function WorkerDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { workerId } = route.params;
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const [showConfirm, setShowConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editOccupation, setEditOccupation] = useState("");
  const [editError, setEditError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const { data: workerRaw, isLoading } = useQuery({
    queryKey: ["worker", workerId],
    queryFn: () => getWorker(workerId).then((r) => r.data),
  });

  const [localWorker, setLocalWorker] = useState<any>(null);
  const worker = localWorker ?? (workerRaw?.data ?? workerRaw ?? null);

  const removeMutation = useMutation({
    mutationFn: () => removeWorker(workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      queryClient.invalidateQueries({ queryKey: ["archivedWorkers"] });
      navigation.goBack();
    },
    onError: () => setShowConfirm(false),
  });

  const editMutation = useMutation({
    mutationFn: () => updateWorker(workerId, { name: editName.trim(), email: editEmail.trim(), occupation: editOccupation.trim() }),
    onSuccess: (res) => {
      setLocalWorker(res.data.data ?? res.data);
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      setShowEdit(false);
    },
    onError: (err: any) => setEditError(err?.response?.data?.message ?? "Something went wrong"),
  });

  const handleEditSave = () => {
    if (!editName.trim()) { setEditError("Name is required"); return; }
    if (!editEmail.trim()) { setEditError("Email is required"); return; }
    setEditError("");
    editMutation.mutate();
  };

  const handleSendInvite = async () => {
    setInviting(true);
    setInviteMsg(null);
    try {
      await sendInvite(workerId);
      setInviteMsg({ ok: true, text: "Invite sent successfully!" });
    } catch {
      setInviteMsg({ ok: false, text: "Failed to send invite." });
    } finally {
      setInviting(false);
    }
  };

  if (isLoading || !worker) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.blue} />
      </SafeAreaView>
    );
  }

  const initials = getInitials(worker.name);
  const joinedDate = new Date(worker.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Back + Edit */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={16} color={colors.blue} />
            <Text style={{ fontSize: 14, color: colors.blue, fontFamily: fonts.medium }}>Workers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setEditName(worker.name); setEditEmail(worker.email); setEditOccupation(worker.occupation ?? ""); setEditError(""); setShowEdit(true); }}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={14} color={colors.blue} />
            <Text style={{ fontSize: 14, fontFamily: fonts.semibold, color: colors.blue }}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: colors.blue + "33", marginBottom: 16 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 26, color: "#fff" }}>{initials}</Text>
          </View>
          <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: colors.text }}>{worker.name}</Text>
          <Text style={{ fontSize: 13, color: colors.text3, marginTop: 4 }}>{worker.occupation}</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: worker.isActivated ? colors.green + "26" : "#f59e0b26" }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: worker.isActivated ? colors.green : "#f59e0b" }}>
                {worker.isActivated ? "● Active" : "⏳ Pending"}
              </Text>
            </View>
            {worker.sites?.[0] && (
              <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: colors.blue + "1a" }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: colors.blue }}>{worker.sites[0].name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Info */}
        <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Info</Text>
        <View style={{ backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
          {[
            { icon: "mail-outline", label: "Email", value: worker.email, color: colors.blue },
            { icon: "briefcase-outline", label: "Occupation", value: worker.occupation ?? "—", color: colors.text },
            { icon: "location-outline", label: "Site", value: worker.sites?.[0]?.name ?? "No site", color: colors.text },
            { icon: "calendar-outline", label: "Joined", value: joinedDate, color: colors.text },
          ].map(({ icon, label, value, color }, i, arr) => (
            <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderColor: colors.line }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.bg2, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={icon as any} size={14} color={colors.text3} />
              </View>
              <Text style={{ fontSize: 14, color: colors.text3, flex: 1 }}>{label}</Text>
              <Text style={{ fontSize: 14, fontFamily: fonts.semibold, color }}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Actions</Text>
        <View style={{ backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
          <TouchableOpacity
            onPress={handleSendInvite}
            disabled={inviting}
            style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, opacity: inviting ? 0.5 : 1 }}
            activeOpacity={0.7}
          >
            <Text style={{ flex: 1, fontSize: 14, fontFamily: fonts.semibold, color: colors.text }}>
              {inviting ? "Sending…" : "Resend invite email"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text3} />
          </TouchableOpacity>
        </View>
        {inviteMsg && (
          <Text style={{ fontSize: 12, color: inviteMsg.ok ? colors.green : colors.red, paddingLeft: 4, marginBottom: 12 }}>
            {inviteMsg.text}
          </Text>
        )}

        {/* Archive */}
        <TouchableOpacity
          onPress={() => setShowConfirm(true)}
          style={{ backgroundColor: colors.red + "1a", borderWidth: 1, borderColor: colors.red + "4d", borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
          activeOpacity={0.8}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.red }}>Archive worker</Text>
          <Text style={{ fontSize: 14, color: colors.red }}>→</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Confirm archive */}
      {showConfirm && (
        <ConfirmArchiveSheet
          workerName={worker.name}
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => removeMutation.mutate()}
          loading={removeMutation.isPending}
        />
      )}

      {/* Edit worker sheet */}
      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)" }} onPress={() => setShowEdit(false)} activeOpacity={1} />
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: colors.line, paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}>
              <View style={{ alignItems: "center", paddingVertical: 12 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line }} />
              </View>
              <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginBottom: 20 }}>Edit Worker</Text>
              <View style={{ gap: 12 }}>
                {[
                  { label: "Full name", value: editName, onChange: setEditName, keyboard: "default" as const, cap: "words" as const },
                  { label: "Email", value: editEmail, onChange: setEditEmail, keyboard: "email-address" as const, cap: "none" as const },
                  { label: "Occupation", value: editOccupation, onChange: setEditOccupation, keyboard: "default" as const, cap: "words" as const },
                ].map(({ label, value, onChange, keyboard, cap }) => (
                  <View key={label} style={{ gap: 6 }}>
                    <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5, paddingLeft: 4 }}>{label}</Text>
                    <TextInput
                      style={{ backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, fontFamily: fonts.regular, color: colors.text }}
                      value={value}
                      onChangeText={onChange}
                      keyboardType={keyboard}
                      autoCapitalize={cap}
                    />
                  </View>
                ))}
                {editError ? <Text style={{ fontSize: 12, color: colors.red, paddingLeft: 4 }}>{editError}</Text> : null}
                <TouchableOpacity
                  onPress={handleEditSave}
                  disabled={editMutation.isPending}
                  style={{ backgroundColor: colors.blue, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 4, opacity: editMutation.isPending ? 0.5 : 1 }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: "#fff" }}>
                    {editMutation.isPending ? "Saving…" : "Save changes"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
