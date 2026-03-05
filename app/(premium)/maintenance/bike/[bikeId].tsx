import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ScrollView,
  RefreshControl,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Gauge } from "lucide-react-native";

import ToolHero from "../../../../src/components/ToolHero";
import AppHeader from "../../../../src/components/AppHeader";
import { useAppTheme, themeTokens } from "../../../../src/theme/theme";
import { getDesign } from "../../../../src/theme/design";
import { L2 } from "../../../../src/styles/level2";

import {
  fetchBikeDetails,
  logOdometer,
  markServiceCompleted,
  setServicePinned,
  deleteService,
} from "../../../../src/features/maintenance/api";

import type { BikeDetailsRPC, ServiceRow } from "../../../../src/features/maintenance/types";
import { groupTimelineByYear, statusLabel } from "../../../../src/features/maintenance/ui";

function getIntervalDistanceKm(svc: any): number | null {
  return svc.interval_distance_km ?? null;
}
function getIntervalMonths(svc: any): number | null {
  return svc.interval_months ?? null;
}
function getReminderDistanceKm(svc: any): number | null {
  return svc.reminder_distance_km ?? null;
}
function getReminderDays(svc: any): number | null {
  return svc.reminder_days ?? null;
}

function hasIntervalOnly(svc: any): boolean {
  if (svc.interval_type === "distance") return getIntervalDistanceKm(svc) != null;
  return getIntervalMonths(svc) != null;
}

