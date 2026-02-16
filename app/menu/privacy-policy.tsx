import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

import { useAppTheme, themeTokens } from "../../src/theme/theme";
import { getDesign } from "../../src/theme/design";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const content = useMemo(
    () => ({
      title: "Privacy Policy",
      body:
        "RideHub is designed to work as a content app with optional account features.\n\n" +
        "This policy explains what data may be collected, why it is collected, and how it is used.\n\n" +
        "Account data\n\n" +
        "If you create an account, RideHub may store your email address and profile fields you enter (for example, a display name). This is used to authenticate you and display your profile in the app.\n\n" +
        "Reading and app state\n\n" +
        "RideHub may store reading progress (for example, which articles you mark as read) and other in-app state needed to provide the experience (such as saved items).\n\n" +
        "Purchased content\n\n" +
        "If you purchase premium content, RideHub may store entitlement status so the app can unlock what you own and restore purchases.\n\n" +
        "What RideHub does not do\n\n" +
        "RideHub does not sell your personal information. RideHub does not require precise location access to function.\n\n" +
        "Retention\n\n" +
        "Data is retained for as long as your account exists, or as needed to provide core functionality (such as restoring access to content you own).\n\n" +
        "Contact\n\n" +
        "For privacy questions, use the contact method provided on the RideHub website.",
    }),
    []
  );

  const paragraphs = content.body
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <View style={[styles.root, { backgroundColor: t.screenBg }]}>
      <LinearGradient
        colors={
          isDark
            ? [d.background, d.screenBg, d.background]
            : [d.screenBg, d.articleCardBg, d.pillBg]
        }
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header (match Settings horizontal padding) */}
        <View style={styles.headerWrap}>
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={[
                styles.backBtn,
                { backgroundColor: t.pillBg, borderColor: t.pillBorder },
              ]}
            >
              <ChevronLeft size={20} color={t.text} />
            </Pressable>

            <Text style={[styles.headerTitle, { color: t.text }]}>
              Privacy policy
            </Text>

            <View style={{ width: 40 }} />
          </View>
        </View>

        {/* Policy container */}
        <View style={styles.wrap}>
          <View
            style={[
              styles.card,
              { backgroundColor: t.pillBg, borderColor: t.pillBorder },
            ]}
          >
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: t.text }]}>{content.title}</Text>
            </View>

            <View style={styles.textGroup}>
              {paragraphs.map((p, i) => (
                <Text key={i} style={[styles.text, { color: t.textMuted }]}>
                  {p}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Button (same pattern as Disclaimers) */}
        <View style={styles.buttonWrap}>
          <Pressable
            onPress={() => Linking.openURL("https://example.com")}
            style={({ pressed }) => [
              styles.learnMoreBtn,
              {
                borderColor: t.pillBorder,
                backgroundColor: t.pillBg,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={[styles.learnMoreText, { color: t.text }]}>Learn more</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  scrollContent: {
    // dynamic padding applied in render
  },

  headerWrap: { paddingHorizontal: 16 },
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
    borderWidth: 1,
  },
  headerTitle: { fontSize: 16, fontWeight: "900" },

  wrap: {
    marginTop: 36,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
  },
  textGroup: { gap: 10 },
  text: { fontSize: 11, lineHeight: 16 },

  buttonWrap: { paddingHorizontal: 16, marginTop: 0 },
  learnMoreBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  learnMoreText: { fontWeight: "900", fontSize: 13 },
});
