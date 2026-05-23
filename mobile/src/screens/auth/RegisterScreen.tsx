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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { registerManager, checkEmail as checkEmailApi } from "../../api/auth";
import { colors, fonts } from "../../theme";

type Props = { onBack: () => void };

const STEP_LABELS = ["Your details", "First site", "Done"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAS_DIGIT = /\d/;

type Field = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
  keyboard?: "default" | "email-address";
};

function FormField({ label, placeholder, value, onChange, secure, keyboard }: Field) {
  const [show, setShow] = useState(false);
  return (
    <View>
      <Text
        className="text-xs text-text3 uppercase tracking-wide mb-2"
        style={{ fontFamily: fonts.semibold }}
      >
        {label}
      </Text>
      <View className="flex-row items-center bg-bg3 border border-line rounded-2xl px-4">
        <TextInput
          className="flex-1 text-text"
          style={{ paddingVertical: 13, fontSize: 15, fontFamily: fonts.regular }}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.text3}
          secureTextEntry={secure && !show}
          autoCapitalize={keyboard === "email-address" ? "none" : secure ? "none" : "words"}
          keyboardType={keyboard ?? "default"}
          autoComplete={keyboard === "email-address" ? "email" : secure ? "password" : "off"}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShow((v) => !v)}>
            <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={18} color={colors.text3} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function RegisterScreen({ onBack }: Props) {
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [error, setError] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [successData, setSuccessData] = useState<{ name: string; role: string; token: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () => registerManager({ name, companyName: company, email, password, siteName, siteAddress }),
    onSuccess: (res) => {
      const d = res.data.data;
      setSuccessData({ name: d.name, role: d.role, token: d.token });
      setStep(3);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message ?? "Something went wrong");
    },
  });

  const handleStep1 = async () => {
    if (name.trim().length < 2)    { setError("Name must be at least 2 characters"); return; }
    if (!company.trim())            { setError("Company name is required"); return; }
    if (!EMAIL_RE.test(email.trim())) { setError("Enter a valid email address"); return; }
    if (password.length < 8)        { setError("Password must be at least 8 characters"); return; }
    if (!HAS_DIGIT.test(password))  { setError("Password must contain at least one number"); return; }

    setError("");
    setCheckingEmail(true);
    try {
      const res = await checkEmailApi(email.trim());
      if (!res.data.available) {
        setError("An account with this email already exists");
        setCheckingEmail(false);
        return;
      }
    } catch {
      // endpoint unavailable — let registration catch duplicates
    } finally {
      setCheckingEmail(false);
    }
    setStep(2);
  };

  const handleStep2 = () => {
    if (siteName.trim().length < 2)    { setError("Site name is required"); return; }
    if (siteAddress.trim().length < 5) { setError("Enter a full address"); return; }
    setError("");
    mutation.mutate();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      {/* Full-screen loading overlay while registering */}
      <Modal visible={mutation.isPending} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(10,10,15,0.88)",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: colors.bg3,
              borderWidth: 1,
              borderColor: colors.line,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator size="large" color={colors.blue} />
          </View>
          <View style={{ alignItems: "center", gap: 6 }}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: colors.text }}>
              Creating your company…
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.text2 }}>
              This only takes a moment
            </Text>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          {step < 3 && (
            <TouchableOpacity
              className="flex-row items-center gap-0.5 mb-8"
              onPress={() => (step === 1 ? onBack() : setStep((s) => s - 1))}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={16} color={colors.blue} />
              <Text className="text-sm text-blue">Back</Text>
            </TouchableOpacity>
          )}

          {/* Header */}
          <View className="mb-5">
            <Text className="text-xl text-text tracking-tight" style={{ fontFamily: fonts.bold }}>
              Create company
            </Text>
            <Text className="text-xs text-text2 mt-1">Set up your manager account</Text>
          </View>

          {/* Progress bar */}
          {step < 3 && (
            <>
              <View className="flex-row gap-1.5 mb-1">
                {[1, 2, 3].map((s) => (
                  <View
                    key={s}
                    className={`flex-1 h-1 rounded-full ${s <= step ? "bg-green" : "bg-bg3"}`}
                  />
                ))}
              </View>
              <Text className="text-xs text-text3 mb-6">
                Step {step} of 3 — {STEP_LABELS[step - 1]}
              </Text>
            </>
          )}

          {/* ── Step 1: Your details ── */}
          {step === 1 && (
            <View style={{ gap: 16 }}>
              <FormField label="Full name" placeholder="Sara Chen" value={name} onChange={setName} />
              <FormField label="Company name" placeholder="ConstructCo Ltd" value={company} onChange={setCompany} />
              <FormField label="Email address" placeholder="you@company.com" value={email} onChange={setEmail} keyboard="email-address" />
              <FormField label="Password" placeholder="Min 8 chars + one number" value={password} onChange={setPassword} secure />

              {error ? <Text className="text-xs text-red">{error}</Text> : null}

              <TouchableOpacity
                className={`bg-blue rounded-2xl py-4 items-center mt-1 ${checkingEmail ? "opacity-60" : ""}`}
                onPress={handleStep1}
                disabled={checkingEmail}
                activeOpacity={0.8}
              >
                {checkingEmail ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-sm" style={{ fontFamily: fonts.semibold }}>Continue →</Text>
                )}
              </TouchableOpacity>

              <Text className="text-xs text-text3 text-center">
                Have an account?{" "}
                <Text className="text-blue" onPress={onBack}>Sign in</Text>
              </Text>
            </View>
          )}

          {/* ── Step 2: First site ── */}
          {step === 2 && (
            <View style={{ gap: 16 }}>
              <FormField label="Site name" placeholder="Main warehouse" value={siteName} onChange={setSiteName} />
              <FormField label="Site address" placeholder="123 Builder St, Tallinn" value={siteAddress} onChange={setSiteAddress} />

              {error ? <Text className="text-xs text-red">{error}</Text> : null}

              <TouchableOpacity
                className="bg-blue rounded-2xl py-4 items-center mt-1"
                onPress={handleStep2}
                activeOpacity={0.8}
              >
                <Text className="text-white text-sm" style={{ fontFamily: fonts.semibold }}>Continue →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <View className="flex-1 items-center justify-center" style={{ gap: 16, paddingVertical: 24 }}>
              <View className="w-14 h-14 rounded-full bg-green/10 items-center justify-center">
                <Ionicons name="checkmark-circle" size={28} color={colors.green} />
              </View>
              <View className="items-center">
                <Text className="text-lg text-text" style={{ fontFamily: fonts.bold }}>You're all set!</Text>
                <Text className="text-xs text-text2 mt-1">Your company and first site are ready.</Text>
              </View>
              <TouchableOpacity
                className="bg-green rounded-2xl py-4 px-8 items-center mt-2"
                onPress={() => {
                  if (successData) {
                    login({ name: successData.name, role: successData.role as "manager" }, successData.token);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text className="text-white text-sm" style={{ fontFamily: fonts.semibold }}>Go to dashboard</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
