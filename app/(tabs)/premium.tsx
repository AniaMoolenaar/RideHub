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
  const t = themeTokens(isDark); // SAFE: 5 keys only
  const d = getDesign(isDark); // FULL design tokens

  return (
    <View style={[L1.screen, { backgroundColor: t.screenBg }]}>
      <ScrollView
        style={{ backgroundColor: t.screenBg }}
        contentContainerStyle={[L1.scrollContent24, { backgroundColor: t.screenBg }]}
        showsVerticalScrollIndicator={false}
      >
        <Hero
          screen="premium"
          title="Premium"
          subtitle="Deeper guidance, tools, and future releases"
        />

        <View style={styles.contentWrap}>
          {/* 1) Maintenance Tool (Premium entry) */}
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

          {/* 2) Crash Card (placeholder – keep your existing component/entry here) */}
          <View
            style={[
              styles.entryCard,
              { backgroundColor: t.pillBg, borderColor: t.pillBorder },
            ]}
          >
            <Text style={[styles.entryTitle, { color: t.text }]}>Crash Card</Text>
            <Text style={[styles.entrySub, { color: t.textMuted }]}>
              Quick access to critical information if something goes wrong.
            </Text>
          </View>

          {/* 3) Premium Pricing Info (existing pricing card) */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: t.pillBg,
                borderColor: t.pillBorder,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[styles.title, { color: t.text }]}>Premium Packs</Text>

            <View style={styles.bundleWrap}>
              <Text style={[styles.muted, { color: t.textMuted }]}>Bundle pricing</Text>
              <Text style={[styles.muted, { color: t.textMuted, marginTop: 4 }]}>
                Each pack is {CURRENCY_PREFIX}14.99. Discounts apply when you bundle
              </Text>

              <View style={styles.priceList}>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: t.text }]}>Buy 1 pack</Text>
                  <Text style={[styles.priceNow, { color: t.text }]}>
                    {CURRENCY_PREFIX}14.99
                  </Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: t.text }]}>Buy any 2 packs</Text>
                  <View style={styles.priceRight}>
                    <Text style={[styles.priceWas, { color: t.textMuted }]}>
                      {CURRENCY_PREFIX}29.98
                    </Text>
                    <Text style={[styles.priceNow, { color: t.text }]}>
                      {CURRENCY_PREFIX}24.99
                    </Text>
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <Text style={[styles.priceLabel, { color: t.text }]}>Buy all 3 packs</Text>
                  <View style={styles.priceRight}>
                    <Text style={[styles.priceWas, { color: t.textMuted }]}>
                      {CURRENCY_PREFIX}44.97
                    </Text>
                    <Text style={[styles.priceNow, { color: t.text }]}>
                      {CURRENCY_PREFIX}34.99
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.note, { color: t.textMuted }]}>
                Save up to {CURRENCY_PREFIX}10 when you bundle. Mix and match any packs you want.
              </Text>
            </View>

            <View style={styles.paragraphsWrap}>
              <Text style={[styles.paragraph, { color: t.textMuted }]}>
                Premium content is unlocked through three independent learning packs — Ride
                Confidence, Bike Care & Maintenance, and Advanced Learning. Each pack expands its
                tab with structured guides and in-depth insights.
              </Text>
              <Text style={[styles.paragraph, { color: t.textMuted, marginTop: 10 }]}>
                Choose the packs you want and save when you bundle: one pack for {CURRENCY_PREFIX}
                14.99, any two for {CURRENCY_PREFIX}24.99, or all three for {CURRENCY_PREFIX}34.99.
              </Text>
              <Text style={[styles.paragraph, { color: t.textMuted, marginTop: 10 }]}>
                Each pack is a one-time purchase that unlocks content permanently and includes all
                future content updates at no extra cost.
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
    borderWidth: 1,
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

  note: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 16,
  },

  paragraphsWrap: {
    marginTop: 14,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 18,
  },
});
