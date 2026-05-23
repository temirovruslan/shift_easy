import { useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "../screens/worker/HomeScreen";
import HistoryScreen from "../screens/worker/HistoryScreen";
import ProfileScreen from "../screens/worker/ProfileScreen";
import { useAuth } from "../context/AuthContext";
import { colors, fonts } from "../theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const EmptyScreen = () => <View />;

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
      <Text style={{ fontSize: 11, fontFamily: fonts.semibold, color, marginTop: 2 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function WorkerTabs() {
  const { logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.bg2,
            borderTopColor: colors.line,
            borderTopWidth: 1,
          },
        }}
        screenListeners={({ route }) => ({
          focus: () => setActiveTab(route.name),
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarButton: (props) => (
              <TabButton
                icon="home-outline"
                label="Home"
                active={activeTab === "Home"}
                onPress={props.onPress ?? undefined}
              />
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            tabBarButton: (props) => (
              <TabButton
                icon="time-outline"
                label="History"
                active={activeTab === "History"}
                onPress={props.onPress ?? undefined}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Logout"
          component={EmptyScreen}
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

      <Modal visible={showLogout} transparent animationType="slide" onRequestClose={() => setShowLogout(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          activeOpacity={1}
          onPress={() => setShowLogout(false)}
        />
        <View style={{ backgroundColor: colors.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, alignSelf: "center", marginBottom: 24 }} />
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.blue + "1a", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 }}>
            <Ionicons name="log-out-outline" size={22} color={colors.blue} />
          </View>
          <Text style={{ fontSize: 18, color: colors.text, textAlign: "center", marginBottom: 4, fontFamily: fonts.bold }}>
            Leaving so soon?
          </Text>
          <Text style={{ fontSize: 14, color: colors.text3, textAlign: "center", marginBottom: 24 }}>
            You can always sign back in.
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.blue, alignItems: "center" }}
              onPress={() => setShowLogout(false)}
            >
              <Text style={{ color: "#fff", fontSize: 14, fontFamily: fonts.bold }}>Stay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line, alignItems: "center" }}
              onPress={logout}
            >
              <Text style={{ color: colors.text3, fontSize: 14, fontFamily: fonts.bold }}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function WorkerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkerTabs" component={WorkerTabs} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
