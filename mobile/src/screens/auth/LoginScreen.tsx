import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { loginManager, loginWorker } from "../../api/auth";
import { colors, fonts } from "../../theme";

type Props = {
  role: "worker" | "manager";
  onBack: () => void;
};

export default function LoginScreen({ role, onBack }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginFn = role === "manager" ? loginManager : loginWorker;

  const mutation = useMutation({
    mutationFn: () => loginFn({ email, password }),
    onSuccess: async (res) => {
      const { role: returnedRole, name, token } = res.data.data;
      if (returnedRole !== role) {
        setError(
          role === "manager"
            ? "This is the manager login. Your account is a worker account — please use the worker sign in page."
            : "This is the worker login. Your account is a manager account — please use the manager sign in page.",
        );
        return;
      }
      await login({ name, role: returnedRole }, token);
    },
    onError: (err: any) => {
      setError(
        err?.response?.data?.message ||
          "Wrong email or password. Please try again.",
      );
    },
  });

  const handleSubmit = () => {
    setError("");
    if (!email) {
      setError("Email is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    mutation.mutate();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingBottom: 40,
            justifyContent: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <TouchableOpacity
            className="flex-row items-center gap-0.5 mb-8"
            onPress={onBack}
          >
            <Ionicons name="chevron-back" size={16} color={colors.blue} />
            <Text className="text-sm text-blue">Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View className="mb-7">
            <Text
              className="text-xl text-text tracking-tight"
              style={{ fontFamily: fonts.bold }}
            >
              {role === "manager" ? "Manager sign in" : "Worker sign in"}
            </Text>
            <Text className="text-xs text-text2 mt-1">
              {role === "manager"
                ? "Access your team and dashboard"
                : "Enter your invite credentials"}
            </Text>
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text
              className="text-xs text-text3 uppercase tracking-wide mb-2"
              style={{ fontFamily: fonts.semibold }}
            >
              Email address
            </Text>
            <TextInput
              className="bg-bg3 border border-line rounded-2xl px-4 text-text"
              style={{
                paddingVertical: 13,
                fontSize: 15,
                fontFamily: fonts.regular,
              }}
              value={email}
              onChangeText={setEmail}
              placeholder="you@company.com"
              placeholderTextColor={colors.text3}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          {/* Password */}
          <View className="mb-1">
            <Text
              className="text-xs text-text3 uppercase tracking-wide mb-2"
              style={{ fontFamily: fonts.semibold }}
            >
              Password
            </Text>
            <View className="flex-row items-center bg-bg3 border border-line rounded-2xl px-4">
              <TextInput
                className="flex-1 text-text"
                style={{
                  paddingVertical: 13,
                  fontSize: 15,
                  fontFamily: fonts.regular,
                }}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.text3}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={colors.text3}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot password */}
          <TouchableOpacity className="items-end mb-4">
            <Text className="text-xs text-blue">Forgot password?</Text>
          </TouchableOpacity>

          {/* Error */}
          {error ? (
            <Text className="text-xs text-red mb-3">{error}</Text>
          ) : null}

          {/* Button */}
          <TouchableOpacity
            className={`rounded-2xl py-4 items-center mt-1 ${mutation.isPending ? "opacity-50" : ""} ${role === "manager" ? "bg-green" : "bg-blue"}`}
            onPress={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                className="text-white text-sm"
                style={{ fontFamily: fonts.semibold }}
              >
                {role === "manager" ? "Sign in as a manager" : "Sign in"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Worker info box */}
          {role === "worker" && (
            <>
              <View className="bg-blue/5 border border-blue/15 rounded-xl px-3.5 py-3 mt-4">
                <Text className="text-xs text-blue/80 leading-relaxed">
                  Your manager registered your account and sent you an invite
                  email. Use those credentials to sign in.
                </Text>
              </View>
              <Text className="text-xs text-text3 text-center mt-4">
                No invite yet?{" "}
                <Text className="text-blue">Contact manager</Text>
              </Text>
            </>
          )}

          {/* Manager info box */}
          {role === "manager" && (
            <>
              <View className="bg-bg3 border border-blue/15 rounded-xl px-3.5 py-3 mt-4">
                <Text
                  className="text-xs text-text3 uppercase tracking-wide mb-2"
                  style={{ fontFamily: fonts.bold }}
                >
                  Manager access includes
                </Text>
                <Text className="text-xs text-text2 mb-1">
                  → Add and manage workers
                </Text>
                <Text className="text-xs text-text2 mb-1">
                  → View live timesheets
                </Text>
                <Text className="text-xs text-text2">
                  → Mobile + desktop access
                </Text>
              </View>
              <View className="flex-row items-center gap-2 my-3">
                <View className="flex-1 h-px bg-line" />
                <Text className="text-xs text-text3">no account?</Text>
                <View className="flex-1 h-px bg-line" />
              </View>
              <TouchableOpacity>
                <Text className="text-sm text-blue text-center">
                  Create company account
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
