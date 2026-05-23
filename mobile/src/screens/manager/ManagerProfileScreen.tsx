import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  Modal, TextInput, ActivityIndicator,
  Switch, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { getMe, updateProfile, changePassword } from "../../api/user";
import { colors, fonts } from "../../theme";

function getInitials(name: string) {
  return (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatMemberSince(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── Password input with eye toggle ────────────────────────────────────────────

function PasswordInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 16 }}>
      <TextInput
        style={{ flex: 1, paddingVertical: 12, fontSize: 14, fontFamily: fonts.regular, color: colors.text }}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        secureTextEntry={!show}
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={() => setShow((v) => !v)}>
        <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={16} color={colors.text3} />
      </TouchableOpacity>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ManagerProfileScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  // ── Edit profile sheet ─────────────────────────────────────────────────────
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editError, setEditError] = useState("");

  // ── Change password ────────────────────────────────────────────────────────
  const [showPw, setShowPw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  // ── Notifications toggle ───────────────────────────────────────────────────
  const [notifs, setNotifs] = useState(true);

  const { data: meRaw, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe().then((r) => r.data),
  });

  const user = meRaw?.data ?? meRaw ?? null;

  const editMutation = useMutation({
    mutationFn: (data: { name: string; email: string }) => updateProfile(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setShowEdit(false);
    },
    onError: (err: any) => setEditError(err?.response?.data?.message ?? "Something went wrong"),
  });

  const pwMutation = useMutation({
    mutationFn: () => changePassword({ currentPassword: currentPw, newPassword: newPw }),
    onSuccess: () => {
      setPwSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => { setShowPw(false); setPwSuccess(false); }, 1500);
    },
    onError: (err: any) => setPwError(err?.response?.data?.message ?? "Something went wrong"),
  });

  const handleEditSave = () => {
    if (!editName.trim()) { setEditError("Name is required"); return; }
    if (!editEmail.trim()) { setEditError("Email is required"); return; }
    setEditError("");
    editMutation.mutate({ name: editName.trim(), email: editEmail.trim() });
  };

  const handlePwSave = () => {
    setPwError(""); setPwSuccess(false);
    if (newPw !== confirmPw) { setPwError("Passwords do not match"); return; }
    if (newPw.length < 8) { setPwError("Password must be at least 8 characters"); return; }
    pwMutation.mutate();
  };

  if (isLoading || !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.blue} />
      </SafeAreaView>
    );
  }

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
          <Text style={{ fontSize: 14, color: colors.blue, fontFamily: fonts.medium }}>Back</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.green, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: colors.green + "33", marginBottom: 16 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 26, color: "#fff" }}>{getInitials(user.name)}</Text>
          </View>
          <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: colors.text }}>{user.name}</Text>
          <Text style={{ fontSize: 13, color: colors.text3, marginTop: 4 }}>{user.email}</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: colors.green + "26" }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: colors.green }}>● Manager</Text>
            </View>
            {user.company?.name && (
              <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: colors.blue + "1a" }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: colors.blue }}>{user.company.name}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => { setEditName(user.name); setEditEmail(user.email); setEditError(""); setShowEdit(true); }}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16 }}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={14} color={colors.blue} />
            <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: colors.blue }}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Info</Text>
        <View style={{ backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
          {[
            { icon: "mail-outline", label: "Email", value: user.email, color: colors.blue },
            { icon: "business-outline", label: "Company", value: user.company?.name ?? "—", color: colors.text },
            { icon: "calendar-outline", label: "Member since", value: formatMemberSince(user.createdAt), color: colors.text },
          ].map(({ icon, label, value, color }, i, arr) => (
            <View
              key={label}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderColor: colors.line }}
            >
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.bg2, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={icon as any} size={14} color={colors.text3} />
              </View>
              <Text style={{ fontSize: 14, color: colors.text3, flex: 1 }}>{label}</Text>
              <Text style={{ fontSize: 14, fontFamily: fonts.semibold, color }}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Settings */}
        <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Settings</Text>
        <View style={{ backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
          {/* Change password */}
          <View style={{ borderBottomWidth: 1, borderColor: colors.line }}>
            <TouchableOpacity
              onPress={() => { setShowPw((v) => !v); setPwError(""); setPwSuccess(false); }}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}
              activeOpacity={0.7}
            >
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.bg2, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="lock-closed-outline" size={14} color={colors.text3} />
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontFamily: fonts.semibold, color: colors.text }}>Change password</Text>
              <Ionicons name={showPw ? "chevron-down" : "chevron-forward"} size={16} color={colors.text3} />
            </TouchableOpacity>

            {showPw && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
                <PasswordInput placeholder="Current password" value={currentPw} onChange={setCurrentPw} />
                <PasswordInput placeholder="New password" value={newPw} onChange={setNewPw} />
                <PasswordInput placeholder="Confirm new password" value={confirmPw} onChange={setConfirmPw} />
                {pwError ? <Text style={{ fontSize: 12, color: colors.red }}>{pwError}</Text> : null}
                {pwSuccess ? <Text style={{ fontSize: 12, color: colors.green }}>Password updated successfully</Text> : null}
                <TouchableOpacity
                  onPress={handlePwSave}
                  disabled={pwMutation.isPending}
                  style={{ backgroundColor: colors.blue, borderRadius: 12, paddingVertical: 12, alignItems: "center", opacity: pwMutation.isPending ? 0.5 : 1 }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: "#fff" }}>
                    {pwMutation.isPending ? "Saving…" : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Notifications */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.bg2, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="notifications-outline" size={14} color={colors.text3} />
            </View>
            <Text style={{ flex: 1, fontSize: 14, fontFamily: fonts.semibold, color: colors.text }}>Notifications</Text>
            <Switch
              value={notifs}
              onValueChange={setNotifs}
              trackColor={{ false: colors.line, true: colors.blue + "80" }}
              thumbColor={notifs ? colors.blue : colors.text3}
            />
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          onPress={logout}
          style={{ backgroundColor: colors.red + "1a", borderWidth: 1, borderColor: colors.red + "4d", borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
          activeOpacity={0.8}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: colors.red }}>Sign out</Text>
          <Text style={{ fontSize: 14, color: colors.red }}>→</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Sheet */}
      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)" }} onPress={() => setShowEdit(false)} activeOpacity={1} />
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: colors.line, paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}>
              <View style={{ alignItems: "center", paddingVertical: 12 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line }} />
              </View>
              <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginBottom: 20 }}>Edit Profile</Text>
              <View style={{ gap: 12 }}>
                {[
                  { label: "Full name", value: editName, onChange: setEditName, keyboard: "default" as const },
                  { label: "Email", value: editEmail, onChange: setEditEmail, keyboard: "email-address" as const },
                ].map(({ label, value, onChange, keyboard }) => (
                  <View key={label} style={{ gap: 6 }}>
                    <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: colors.text3, textTransform: "uppercase", letterSpacing: 1.5, paddingLeft: 4 }}>{label}</Text>
                    <TextInput
                      style={{ backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, fontFamily: fonts.regular, color: colors.text }}
                      value={value}
                      onChangeText={onChange}
                      keyboardType={keyboard}
                      autoCapitalize={keyboard === "email-address" ? "none" : "words"}
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
