import React, { useCallback, useState } from "react";
import { ScrollView, View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";

import ToolHero from "../../components/ToolHero";
import AppHeader from "../../components/AppHeader";
import { useAppTheme, themeTokens } from "../../theme/theme";
import { getDesign } from "../../theme/design";
import { L2 } from "../../styles/level2";
import { loadReports, deleteReport, type CrashHistoryReport } from "./historyStorage";

export default function CrashCardHomeScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const [reports, setReports] = useState<CrashHistoryReport[]>([]);

  const refreshReports = useCallback(async () => {
    const next = await loadReports();
    setReports(next);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshReports();
    }, [refreshReports])
  );

  const onDeleteReport = (id: string) => {
    Alert.alert(
      "Delete report?",
      "This will remove the saved report from Crash Card history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteReport(id);
            await refreshReports();
          },
        },
      ]
    );
  };

  const onOpenReport = (report: CrashHistoryReport) => {
    router.push({
      pathname: "/(premium)/crash-card/report",
      params: {
        payload: JSON.stringify(report.payload),
        reportId: report.id,
        createdAt: report.createdAt,
      },
    });
  };

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
        <View style={styles.newReportBlock}>
          <Text style={[styles.newReportText, { color: t.textMuted }]}>
            Start a new private accident record.
          </Text>

          <Pressable
            onPress={() => router.push("/(premium)/crash-card/safety")}
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
                New crash report
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>
            Saved reports
          </Text>

          {reports.length === 0 ? (
            <Text style={[styles.emptyText, { color: t.textMuted }]}>
              No saved reports yet.
            </Text>
          ) : (
            <View style={styles.reportList}>
              {reports.map((report) => (
                <View
                  key={report.id}
                  style={[
                    styles.reportPill,
                    {
                      backgroundColor: t.pillBg,
                      borderColor: t.pillBorder,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => onOpenReport(report)}
                    style={({ pressed }) => [
                      styles.reportMain,
                      { opacity: pressed ? 0.9 : 1 },
                    ]}
                  >
                    <Text style={[styles.reportTitle, { color: t.text }]}>
                      {report.payload.location?.trim() || "Saved crash report"}
                    </Text>

                    <Text style={[styles.reportMeta, { color: t.textMuted }]}>
                      {new Date(report.createdAt).toLocaleString()}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => onDeleteReport(report.id)}
                    hitSlop={8}
                    style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                  >
                    <Text style={[styles.deleteText, { color: t.textMuted }]}>
                      Delete
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 22,
  },

  newReportBlock: {
    gap: 8,
  },

  newReportText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },

  sectionBlock: {
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

  reportList: {
    gap: 10,
  },

  reportPill: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  reportMain: {
    flex: 1,
    gap: 4,
  },

  reportTitle: {
    fontSize: 13,
    fontWeight: "700",
  },

  reportMeta: {
    fontSize: 12,
    lineHeight: 16,
  },

  deleteText: {
    fontSize: 12,
    fontWeight: "700",
  },
});