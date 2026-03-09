import React, { useMemo, useState } from "react";
import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";

import ToolHero from "../../../src/components/ToolHero";
import AppHeader from "../../../src/components/AppHeader";
import { useAppTheme, themeTokens } from "../../../src/theme/theme";
import { getDesign } from "../../../src/theme/design";
import { L2 } from "../../../src/styles/level2";

type ChecklistKey =
  | "sceneSafe"
  | "injuriesChecked"
  | "emergencyHandled"
  | "readyToRecord";

const INITIAL_STATE: Record<ChecklistKey, boolean> = {
  sceneSafe: false,
  injuriesChecked: false,
  emergencyHandled: false,
  readyToRecord: false,
};

export default function CrashCardSafetyScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const [checks, setChecks] = useState(INITIAL_STATE);

  const allChecked = useMemo(() => Object.values(checks).every(Boolean), [checks]);

  const toggleCheck = (key: ChecklistKey) => {
    setChecks((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  return (
    <ScrollView
      style={{ backgroundColor: t.screenBg }}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      <ToolHero
        screen="Crash-Card"
        title="Safety check"
        subtitle="Confirm the situation is safe before recording"
      />

      <AppHeader title="Crash Card" />

      <View style={styles.body}>
        <Text style={[styles.intro, { color: t.text }]}>
          Crash Card should only be used once the immediate situation is under control.
        </Text>

        <View style={styles.list}>
          <ChecklistRow
            label="I am in a safe place away from traffic or immediate danger."
            checked={checks.sceneSafe}
            onPress={() => toggleCheck("sceneSafe")}
            textColor={t.text}
            borderColor={t.pillBorder}
          />

          <ChecklistRow
            label="I have checked myself and others for injuries."
            checked={checks.injuriesChecked}
            onPress={() => toggleCheck("injuriesChecked")}
            textColor={t.text}
            borderColor={t.pillBorder}
          />

          <ChecklistRow
            label="Emergency services have been called if needed."
            checked={checks.emergencyHandled}
            onPress={() => toggleCheck("emergencyHandled")}
            textColor={t.text}
            borderColor={t.pillBorder}
          />

          <ChecklistRow
            label="The situation is stable enough to record crash details."
            checked={checks.readyToRecord}
            onPress={() => toggleCheck("readyToRecord")}
            textColor={t.text}
            borderColor={t.pillBorder}
          />
        </View>

        <Pressable
          disabled={!allChecked}
          onPress={() => router.push("/(premium)/crash-card/report")}
          style={({ pressed }) => [
            L2.ctaOuter,
            { opacity: allChecked ? (pressed ? 0.92 : 1) : 0.4 },
          ]}
        >
          <LinearGradient
            colors={[...d.goldGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={L2.absoluteFill}
          />
          <View style={L2.ctaInner}>
            <Text style={[L2.ctaText, { color: d.goldTextOn }]}>
              Continue
            </Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ChecklistRow({
  label,
  checked,
  onPress,
  textColor,
  borderColor,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
  textColor: string;
  borderColor: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      <View style={styles.row}>
        <View style={[styles.checkbox, { borderColor }]}>
          {checked && <Check size={16} color={textColor} strokeWidth={3} />}
        </View>

        <Text style={[styles.rowText, { color: textColor }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 22,
    paddingTop: 20,
    gap: 24,
  },

  intro: {
    fontSize: 14,
    lineHeight: 20,
  },

  list: {
    gap: 20,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },

  rowText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});