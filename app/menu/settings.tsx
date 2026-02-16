import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Sparkles,
  Shield,
  ScrollText,
  RefreshCcw,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react-native";

import { useAppTheme, themeTokens } from "../../src/theme/theme";
import { getDesign } from "../../src/theme/design";
import { supabase } from "../../src/lib/supabase";

type TileRowProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
};

function TileRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  disabled,
  t,
}: TileRowProps & {
  t: ReturnType<typeof themeTokens>;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.tileRow,
        {
          backgroundColor: t.pillBg,
          borderColor: t.pillBorder,
        },
        pressed && !disabled ? styles.tileRowPressed : null,
        disabled ? styles.tileRowDisabled : null,
      ]}
    >
      <View
        style={[
          styles.tileRowIcon,
          {
            backgroundColor: t.pillBg,
            borderColor: t.pillBorder,
          },
        ]}
      >
        {icon}
      </View>

      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={[styles.tileRowTitle, { color: t.text }]} numberOfLines={1}>
          {title}
        </Text>

        {!!subtitle && (
          <Text style={[styles.tileRowSub, { color: t.textMuted }]} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.tileRowRight}>{right}</View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  // Prototype placeholder (wire later)
  const isPremium = false;

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
          styles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
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

          <Text style={[styles.headerTitle, { color: t.text }]}>Settings</Text>

          <View style={{ width: 40 }} />
        </View>

        {/* Purchases */}
        <Text style={[styles.sectionTitle, { color: t.textMuted }]}>Purchases</Text>

        <TileRow
          t={t}
          icon={<Sparkles size={18} color={t.text} />}
          title="Premium"
          subtitle={isPremium ? "Active" : "Not active"}
          right={<ChevronRight size={18} color={t.textMuted} />}
          onPress={() => {}}
        />

        <TileRow
          t={t}
          icon={<CreditCard size={18} color={t.text} />}
          title="Purchased content"
          subtitle="View what you own"
          right={<ChevronRight size={18} color={t.textMuted} />}
          onPress={() => {}}
        />

        <TileRow
          t={t}
          icon={<RefreshCcw size={18} color={t.text} />}
          title="Restore purchases"
          subtitle="If you already paid"
          right={<ChevronRight size={18} color={t.textMuted} />}
          onPress={() => {}}
        />

        {/* Safety & Legal */}
        <Text style={[styles.sectionTitle, { color: t.textMuted }]}>
          Safety & Legal
        </Text>

        <TileRow
          t={t}
          icon={<ScrollText size={18} color={t.text} />}
          title="Disclaimers"
          subtitle="Important notices"
          right={<ChevronRight size={18} color={t.textMuted} />}
          onPress={() => router.push("/menu/disclaimers")}
        />

        <TileRow
          t={t}
          icon={<Shield size={18} color={t.text} />}
          title="Privacy"
          subtitle="What we store and why"
          right={<ChevronRight size={18} color={t.textMuted} />}
          onPress={() => router.push("/menu/privacy-policy")}
        />

        {/* Account */}
        <Text style={[styles.sectionTitle, { color: t.textMuted }]}>Account</Text>

        <TileRow
          t={t}
          icon={<Settings size={18} color={t.text} />}
          title="Account settings"
          subtitle="Sign-in and sync (later)"
          right={<ChevronRight size={18} color={t.textMuted} />}
          onPress={() => {}}
        />

        <TileRow
          t={t}
          icon={<LogOut size={18} color={t.text} />}
          title="Sign out"
          subtitle="(prototype)"
          right={<ChevronRight size={18} color={t.textMuted} />}
          onPress={async () => {
            await supabase.auth.signOut();
            router.replace("/"); // discovery start (or "/(auth)/login")
          }}
        />

        <View style={{ height: 10 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { paddingHorizontal: 16 },

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

  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 18,
    marginBottom: 10,
    letterSpacing: 0.2,
  },

  tileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 0 },
    }),
  },
  tileRowPressed: { opacity: 0.98 },
  tileRowDisabled: { opacity: 0.55 },

  tileRowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tileRowTitle: { fontSize: 13, fontWeight: "900" },
  tileRowSub: { marginTop: 3, fontSize: 11 },

  tileRowRight: { justifyContent: "center", alignItems: "flex-end" },
});
