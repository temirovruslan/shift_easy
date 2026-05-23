import "./global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActivityIndicator, View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from "@expo-google-fonts/outfit";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LandingScreen from "./src/screens/auth/LandingScreen";
import WorkerNavigator from "./src/navigation/WorkerNavigator";
import ManagerNavigator from "./src/navigation/ManagerNavigator";
import { colors, fonts } from "./src/theme";

// Apply Inter as the default font for all Text components
(Text as any).defaultProps = {
  ...(Text as any).defaultProps,
  style: { fontFamily: fonts.regular },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,   // 5 min — no refetch when switching tabs
      gcTime: 10 * 60_000,     // 10 min — keep cache alive even when screen unmounts
      retry: 1,
    },
  },
});

function Root() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.blue} />
      </View>
    );
  }

  if (!user) return <LandingScreen />;
  if (user.role === "worker") return <WorkerNavigator />;
  if (user.role === "manager") return <ManagerNavigator />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.blue} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AuthProvider>
            <StatusBar style="light" />
            <Root />
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
