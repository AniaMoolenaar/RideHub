import React from "react";
import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";

import ToolHero from "../../components/ToolHero";
import AppHeader from "../../components/AppHeader";
import { useAppTheme, themeTokens } from "../../theme/theme";
import { getDesign } from "../../theme/design";
import { L2 } from "../../styles/level2";

export default function CrashCardScreen() {
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
        subtitle="Private accident record tool with a shareable text summary"
      />

      <AppHeader title="Crash Card" />

      <View style={styles.body}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: d.articleCardBg,
              borderColor: d.articleCardBorder,
            },
          ]}
        >
          <Text style={[styles.title, { color: t.text }]}>Crash Card</Text>
          <Text style={[styles.bodyText, { color: t.textMuted }]}>
            This tool will be PIN protected, keep drafts locally, save encrypted reports, and
            generate a shareable text summary.
          </Text>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: d.articleCardBg,
              borderColor: d.articleCardBorder,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: t.text }]}>Planned flow</Text>
          <Text style={[styles.bodyText, { color: t.textMuted }]}>1. PIN unlock</Text>
          <Text style={[styles.bodyText, { color: t.textMuted }]}>2. Intro and saved reports</Text>
          <Text style={[styles.bodyText, { color: t.textMuted }]}>3. Safety check</Text>
          <Text style={[styles.bodyText, { color: t.textMuted }]}>4. Capture details</Text>
          <Text style={[styles.bodyText, { color: t.textMuted }]}>5. Generate summary</Text>
        </View>

        <Pressable
          disabled
          style={({ pressed }) => [L2.ctaOuter, { opacity: pressed ? 0.92 : 1 }]}
        >
          <View
            style={[
              L2.ctaInner,
              {
                backgroundColor: t.pillBg,
                borderColor: t.pillBorder,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[L2.ctaText, { color: t.text }]}>Start building</Text>
          </View>
        </Pressable>
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
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 18,
  },
});