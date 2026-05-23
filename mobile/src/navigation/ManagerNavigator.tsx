import { useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import DashboardScreen from "../screens/manager/DashboardScreen";
import ShiftsScreen from "../screens/manager/ShiftsScreen";
import WorkersScreen from "../screens/manager/WorkersScreen";
import WorkerDetailScreen from "../screens/manager/WorkerDetailScreen";
import SitesScreen from "../screens/manager/SitesScreen";
import SiteDetailScreen from "../screens/manager/SiteDetailScreen";
import ManagerProfileScreen from "../screens/manager/ManagerProfileScreen";
import { colors, fonts } from "../theme";

// ── Navigation types ───────────────────────────────────────────────────────────

export type ManagerStackParamList = {
  ManagerTabs: undefined;
  SiteDetail: { siteId: string };
  WorkerDetail: { workerId: string };
  ManagerProfile: undefined;
};

const Stack = createNativeStackNavigator<ManagerStackParamList>();
const Tab = createBottomTabNavigator();

// ── Tab Button ─────────────────────────────────────────────────────────────────

type TabButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress?: (...args: any[]) => void;
};

function TabButton({ icon, label, active, onPress }: TabButtonProps) {
  const color = active ? colors.blue : colors.text3;
  return (
    <TouchableOpacity
      style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8 }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={22} color={color} />
      <Text style={{ fontSize: 11, fontFamily: fonts.semibold, color, marginTop: 2 }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Logout Confirmation Modal ──────────────────────────────────────────────────

function LogoutModal({ visible, onCancel, onConfirm }: { visible: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "flex-end" }}>
        <View style={{ width: "100%", backgroundColor: colors.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 }}>
          <View style={{ alignItems: "center", marginBottom: 4 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.blue + "1a", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Ionicons name="log-out-outline" size={22} color={colors.blue} />
            </View>
            <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: colors.text }}>Sign out?</Text>
            <Text style={{ fontSize: 13, color: colors.text3, marginTop: 4, textAlign: "center" }}>
              You can sign back in any time.
            </Text>
          </View>
          <TouchableOpacity
            onPress={onCancel}
            style={{ backgroundColor: colors.blue, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
            activeOpacity={0.8}
          >
            <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: "#fff" }}>Stay</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            style={{ backgroundColor: colors.bg3, borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
            activeOpacity={0.8}
          >
            <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.text3 }}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Manager Tabs ───────────────────────────────────────────────────────────────

function ManagerTabs() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [showLogout, setShowLogout] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.bg2,
            borderTopColor: colors.line,
            borderTopWidth: 1,
            height: 60,
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          listeners={{ focus: () => setActiveTab("Dashboard") }}
          options={{
            tabBarButton: (props) => (
              <TabButton icon="grid-outline" label="Dashboard" active={activeTab === "Dashboard"} onPress={props.onPress} />
            ),
          }}
        />
        <Tab.Screen
          name="Shifts"
          component={ShiftsScreen}
          listeners={{ focus: () => setActiveTab("Shifts") }}
          options={{
            tabBarButton: (props) => (
              <TabButton icon="calendar-outline" label="Shifts" active={activeTab === "Shifts"} onPress={props.onPress} />
            ),
          }}
        />
        <Tab.Screen
          name="Workers"
          component={WorkersScreen}
          listeners={{ focus: () => setActiveTab("Workers") }}
          options={{
            tabBarButton: (props) => (
              <TabButton icon="people-outline" label="Workers" active={activeTab === "Workers"} onPress={props.onPress} />
            ),
          }}
        />
        <Tab.Screen
          name="Sites"
          component={SitesScreen}
          listeners={{ focus: () => setActiveTab("Sites") }}
          options={{
            tabBarButton: (props) => (
              <TabButton icon="location-outline" label="Sites" active={activeTab === "Sites"} onPress={props.onPress} />
            ),
          }}
        />
        <Tab.Screen
          name="LogoutTab"
          component={DashboardScreen}
          options={{
            tabBarButton: () => (
              <TabButton
                icon="log-out-outline"
                label="Logout"
                active={false}
                onPress={() => setShowLogout(true)}
              />
            ),
          }}
        />
      </Tab.Navigator>

      <LogoutModal
        visible={showLogout}
        onCancel={() => setShowLogout(false)}
        onConfirm={() => { setShowLogout(false); logout(); }}
      />
    </>
  );
}

// ── Manager Navigator (Stack) ──────────────────────────────────────────────────

export default function ManagerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManagerTabs" component={ManagerTabs} />
      <Stack.Screen name="SiteDetail" component={SiteDetailScreen} />
      <Stack.Screen name="WorkerDetail" component={WorkerDetailScreen} />
      <Stack.Screen name="ManagerProfile" component={ManagerProfileScreen} />
    </Stack.Navigator>
  );
}
