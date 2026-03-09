import React, { useMemo } from "react";
import { ScrollView, View, Text, StyleSheet, Pressable, Alert, Share } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";

import ToolHero from "../../components/ToolHero";
import AppHeader from "../../components/AppHeader";
import { useAppTheme, themeTokens } from "../../theme/theme";
import { getDesign } from "../../theme/design";
import { L2 } from "../../styles/level2";
import { upsertReport, type CrashHistoryReport, type CrashReportPayload } from "./historyStorage";

type Params = {
  payload?: string;
  reportId?: string;
  createdAt?: string;
};

function valueOrDash(value?: string) {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : "—";
}

function buildReportText(payload: CrashReportPayload) {
  const photoCount = payload.photos?.length ?? 0;

  return [
    "CRASH CARD REPORT",
    "",
    "CRASH DETAILS",
    `Date: ${valueOrDash(payload.date)}`,
    `Time: ${valueOrDash(payload.time)}`,
    `Location: ${valueOrDash(payload.location)}`,
    `Weather / conditions: ${valueOrDash(payload.weather)}`,
    "",
    "YOUR DETAILS",
    `Name: ${valueOrDash(payload.yourName)}`,
    `Phone: ${valueOrDash(payload.yourPhone)}`,
    `Email: ${valueOrDash(payload.yourEmail)}`,
    `Bike: ${valueOrDash(payload.yourBike)}`,
    `Bike registration: ${valueOrDash(payload.yourRegistration)}`,
    "",
    "OTHER PARTY",
    `Name: ${valueOrDash(payload.otherName)}`,
    `Phone: ${valueOrDash(payload.otherPhone)}`,
    `Vehicle: ${valueOrDash(payload.otherVehicle)}`,
    `Vehicle registration: ${valueOrDash(payload.otherRegistration)}`,
    `Insurance: ${valueOrDash(payload.otherInsurance)}`,
    "",
    "WITNESS",
    `Name: ${valueOrDash(payload.witnessName)}`,
    `Phone: ${valueOrDash(payload.witnessPhone)}`,
    `Notes: ${valueOrDash(payload.witnessNotes)}`,
    "",
    "INCIDENT NOTES",
    `What happened: ${valueOrDash(payload.whatHappened)}`,
    `Damage notes: ${valueOrDash(payload.damageNotes)}`,
    `Injury notes: ${valueOrDash(payload.injuryNotes)}`,
    "",
    "PHOTOS",
    `Attached locally in app: ${photoCount}`,
    "Camera photos saved to gallery as backup: yes",
  ].join("\n");
}

export default function CrashCardSummaryScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);
  const params = useLocalSearchParams<Params>();

  const payload = useMemo<CrashReportPayload | null>(() => {
    try {
      if (!params.payload) return null;
      return JSON.parse(params.payload);
    } catch {
      return null;
    }
  }, [params.payload]);

  const reportText = useMemo(() => {
    if (!payload) return "";
    return buildReportText(payload);
  }, [payload]);

  const isEditing = !!params.reportId;

  const onCopy = async () => {
    if (!reportText) return;
    await Clipboard.setStringAsync(reportText);
    Alert.alert("Copied", "Crash report text copied to clipboard.");
  };

  const onShare = async () => {
    if (!reportText) return;
    await Share.share({
      message: reportText,
    });
  };

  const onSaveToHistory = async () => {
    if (!payload) return;

    const report: CrashHistoryReport = {
      id: params.reportId || Date.now().toString(),
      createdAt: params.createdAt || new Date().toISOString(),
      payload,
    };

    await upsertReport(report);

    Alert.alert(isEditing ? "Updated" : "Saved", isEditing ? "Crash report updated." : "Crash report saved to history.", [
      {
        text: "OK",
        onPress: () => router.replace("/(premium)/crash-card/home"),
      },
    ]);
  };

  if (!payload) {
    return (
      <ScrollView
        style={{ backgroundColor: t.screenBg }}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <ToolHero screen="Crash-Card" title="Crash Card" subtitle="Summary" />

        <AppHeader title="Crash Card" />

        <View style={styles.body}>
          <Text style={[styles.emptyText, { color: t.text }]}>No report data was found.</Text>

          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [L2.ctaOuter, { opacity: pressed ? 0.92 : 1 }]}
          >
            <LinearGradient
              colors={[...d.goldGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={L2.absoluteFill}
            />
            <View style={L2.ctaInner}>
              <Text style={[L2.ctaText, { color: d.goldTextOn }]}>Go back</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: t.screenBg }}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      <ToolHero
        screen="Crash-Card"
        title="Summary"
        subtitle="Text only will be copied or shared"
      />

      <AppHeader title="Crash Card" />

      <View style={styles.body}>
        <View
          style={[
            styles.reportBox,
            {
              backgroundColor: t.pillBg,
              borderColor: t.pillBorder,
            },
          ]}
        >
          <Text style={[styles.reportText, { color: t.text }]}>{reportText}</Text>
        </View>

        <Pressable
          onPress={onCopy}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              backgroundColor: t.pillBg,
              borderColor: t.pillBorder,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: t.text }]}>Copy</Text>
        </Pressable>

        <Pressable
          onPress={onShare}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              backgroundColor: t.pillBg,
              borderColor: t.pillBorder,
              opacity: pressed ? 0.92 : 1,
            },
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: t.text }]}>Share</Text>
        </Pressable>

        <Pressable
          onPress={onSaveToHistory}
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
              {isEditing ? "Update report" : "Save to history"}
            </Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 22,
    paddingTop: 18,
    gap: 14,
  },
  reportBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  reportText: {
    fontSize: 13,
    lineHeight: 20,
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },
});