import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getMe, changePassword } from "../../api/user";
import { colors, fonts } from "../../theme";

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const formatMemberSince = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

type IconRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value: string;
};

function IconRow({ icon, iconColor = colors.blue, label, value }: IconRowProps) {
  return (
    <View className="flex-row items-center px-4 py-3.5 gap-3">
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: iconColor + "18",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <Text className="flex-1 text-sm text-text3">{label}</Text>
      <Text className="text-sm text-text" style={{ fontFamily: fonts.semibold }}>{value}</Text>
    </View>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  visible,
  onToggle,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="flex-row items-center bg-bg2 border border-line rounded-xl px-4">
      <TextInput
        className="flex-1 text-text"
        style={{ paddingVertical: 12, fontSize: 14, fontFamily: fonts.regular }}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        secureTextEntry={!visible}
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons
          name={visible ? "eye-off-outline" : "eye-outline"}
          size={17}
          color={colors.text3}
        />
      </TouchableOpacity>
    </View>
  );
}

export default function ProfileScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation();

  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const { data: meData, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    select: (r) => r.data.data,
  });

  const pwMutation = useMutation({
    mutationFn: () => changePassword({ currentPassword: currentPw, newPassword: newPw }),
    onSuccess: () => {
      setPwSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => { setShowChangePw(false); setPwSuccess(false); }, 1500);
    },
    onError: (err: any) => {
      setPwError(err?.response?.data?.message ?? "Something went wrong");
    },
  });

  const handleChangePw = () => {
    setPwError(null); setPwSuccess(false);
    if (newPw !== confirmPw) { setPwError("New passwords do not match"); return; }
    if (newPw.length < 6) { setPwError("Password must be at least 6 characters"); return; }
    pwMutation.mutate();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color={colors.blue} />
      </SafeAreaView>
    );
  }

  const managerName = meData?.company?.managers?.[0]?.name ?? "—";

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <TouchableOpacity
          className="flex-row items-center gap-0.5 mt-4 mb-2"
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={16} color={colors.blue} />
          <Text className="text-sm text-blue">Back</Text>
        </TouchableOpacity>

        {/* ── Hero ── */}
        <View className="items-center mt-4 mb-8">
          {/* Avatar with ring */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 2,
              borderColor: colors.blue + "40",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                backgroundColor: colors.blue,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 24, fontFamily: fonts.bold, color: "#fff" }}>
                {getInitials(meData?.name ?? "?")}
              </Text>
            </View>
          </View>

          <Text className="text-xl text-text mb-2" style={{ fontFamily: fonts.bold }}>
            {meData?.name ?? "—"}
          </Text>

          {/* Worker badge */}
          <View className="flex-row items-center gap-2 bg-bg3 border border-line rounded-full px-3.5 py-1.5">
            <View className="w-1.5 h-1.5 rounded-full bg-green" />
            <Text className="text-xs text-text2" style={{ fontFamily: fonts.medium }}>
              Worker · {meData?.sites?.[0]?.name ?? "No project"}
            </Text>
          </View>
        </View>

        {/* ── Account ── */}
        <Text className="text-[10px] text-text3 uppercase tracking-widest mb-2" style={{ fontFamily: fonts.bold }}>
          Account
        </Text>
        <View className="bg-bg3 border border-line rounded-2xl mb-5 overflow-hidden">
          <IconRow icon="mail-outline" iconColor={colors.blue} label="Email" value={meData?.email ?? "—"} />
          <View className="h-px bg-line mx-4" />
          <IconRow icon="business-outline" iconColor={colors.purple} label="Company" value={meData?.company?.name ?? "—"} />
          <View className="h-px bg-line mx-4" />
          <IconRow icon="person-outline" iconColor={colors.green} label="Manager" value={managerName} />
          <View className="h-px bg-line mx-4" />
          <IconRow icon="calendar-outline" iconColor={colors.amber} label="Member since" value={meData?.createdAt ? formatMemberSince(meData.createdAt) : "—"} />
        </View>

        {/* ── Settings ── */}
        <Text className="text-[10px] text-text3 uppercase tracking-widest mb-2" style={{ fontFamily: fonts.bold }}>
          Settings
        </Text>
        <View className="bg-bg3 border border-line rounded-2xl mb-5 overflow-hidden">

          {/* Change password row */}
          <TouchableOpacity
            className="flex-row items-center px-4 py-3.5 gap-3"
            onPress={() => { setShowChangePw((v) => !v); setPwError(null); setPwSuccess(false); }}
            activeOpacity={0.7}
          >
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.red + "18", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="lock-closed-outline" size={17} color={colors.red} />
            </View>
            <Text className="flex-1 text-sm text-text" style={{ fontFamily: fonts.semibold }}>Change password</Text>
            <Ionicons
              name={showChangePw ? "chevron-down" : "chevron-forward"}
              size={16}
              color={colors.text3}
            />
          </TouchableOpacity>

          {showChangePw && (
            <View className="px-4 pb-4" style={{ gap: 10 }}>
              <PasswordInput
                value={currentPw}
                onChange={setCurrentPw}
                placeholder="Current password"
                visible={showCurrent}
                onToggle={() => setShowCurrent((v) => !v)}
              />
              <PasswordInput
                value={newPw}
                onChange={setNewPw}
                placeholder="New password"
                visible={showNew}
                onToggle={() => setShowNew((v) => !v)}
              />
              <PasswordInput
                value={confirmPw}
                onChange={setConfirmPw}
                placeholder="Confirm new password"
                visible={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
              />

              {pwError && <Text className="text-xs text-red">{pwError}</Text>}
              {pwSuccess && <Text className="text-xs text-green">Password updated successfully</Text>}

              <TouchableOpacity
                className={`bg-blue rounded-xl py-3 items-center ${pwMutation.isPending ? "opacity-50" : ""}`}
                onPress={handleChangePw}
                disabled={pwMutation.isPending}
                activeOpacity={0.8}
              >
                {pwMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-sm text-white" style={{ fontFamily: fonts.bold }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View className="h-px bg-line mx-4" />

          {/* Notifications row */}
          <View className="flex-row items-center px-4 py-3.5 gap-3">
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.blue + "18", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="notifications-outline" size={17} color={colors.blue} />
            </View>
            <Text className="flex-1 text-sm text-text" style={{ fontFamily: fonts.semibold }}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.line, true: colors.blue }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* ── Sign out ── */}
        <TouchableOpacity
          className="flex-row items-center justify-center gap-2.5 bg-red/10 border border-red/25 rounded-2xl py-4"
          onPress={logout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.red} />
          <Text className="text-base text-red" style={{ fontFamily: fonts.bold }}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
