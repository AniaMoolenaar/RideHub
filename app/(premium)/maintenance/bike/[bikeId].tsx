import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import {
  fetchBikeDetails,
  logOdometer,
  markServiceCompleted,
  setServicePinned,
} from "../../../../src/features/maintenance/api";
import type { BikeDetailsRPC, ServiceRow } from "../../../../src/features/maintenance/types";
import { groupTimelineByYear, statusLabel } from "../../../../src/features/maintenance/ui";

export default function BikeDetailsScreen() {
  const router = useRouter();
  const { bikeId, refreshToken } = useLocalSearchParams<{
    bikeId: string;
    refreshToken?: string;
  }>();

  const [data, setData] = useState<BikeDetailsRPC | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expandedRef = useRef<Set<string>>(new Set());
  const [expandedVersion, setExpandedVersion] = useState(0);

  const pinBusyRef = useRef<Set<string>>(new Set());
  const completeBusyRef = useRef<Set<string>>(new Set());
  const [, forceBusyRender] = useState(0);

  const lastFetchAtRef = useRef<number>(0);
  const lastRefreshTokenRef = useRef<string | undefined>(undefined);

  const [showOdoInline, setShowOdoInline] = useState(false);
  const [odoDraft, setOdoDraft] = useState("");
  const [odoSaving, setOdoSaving] = useState(false);

  const timelineGroups = useMemo(() => {
    if (!data) return [];
    return groupTimelineByYear(data.timeline);
  }, [data]);

  const load = useCallback(async () => {
    if (!bikeId) return;
    setError(null);
    const res = await fetchBikeDetails(bikeId);
    setData(res);
    lastFetchAtRef.current = Date.now();
  }, [bikeId]);

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

  const isExpanded = useCallback((serviceId: string) => {
    return expandedRef.current.has(serviceId);
  }, []);

  const onTogglePin = useCallback(
    async (svc: ServiceRow) => {
      if (!data) return;

      const nextPinned = !svc.pinned;

      pinBusyRef.current.add(svc.id);
      forceBusyRender((x) => x + 1);

      // optimistic UI
      setData({
        ...data,
        services: data.services.map((s) =>
          s.id === svc.id ? { ...s, pinned: nextPinned } : s
        ),
      });

      try {
        await setServicePinned(svc.id, nextPinned);
        await load(); // refetch to restore correct ordering/status
      } catch (e: any) {
        // revert
        setData({
          ...data,
          services: data.services.map((s) =>
            s.id === svc.id ? { ...s, pinned: svc.pinned } : s
          ),
        });
        setError(e?.message ?? "Failed to update pin.");
      } finally {
        pinBusyRef.current.delete(svc.id);
        forceBusyRender((x) => x + 1);
      }
    },
    [data, load]
  );

  const onMarkCompleted = useCallback(
    async (svc: ServiceRow) => {
      completeBusyRef.current.add(svc.id);
      forceBusyRender((x) => x + 1);

      try {
        await markServiceCompleted(svc.id);
        await load();
      } catch (e: any) {
        setError(e?.message ?? "Failed to mark completed.");
      } finally {
        completeBusyRef.current.delete(svc.id);
        forceBusyRender((x) => x + 1);
      }
    },
    [load]
  );

  const goAddService = useCallback(() => {
    router.push({
      pathname: "/(premium)/maintenance/service",
      params: { bikeId: String(bikeId), mode: "create" },
    });
  }, [router, bikeId]);

  const goEditService = useCallback(
    (serviceId: string) => {
      router.push({
        pathname: "/(premium)/maintenance/service",
        params: { bikeId: String(bikeId), mode: "edit", serviceId },
      });
    },
    [router, bikeId]
  );

  const saveOdometer = useCallback(async () => {
    if (!data) return;

    const n = Number(odoDraft);
    if (!odoDraft.trim() || Number.isNaN(n)) {
      setError("Odometer must be a number.");
      return;
    }

    setOdoSaving(true);
    try {
      await logOdometer(data.bike.id, n, data.bike.unit);
      await load();
      setShowOdoInline(false);
      setOdoDraft("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to update odometer.");
    } finally {
      setOdoSaving(false);
    }
  }, [data, odoDraft, load]);

  if (loading && !data) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ opacity: 0.7 }}>Loading…</Text>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={{ flex: 1, padding: 16, gap: 10 }}>
        <Text>{error}</Text>
        <Pressable onPress={initialLoad}>
          <Text style={{ fontWeight: "700" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!data) return null;

  const bikeMeta =
    [data.bike.make, data.bike.model, data.bike.year ? String(data.bike.year) : null]
      .filter(Boolean)
      .join(" · ") || "—";

  const odoDisplay = `${data.bike.odometer_value} ${data.bike.unit}`;
  const lastUpdated = data.bike.last_odometer_at ?? "—";

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Bike Header */}
      <View style={{ padding: 16, borderRadius: 16, backgroundColor: "#f2f2f2", gap: 6 }}>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>{data.bike.display_name}</Text>
        <Text style={{ opacity: 0.8 }}>{bikeMeta}</Text>
      </View>

      {/* Odometer */}
      <View
        style={{
          padding: 16,
          borderRadius: 16,
          backgroundColor: "#fff",
          borderWidth: 1,
          borderColor: "#e6e6e6",
          gap: 8,
        }}
      >
        <Text style={{ fontWeight: "700" }}>Odometer</Text>
        <Text style={{ fontSize: 16 }}>{odoDisplay}</Text>
        <Text style={{ fontSize: 12, opacity: 0.7 }}>Last updated: {lastUpdated}</Text>

        <Pressable onPress={() => setShowOdoInline((v) => !v)} style={{ paddingVertical: 10 }}>
          <Text style={{ fontWeight: "700" }}>Update Odometer</Text>
        </Pressable>

        {showOdoInline ? (
          <View style={{ gap: 10 }}>
            <Input value={odoDraft} onChangeText={setOdoDraft} placeholder={`Enter ${data.bike.unit}`} />
            <Pressable
              onPress={saveOdometer}
              disabled={odoSaving}
              style={{
                padding: 12,
                borderRadius: 14,
                backgroundColor: "#111",
                alignItems: "center",
                opacity: odoSaving ? 0.85 : 1,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>
                {odoSaving ? "Saving…" : "Save"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* Add Service */}
      <Pressable
        onPress={goAddService}
        style={{ padding: 14, borderRadius: 16, backgroundColor: "#111", alignItems: "center" }}
      >
        <Text style={{ color: "white", fontWeight: "800" }}>Add Service</Text>
      </Pressable>

      {/* Services */}
      <View style={{ gap: 10 }}>
        <Text style={{ fontWeight: "800", fontSize: 16 }}>Services</Text>

        {error ? (
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: "#f7f7f7" }}>
            <Text style={{ fontSize: 13 }}>{error}</Text>
          </View>
        ) : null}

        {data.services.length === 0 ? (
          <View
            style={{
              padding: 14,
              borderRadius: 16,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#e6e6e6",
              gap: 6,
            }}
          >
            <Text style={{ fontWeight: "700" }}>No services yet</Text>
            <Text style={{ opacity: 0.75 }}>Add your first service to start tracking.</Text>
            <Pressable onPress={goAddService} style={{ marginTop: 6 }}>
              <Text style={{ fontWeight: "800" }}>Add a service</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={data.services}
            keyExtractor={(s) => s.id}
            extraData={expandedVersion}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const expanded = isExpanded(item.id);
              const pinBusy = pinBusyRef.current.has(item.id);
              const completeBusy = completeBusyRef.current.has(item.id);

              const remaining =
                item.interval_type === "distance"
                  ? item.remaining_km
                  : item.remaining_days;

              const remainingText =
                remaining == null
                  ? "—"
                  : item.interval_type === "distance"
                  ? `${remaining} km remaining`
                  : `${remaining} days remaining`;

              const intervalText =
                item.interval_type === "distance"
                  ? item.interval_distance_km != null
                    ? `${item.interval_distance_km} km`
                    : "—"
                  : item.interval_months != null
                  ? `${item.interval_months} months`
                  : "—";

              const reminderText =
                item.interval_type === "distance"
                  ? item.reminder_distance_km != null
                    ? `${item.reminder_distance_km} km`
                    : "—"
                  : item.reminder_days != null
                  ? `${item.reminder_days} days`
                  : "—";

              return (
                <View style={{ marginBottom: 12 }}>
                  <Pressable
                    onPress={() => toggleExpanded(item.id)}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "#e6e6e6",
                      gap: 6,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                      <Text style={{ fontSize: 15, fontWeight: "800", flex: 1 }}>{item.name}</Text>
                      <Text style={{ opacity: 0.75, fontWeight: "700" }}>
                        {statusLabel(item.status)}
                      </Text>
                    </View>

                    <Text style={{ opacity: 0.8 }}>{remainingText}</Text>

                    {expanded ? (
                      <View style={{ marginTop: 10, gap: 8 }}>
                        <Text style={{ opacity: 0.8 }}>Interval: {intervalText}</Text>
                        <Text style={{ opacity: 0.8 }}>Reminder: {reminderText}</Text>
                        <Text style={{ opacity: 0.8 }}>
                          Estimated cost: {item.estimated_cost ?? "—"}
                        </Text>
                        <Text style={{ opacity: 0.8 }}>Booked: {item.is_booked ? "Yes" : "No"}</Text>

                        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                          <Pressable onPress={() => onTogglePin(item)} disabled={pinBusy}>
                            <Text style={{ fontWeight: "800" }}>
                              {pinBusy ? "Updating…" : item.pinned ? "Unpin" : "Pin"}
                            </Text>
                          </Pressable>

                          <Pressable onPress={() => onMarkCompleted(item)} disabled={completeBusy}>
                            <Text style={{ fontWeight: "800" }}>
                              {completeBusy ? "Saving…" : "Mark as Completed"}
                            </Text>
                          </Pressable>

                          <Pressable onPress={() => goEditService(item.id)}>
                            <Text style={{ fontWeight: "800" }}>Edit</Text>
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

      {/* Timeline */}
      <View style={{ gap: 10 }}>
        <Text style={{ fontWeight: "800", fontSize: 16 }}>Ownership timeline</Text>

        {timelineGroups.length === 0 ? (
          <Text style={{ opacity: 0.75 }}>
            History will appear as you log odometer and completions.
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {timelineGroups.map((g) => (
              <View key={String(g.year)} style={{ gap: 8 }}>
                <Text style={{ fontWeight: "800", opacity: 0.8 }}>{g.year}</Text>

                <View style={{ gap: 8 }}>
                  {g.entries.map((e: any) => {
                    const key = `${e.event_type}-${e.service_id ?? "odo"}-${e.occurred_at}`;

                    const title =
                      e.event_type === "service"
                        ? (e.service_name ?? "Service completed")
                        : "Odometer updated";

                    const subtitle =
                      e.event_type === "service"
                        ? (e.completed_date ?? null)
                        : e.odometer_value != null
                        ? `${e.odometer_value} ${data.bike.unit}`
                        : null;

                    return (
                      <View
                        key={key}
                        style={{
                          padding: 12,
                          borderRadius: 14,
                          backgroundColor: "#fff",
                          borderWidth: 1,
                          borderColor: "#e6e6e6",
                          gap: 4,
                        }}
                      >
                        <Text style={{ fontWeight: "800" }}>{title}</Text>
                        {subtitle ? <Text style={{ opacity: 0.8 }}>{subtitle}</Text> : null}
                        <Text style={{ opacity: 0.6, fontSize: 12 }}>{e.occurred_at}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

/**
 * NOTE: This is still a placeholder “Input”.
 * It does not accept user typing.
 * Replace with TextInput when you’re ready.
 */
function Input({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <Pressable
      onPress={() => {}}
      style={{
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#e6e6e6",
        backgroundColor: "#fff",
      }}
    >
      <Text style={{ opacity: value ? 1 : 0.6 }}>
        {value || placeholder || ""}
      </Text>
    </Pressable>
  );
}
