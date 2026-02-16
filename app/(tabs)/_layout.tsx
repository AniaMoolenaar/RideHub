import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  House,
  Bike,
  Wrench,
  GraduationCap,
  Sparkles,
} from "lucide-react-native";
import { useAppTheme, themeTokens } from "../../src/theme/theme";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);

  // 🔧 ICON CONTROLS
  const ICON_SIZE = 26;
  const ICON_STROKE = 1.5;
  const ACTIVE_COLOR = "#f8c331";   // change to any hex
  const INACTIVE_COLOR = "#7c7c7c"; // change to any hex

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,

        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,

        tabBarStyle: {
          height: 54 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          backgroundColor: t.screenBg,
          borderTopWidth: 0,
        },

        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <House size={ICON_SIZE} color={color} strokeWidth={ICON_STROKE} />
          ),
        }}
      />

      <Tabs.Screen
        name="ride"
        options={{
          title: "Ride",
          tabBarIcon: ({ color }) => (
            <Bike size={ICON_SIZE} color={color} strokeWidth={ICON_STROKE} />
          ),
        }}
      />

      <Tabs.Screen
        name="maintain"
        options={{
          title: "Maintain",
          tabBarIcon: ({ color }) => (
            <Wrench size={ICON_SIZE} color={color} strokeWidth={ICON_STROKE} />
          ),
        }}
      />

      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color }) => (
            <GraduationCap
              size={ICON_SIZE}
              color={color}
              strokeWidth={ICON_STROKE}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="premium"
        options={{
          title: "Premium",
          tabBarIcon: ({ color }) => (
            <Sparkles
              size={ICON_SIZE}
              color={color}
              strokeWidth={ICON_STROKE}
            />
          ),
        }}
      />
    </Tabs>
  );
}
