import React from "react";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ShieldAlert, Wrench } from "lucide-react-native";

import Hero from "../../src/components/Hero";
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
          <View
            style={[
              styles.card,
              {
                backgroundColor: t.pillBg,
                borderColor: t.pillBorder,
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
                Confidence, Bike Care & Maintenance, and Advanced Learning.
              </Text>

              <Text style={[styles.paragraph, { color: t.textMuted, marginTop: 10 }]}>
                You can purchase packs individually for {CURRENCY_PREFIX}14.99, or unlock the full
                tool with all packs for {CURRENCY_PREFIX}39.99.
              </Text>

              <Text style={[styles.paragraph, { color: t.textMuted, marginTop: 10 }]}>
                Each pack is a one-time purchase that unlocks content permanently and includes all
                future updates at no extra cost.
              </Text>
            </View>

            <Pressable
              onPress={() => router.push("/(premium)/paywall")}
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

          <View style={styles.headerRow}>
            <LinearGradient
              colors={["transparent", "#ffe093", "#c99b32", "#926806"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.headerLine}
            />
            <Text style={[styles.headerText, { color: t.text }]}>Premium Tools</Text>
            <LinearGradient
              colors={["#926806", "#c99b32", "#ffe093", "transparent"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.headerLine}
            />
          </View>

          <View style={styles.toolsRow}>
            <Pressable
              onPress={() => router.push("/(premium)/paywall")}
              style={({ pressed }) => [
                styles.toolTile,
                {
                  backgroundColor: t.pillBg,
                  borderColor: t.pillBorder,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <Wrench size={44} color={d.premiumSparkle} strokeWidth={1.5} />

              <Text style={[styles.toolTitle, { color: t.text }]}>
                Maintenance Tool
              </Text>

              <Text style={[styles.toolSub, { color: t.textMuted }]}>
                Ownership log of services and history.
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(premium)/paywall")}
              style={({ pressed }) => [
                styles.toolTile,
                {
                  backgroundColor: t.pillBg,
                  borderColor: t.pillBorder,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <ShieldAlert size={44} color={d.premiumSparkle} strokeWidth={1.5} />

              <Text style={[styles.toolTitle, { color: t.text }]}>
                Crash Card
              </Text>

              <Text style={[styles.toolSub, { color: t.textMuted }]}>
                Critical information if something goes wrong.
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },

  headerLine: {
    height: 2,
    flex: 1,
  },

  headerText: {
    fontSize: 18,
    fontWeight: "600",
  },

  toolsRow: {
    flexDirection: "row",
    gap: 12,
  },

  toolTile: {
    flex: 1,
    minHeight: 180,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  toolTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  toolSub: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
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