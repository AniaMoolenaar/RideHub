import React from "react";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import Hero from "../../src/components/Hero";
import Disclaimer from "../../src/components/Disclaimer";
import { useAppTheme, themeTokens } from "../../src/theme/theme";
import { getDesign } from "../../src/theme/design";
import { L2 } from "../../src/styles/level2";
import { L1 } from "../../src/styles/level1";

const CURRENCY_PREFIX = "A$";

export default function PremiumScreen() {
  const router = useRouter();

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  return (
    <View style={[L1.screen, { backgroundColor: t.screenBg }]}>
      <ScrollView
        style={{ backgroundColor: t.screenBg }}
        contentContainerStyle={[L1.scrollContent24, { backgroundColor: t.screenBg }]}
        showsVerticalScrollIndicator={false}
      >
        <Hero screen="premium" />

        <View style={styles.contentWrap}>
          <Pressable
            onPress={() => router.push("/(premium)/maintenance")}
            style={({ pressed }) => [
              styles.entryCard,
              {
                backgroundColor: t.pillBg,
                borderColor: t.pillBorder,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <Text style={[styles.entryTitle, { color: t.text }]}>Maintenance Tool</Text>
            <Text style={[styles.entrySub, { color: t.textMuted }]}>
              A calm ownership log for bikes, services, and history.
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(premium)/crash-card")}
            style={({ pressed }) => [
              styles.entryCard,
              {
                backgroundColor: t.pillBg,
                borderColor: t.pillBorder,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <Text style={[styles.entryTitle, { color: t.text }]}>Crash Card</Text>
            <Text style={[styles.entrySub, { color: t.textMuted }]}>
              Quick access to critical information if something goes wrong.
            </Text>
          </Pressable>

          <View
            style={[
              styles.card,
              {
                backgroundColor: t.pillBg,
                borderColor: t.pillBorder,
                borderWidth: 0,
              },
            ]}
          >
            <Text style={[styles.title, { color: t.text }]}>Premium Packs</Text>

            <View style={styles.bundleWrap}>
              <Text style={[styles.muted, { color: t.textMuted }]}>Pricing</Text>

              <View style={styles.priceList}>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: t.text }]}>
                    Individual pack
                  </Text>
                  <Text style={[styles.priceNow, { color: t.text }]}>
                    {CURRENCY_PREFIX}14.99
                  </Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: t.text }]}>
                    Full tool (all packs)
                  </Text>
                  <View style={styles.priceRight}>
                    <Text style={[styles.priceWas, { color: t.textMuted }]}>
                      {CURRENCY_PREFIX}44.97
                    </Text>
                    <Text style={[styles.priceNow, { color: t.text }]}>
                      {CURRENCY_PREFIX}39.99
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.paragraphsWrap}>
              <Text style={[styles.paragraph, { color: t.textMuted }]}>
                Premium content is unlocked through three independent learning packs — Ride
                Confidence, Bike Care & Maintenance, and Advanced Learning. Each pack expands its
                tab with structured guides and in-depth insights.
              </Text>

              <Text style={[styles.paragraph, { color: t.textMuted, marginTop: 10 }]}>
                You can purchase packs individually for {CURRENCY_PREFIX}14.99, or unlock the full
                tool with all packs for {CURRENCY_PREFIX}39.99.
              </Text>

              <Text style={[styles.paragraph, { color: t.textMuted, marginTop: 10 }]}>
                Each pack is a one-time purchase that unlocks content permanently and includes all
                future updates at no extra cost.
              </Text>

              <Text style={[styles.paragraph, { color: t.textMuted, marginTop: 10 }]}>
                Unlock deeper knowledge — on your terms.
              </Text>
            </View>

            <Pressable
              onPress={() => {}}
              style={({ pressed }) => [L2.ctaOuter, { opacity: pressed ? 0.92 : 1 }]}
            >
              <LinearGradient
                colors={[...d.goldGradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={L2.absoluteFill}
              />
              <View style={L2.ctaInner}>
                <Text style={[L2.ctaText, { color: d.goldTextOn }]}>
                  Browse Premium Packs
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={L2.disclaimerWrap}>
          <Disclaimer />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },

  entryCard: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 0,
    gap: 6,
  },

  entryTitle: {
    fontSize: 15,
    fontWeight: "800",
  },

  entrySub: {
    fontSize: 12,
    lineHeight: 16,
  },

  card: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 18,
  },

  title: {
    fontSize: 17,
    fontWeight: "800",
  },

  muted: {
    fontSize: 12,
    lineHeight: 16,
  },

  bundleWrap: {
    marginTop: 10,
  },

  priceList: {
    marginTop: 12,
    gap: 10,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  priceLabel: {
    fontSize: 13,
    fontWeight: "700",
  },

  priceRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  priceWas: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },

  priceNow: {
    fontSize: 13,
    fontWeight: "800",
  },

  paragraphsWrap: {
    marginTop: 14,
  },

  paragraph: {
    fontSize: 13,
    lineHeight: 18,
  },
});