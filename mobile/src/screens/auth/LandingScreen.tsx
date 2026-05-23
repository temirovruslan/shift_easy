import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "../../theme";
import LoginScreen from "./LoginScreen";
import RegisterScreen from "./RegisterScreen";

export default function LandingScreen() {
  const [role, setRole] = useState<"worker" | "manager" | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  if (showRegister) {
    return <RegisterScreen onBack={() => setShowRegister(false)} />;
  }

  if (role) {
    return <LoginScreen role={role} onBack={() => setRole(null)} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-6 justify-center">

        {/* Logo */}
        <View className="items-center mb-8">
          <View className="w-11 h-11 rounded-xl bg-blue items-center justify-center mb-3">
            <Ionicons name="time-outline" size={22} color="#bddeff" />
          </View>
          <Text className="text-2xl text-text tracking-tight" style={{ fontFamily: fonts.bold }}>ShiftEasy</Text>
          <Text className="text-xs text-text2 mt-1">Construction time tracking</Text>
        </View>

        <Text className="text-xs text-text2 text-center mb-2.5">Choose how to continue</Text>

        {/* Worker card */}
        <TouchableOpacity
          className="flex-row items-center gap-3 bg-bg3 border border-blue/30 rounded-2xl p-3 mb-2"
          onPress={() => setRole("worker")}
        >
          <View className="w-9 h-9 rounded-xl bg-blue/10 items-center justify-center">
            <Ionicons name="person-outline" size={16} color={colors.blue} />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-text" style={{ fontFamily: fonts.semibold }}>I'm a worker</Text>
            <Text className="text-xs text-text2 mt-0.5">Sign in with invite credentials</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.blue} />
        </TouchableOpacity>

        {/* Manager card */}
        <TouchableOpacity
          className="flex-row items-center gap-3 bg-bg3 border border-green/30 rounded-2xl p-3 mb-2"
          onPress={() => setRole("manager")}
        >
          <View className="w-9 h-9 rounded-xl bg-green/10 items-center justify-center">
            <Ionicons name="mail-outline" size={16} color={colors.green} />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-text" style={{ fontFamily: fonts.semibold }}>I'm a manager</Text>
            <Text className="text-xs text-text2 mt-0.5">Sign in to your account</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.green} />
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center gap-2 my-3">
          <View className="flex-1 h-px bg-line" />
          <Text className="text-xs text-text3">no account?</Text>
          <View className="flex-1 h-px bg-line" />
        </View>

        {/* Register card */}
        <TouchableOpacity
          className="flex-row items-center gap-3 bg-bg3 border border-purple/30 rounded-2xl p-3"
          onPress={() => setShowRegister(true)}
        >
          <View className="w-9 h-9 rounded-xl bg-purple/10 items-center justify-center">
            <Ionicons name="add-outline" size={16} color={colors.purple} />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-purple" style={{ fontFamily: fonts.semibold }}>Register as manager</Text>
            <Text className="text-xs text-text2 mt-0.5">Create your company</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.purple} />
        </TouchableOpacity>

        <Text className="text-xs text-text3 text-center mt-6">
          Workers cannot create accounts — your manager registers you.
        </Text>
      </View>
    </SafeAreaView>
  );
}