export default function BikeDetailsScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const { bikeId, refreshToken } = useLocalSearchParams<{ bikeId?: string; refreshToken?: string }>();
  const bikeIdStr = String(bikeId ?? "");

  const [data, setData] = useState<BikeDetailsRPC | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // odometer UI
  const [showOdoInline, setShowOdoInline] = useState(false);
  const [odoDraft, setOdoDraft] = useState("");
  const [odoSaving, setOdoSaving] = useState(false);
  const odoInputRef = useRef<TextInput | null>(null);

  // odometer feedback pill
  const [odoMessage, setOdoMessage] = useState<string | null>(null);

  // services expand state
  const expandedRef = useRef<Set<string>>(new Set());
  const [expandedVersion, setExpandedVersion] = useState(0);

  // busy state
  const pinBusyRef = useRef<Set<string>>(new Set());
  const completeBusyRef = useRef<Set<string>>(new Set());
  const deleteBusyRef = useRef<Set<string>>(new Set());
  const [busyVersion, setBusyVersion] = useState(0);

  // refresh tracking
  const lastFetchAtRef = useRef<number>(0);
  const lastRefreshTokenRef = useRef<string | undefined>(undefined);

  const timelineGroups = useMemo(() => {
    if (!data) return [];
    return groupTimelineByYear(data.timeline);
  }, [data]);

  const load = useCallback(async () => {
    if (!bikeIdStr) return;
    setError(null);

    const res = await fetchBikeDetails(bikeIdStr as any);
    setData(res);
    lastFetchAtRef.current = Date.now();
  }, [bikeIdStr]);

  const initialLoad = useCallback(async () => {
    try {
      setLoading(true);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Failed to load bike.");
    } finally {
      setLoading(false);
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      const token = refreshToken;
      const stale = Date.now() - lastFetchAtRef.current > 30_000;

      const tokenChanged = token && token !== lastRefreshTokenRef.current;
      if (tokenChanged) lastRefreshTokenRef.current = token;

      if (!data) {
        initialLoad();
        return;
      }

      if (tokenChanged || stale) {
        load().catch((e: any) => setError(e?.message ?? "Failed to refresh."));
      }
    }, [refreshToken, data, initialLoad, load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Failed to refresh.");
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const toggleExpanded = useCallback((serviceId: string) => {
    const set = expandedRef.current;
    if (set.has(serviceId)) set.delete(serviceId);
    else set.add(serviceId);
    setExpandedVersion((v) => v + 1);
  }, []);

  const isExpanded = useCallback((serviceId: string) => expandedRef.current.has(serviceId), []);

  const onTogglePin = useCallback(
    async (svc: ServiceRow) => {
      if (!data) return;

      const nextPinned = !svc.pinned;
      pinBusyRef.current.add(svc.id);
      setBusyVersion((v) => v + 1);

      setData({
        ...data,
        services: data.services.map((s) => (s.id === svc.id ? { ...s, pinned: nextPinned } : s)),
      });

      try {
        await setServicePinned(svc.id as any, nextPinned);
        await load();
      } catch (e: any) {
        setData({
          ...data,
          services: data.services.map((s) => (s.id === svc.id ? { ...s, pinned: svc.pinned } : s)),
        });
        setError(e?.message ?? "Failed to update pin.");
      } finally {
        pinBusyRef.current.delete(svc.id);
        setBusyVersion((v) => v + 1);
      }
    },
    [data, load]
  );

  const onMarkCompleted = useCallback(
    async (svc: ServiceRow) => {
      completeBusyRef.current.add(svc.id);
      setBusyVersion((v) => v + 1);

      try {
        await markServiceCompleted(svc.id as any);
        await load();
      } catch (e: any) {
        setError(e?.message ?? "Failed to mark completed.");
      } finally {
        completeBusyRef.current.delete(svc.id);
        setBusyVersion((v) => v + 1);
      }
    },
    [load]
  );

  const onDelete = useCallback(
    (svc: ServiceRow) => {
      Alert.alert("Delete service?", "This removes it from your services list. Timeline stays.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            deleteBusyRef.current.add(svc.id);
            setBusyVersion((v) => v + 1);
            try {
              await deleteService(svc.id as any);
              await load();
            } catch (e: any) {
              setError(e?.message ?? "Failed to delete service.");
            } finally {
              deleteBusyRef.current.delete(svc.id);
              setBusyVersion((v) => v + 1);
            }
          },
        },
      ]);
    },
    [load]
  );

  const goServiceSchedule = useCallback(() => {
    router.push({ pathname: "/(premium)/maintenance/schedule", params: { bikeId: bikeIdStr } });
  }, [router, bikeIdStr]);

  const goAddService = useCallback(() => {
    router.push({ pathname: "/(premium)/maintenance/service", params: { bikeId: bikeIdStr, mode: "create" } });
  }, [router, bikeIdStr]);

  const goEditService = useCallback(
    (serviceId: string) => {
      router.push({ pathname: "/(premium)/maintenance/service", params: { bikeId: bikeIdStr, mode: "edit", serviceId } });
    },
    [router, bikeIdStr]
  );

  const onToggleOdo = useCallback(() => {
    setShowOdoInline((v) => {
      const next = !v;
      if (!v) setTimeout(() => odoInputRef.current?.focus(), 60);
      return next;
    });
    setOdoMessage(null);
  }, []);

  const saveOdometer = useCallback(async () => {
    if (!data) return;

    const n = Number(odoDraft);
    if (!odoDraft.trim() || Number.isNaN(n)) {
      setOdoMessage("Odometer must be a number.");
      return;
    }

    setOdoSaving(true);
    setOdoMessage(null);

    try {
      await logOdometer(data.bike.id as any, n, data.bike.unit);
      await load();
      setOdoMessage("Odometer saved.");
      setShowOdoInline(false);
      setOdoDraft("");
      setTimeout(() => setOdoMessage(null), 2000);
    } catch (e: any) {
      setOdoMessage(e?.message ?? "Failed to update odometer.");
    } finally {
      setOdoSaving(false);
    }
  }, [data, odoDraft, load]);

  if (!bikeIdStr) {
    return (
      <View style={{ flex: 1, padding: 16, gap: 10, backgroundColor: t.screenBg }}>
        <Text style={{ color: t.text, fontWeight: "800" }}>Missing bikeId</Text>
        <Text style={{ color: t.textMuted }}>This screen requires a bikeId route param.</Text>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
          <Text style={{ color: t.text, fontWeight: "800" }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (loading && !data) {
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: t.screenBg }}>
        <Text style={{ opacity: 0.7, color: t.text }}>Loading…</Text>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={{ flex: 1, padding: 16, gap: 10, backgroundColor: t.screenBg }}>
        <Text style={{ color: t.text }}>{error}</Text>
        <Pressable onPress={initialLoad} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
          <Text style={{ fontWeight: "800", color: t.text }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!data) return null;

  const bikeMeta = `Odometer: ${Number(data.bike.odometer_value).toLocaleString()} ${data.bike.unit}`;

  const lastUpdatedLabel = data.bike.last_odometer_at
    ? new Date(data.bike.last_odometer_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "—";

  return (
    <ScrollView
      style={{ backgroundColor: t.screenBg }}
      contentContainerStyle={{ paddingBottom: 80 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.textMuted} />}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ToolHero screen="Maintenance-tool" title={data.bike.display_name} subtitle={bikeMeta} />

      <AppHeader
        title="Service history"
        right={
          <Pressable onPress={onToggleOdo} hitSlop={10} style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.9 : 1 }]}>
            <Gauge size={18} color={t.text} />
          </Pressable>
        }
      />

      <View style={styles.body}>
        {showOdoInline ? (
          <View style={[styles.card, { backgroundColor: d.articleCardBg, borderColor: d.articleCardBorder }]}>
            <Text style={{ fontSize: 12, color: t.textMuted }}>Last updated: {lastUpdatedLabel}</Text>

            <View style={[styles.odoInputWrap, { backgroundColor: t.pillBg, borderColor: t.pillBorder }]}>
              <TextInput
                ref={odoInputRef}
                value={odoDraft}
                onChangeText={(txt) => setOdoDraft(txt.replace(/[^\d]/g, ""))}
                placeholder={`Enter ${data.bike.unit}`}
                placeholderTextColor={t.textMuted}
                keyboardType="number-pad"
                returnKeyType="done"
                autoCorrect={false}
                autoCapitalize="none"
                editable={!odoSaving}
                style={{ flex: 1, fontSize: 14, color: t.text }}
                onSubmitEditing={saveOdometer}
              />
            </View>

            <GradientCta label={odoSaving ? "Saving…" : "Save odometer"} onPress={saveOdometer} disabled={odoSaving} d={d} />
          </View>
        ) : null}

        {odoMessage ? (
          <View style={[styles.pill, { backgroundColor: t.pillBg, borderColor: t.pillBorder }]}>
            <Text style={{ fontSize: 12, fontWeight: "800", color: t.text }}>{odoMessage}</Text>
          </View>
        ) : null}

        <View style={styles.primaryActions}>
          <GradientCta label="Service Schedule" onPress={goServiceSchedule} d={d} />
          <GradientCta label="Add Service" onPress={goAddService} d={d} />
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ fontWeight: "800", fontSize: 16, color: t.text }}>Services</Text>

          {error ? (
            <View style={[styles.errorCard, { backgroundColor: d.articleCardBg, borderColor: d.articleCardBorder }]}>
              <Text style={{ fontSize: 13, color: t.text }}>{error}</Text>
            </View>
          ) : null}

          {data.services.length === 0 ? (
            <View style={[styles.card, { backgroundColor: d.articleCardBg, borderColor: d.articleCardBorder }]}>
              <Text style={{ fontWeight: "800", color: t.text }}>No services yet</Text>
              <Text style={{ color: t.textMuted }}>Add your first service to start tracking.</Text>

              <Pressable onPress={goAddService} style={({ pressed }) => [{ marginTop: 6, opacity: pressed ? 0.9 : 1 }]}>
                <Text style={{ fontWeight: "800", color: t.text }}>Add a service</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={data.services}
              keyExtractor={(s) => s.id}
              extraData={`${expandedVersion}-${busyVersion}`}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const expanded = isExpanded(item.id);
                const pinBusy = pinBusyRef.current.has(item.id);
                const completeBusy = completeBusyRef.current.has(item.id);
                const delBusy = deleteBusyRef.current.has(item.id);

                const remaining = item.interval_type === "distance" ? item.remaining_km : item.remaining_days;
                const remainingText =
                  remaining == null
                    ? "—"
                    : item.interval_type === "distance"
                    ? `${remaining} km remaining`
                    : `${remaining} days remaining`;

                const intervalText =
                  item.interval_type === "distance"
                    ? getIntervalDistanceKm(item) != null
                      ? `${getIntervalDistanceKm(item)} km`
                      : "—"
                    : getIntervalMonths(item) != null
                    ? `${getIntervalMonths(item)} months`
                    : "—";

                const reminderText =
                  item.interval_type === "distance"
                    ? getReminderDistanceKm(item) != null
                      ? `${getReminderDistanceKm(item)} km`
                      : "—"
                    : getReminderDays(item) != null
                    ? `${getReminderDays(item)} days`
                    : "—";

                const statusText = hasIntervalOnly(item) ? statusLabel(item.status) : "Setup needed";

                return (
                  <View style={{ marginBottom: 12 }}>
                    <Pressable
                      onPress={() => toggleExpanded(item.id)}
                      style={({ pressed }) => [
                        styles.serviceCard,
                        {
                          backgroundColor: d.articleCardBg,
                          borderColor: d.articleCardBorder,
                          opacity: pressed ? 0.92 : 1,
                        },
                      ]}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                        <Text style={{ fontSize: 15, fontWeight: "800", flex: 1, color: t.text }}>{item.name}</Text>
                        <Text style={{ color: t.textMuted, fontWeight: "700" }}>{statusText}</Text>
                      </View>

                      <Text style={{ color: t.textMuted }}>{remainingText}</Text>

                      {expanded ? (
                        <View style={{ marginTop: 10, gap: 8 }}>
                          <Text style={{ color: t.textMuted }}>Interval: {intervalText}</Text>
                          <Text style={{ color: t.textMuted }}>Reminder: {reminderText}</Text>

                          <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
                            <Pressable
                              onPress={() => onTogglePin(item)}
                              disabled={pinBusy}
                              style={({ pressed }) => [{ opacity: pinBusy ? 0.6 : pressed ? 0.9 : 1 }]}
                            >
                              <Text style={{ fontWeight: "800", color: t.text }}>
                                {pinBusy ? "Updating…" : item.pinned ? "Unpin" : "Pin"}
                              </Text>
                            </Pressable>

                            <Pressable
                              onPress={() => onMarkCompleted(item)}
                              disabled={completeBusy}
                              style={({ pressed }) => [{ opacity: completeBusy ? 0.6 : pressed ? 0.9 : 1 }]}
                            >
                              <Text style={{ fontWeight: "800", color: t.text }}>
                                {completeBusy ? "Saving…" : "Mark as Completed"}
                              </Text>
                            </Pressable>

                            <Pressable onPress={() => goEditService(item.id)} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
                              <Text style={{ fontWeight: "800", color: t.text }}>Edit</Text>
                            </Pressable>

                            <Pressable
                              onPress={() => onDelete(item)}
                              disabled={delBusy}
                              style={({ pressed }) => [{ opacity: delBusy ? 0.6 : pressed ? 0.9 : 1 }]}
                            >
                              <Text style={{ fontWeight: "800", color: t.text }}>{delBusy ? "Deleting…" : "Delete"}</Text>
                            </Pressable>
                          </View>
                        </View>
                      ) : null}
                    </Pressable>
                  </View>
                );
              }}
            />
          )}
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ fontWeight: "800", fontSize: 16, color: t.text }}>Ownership timeline</Text>

          {timelineGroups.length === 0 ? (
            <Text style={{ color: t.textMuted }}>History will appear as you log odometer and completions.</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {timelineGroups.map((g) => (
                <View key={String(g.year)} style={{ gap: 8 }}>
                  <Text style={{ fontWeight: "800", color: t.textMuted }}>{g.year}</Text>

                  <View style={{ gap: 0 }}>
                    {g.entries.map((e: any) => {
                      const key = `${e.event_type}-${e.service_id ?? "odo"}-${e.occurred_at}`;
                      const title = e.event_type === "service" ? e.service_name ?? "Service completed" : "Odometer updated";
                      const line =
                        e.event_type === "service"
                          ? `Completed: ${e.completed_date ?? "—"}`
                          : e.odometer_value != null
                          ? `Updated: ${e.odometer_value} ${data.bike.unit}`
                          : "Updated: —";

                      return (
                        <View key={key} style={{ flexDirection: "row", gap: 12, paddingVertical: 10 }}>
                          <View style={{ width: 2, borderRadius: 2, backgroundColor: t.pillBorder }} />
                          <View style={{ flex: 1, gap: 4 }}>
                            <Text style={{ fontWeight: "800", color: t.text }}>{title}</Text>
                            <Text style={{ color: t.textMuted }}>{line}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function GradientCta({
  label,
  onPress,
  disabled,
  d,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  d: ReturnType<typeof getDesign>;
}) {
  return (
    <Pressable onPress={onPress} disabled={!!disabled} style={({ pressed }) => [L2.ctaOuter, { opacity: disabled ? 0.65 : pressed ? 0.92 : 1 }]}>
      <LinearGradient colors={[...d.goldGradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
      <View style={L2.ctaInner}>
        <Text style={[L2.ctaText, { color: d.goldTextOn }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  odoInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  primaryActions: {
    gap: 12,
  },
  errorCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  serviceCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
});