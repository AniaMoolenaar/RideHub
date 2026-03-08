import React from "react";
import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";

import ToolHero from "../../components/ToolHero";
import AppHeader from "../../components/AppHeader";
import { useAppTheme, themeTokens } from "../../theme/theme";
import { getDesign } from "../../theme/design";

export default function CrashCardHomeScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  return (
    <ScrollView
      style={{ backgroundColor: t.screenBg }}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      <ToolHero
        screen="Crash-Card"
        title="Crash Card"
        subtitle="Private accident record tool"
      />

      <AppHeader title="Crash Card" />

      <View style={styles.body}>
        <Pressable
          onPress={() => router.push("/(premium)/crash-card/safety")}
          style={({ pressed }) => [
            styles.primaryCard,
            {
              backgroundColor: t.pillBg,
              borderColor: t.pillBorder,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <Text style={[styles.primaryTitle, { color: t.text }]}>New crash report</Text>
          <Text style={[styles.primarySub, { color: t.textMuted }]}>
            Start a new private accident record.
          </Text>
        </Pressable>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: d.articleCardBg,
              borderColor: d.articleCardBorder,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: t.text }]}>Saved reports</Text>
          <Text style={[styles.emptyText, { color: t.textMuted }]}>
            No saved reports yet.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  primaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 6,
  },
  primaryTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  primarySub: {
    fontSize: 12,
    lineHeight: 16,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
  },
});