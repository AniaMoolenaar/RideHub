import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

import Disclaimer from "../../src/components/Disclaimer";
import { useAppTheme, themeTokens } from "../../src/theme/theme";

export default function DisclaimersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { isDark } = useAppTheme();
  const colors = themeTokens(isDark);

  return (
    <View style={[styles.root, { backgroundColor: colors.screenBg }]}>
      <LinearGradient
        colors={
          isDark
            ? ["#1E1F22", "#1B1C1F", "#18191C"]
            : ["#FFFFFF", "#FAFAF9", "#F5F5F4"]
        }
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header (match Settings horizontal padding) */}
        <View style={{ paddingHorizontal: 16 }}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={styles.backBtn}
            >
              <ChevronLeft size={20} color={colors.text} />
            </Pressable>

            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Disclaimers
            </Text>

            <View style={{ width: 40 }} />
          </View>
        </View>

        {/* Disclaimer content (edge-to-edge) */}
        <Disclaimer />

        {/* Button */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <Pressable
            onPress={() => Linking.openURL("https://example.com")}
            style={({ pressed }) => [
              {
                height: 48,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 0,
                borderColor: colors.pillBorder,
                backgroundColor: colors.pillBg,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={{ color: colors.text, fontWeight: "900", fontSize: 13 }}>
              Learn more
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(250,250,248,0.06)",
    borderWidth: 0,
    borderColor: "rgba(250,250,248,0.10)",
  },
  headerTitle: { fontSize: 16, fontWeight: "900" },
});
