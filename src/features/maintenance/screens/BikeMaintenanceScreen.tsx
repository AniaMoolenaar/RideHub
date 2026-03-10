import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { History } from "lucide-react-native";

import ToolHero from "../../../components/ToolHero";
import AppHeader from "../../../components/AppHeader";
import { useAppTheme, themeTokens } from "../../../theme/theme";
import { getDesign } from "../../../theme/design";
import { L1 } from "../../../styles/level1";
import { L2 } from "../../../styles/level2";
import { supabase } from "../../../lib/supabase";

type BikeRow = {
  id: string;
  display_name: string;
  odometer_km: number;
  engine_hours_value: number | null;
};

type ServiceType = "single" | "minor" | "major";

type RawServiceRow = {
  id: string;
  name: string;
  service_type: ServiceType | null;
  included_items: string[] | null;
  interval_distance_km: number | null;
  interval_months: number | null;
  interval_hours: number | null;
  last_completed_date_cache: string | null;
  last_completed_odometer_km_cache: number | null;
  last_completed_engine_hours_cache: number | null;
  next_due_odometer_km_cache: number | null;
  next_due_engine_hours_cache: number | null;
  next_due_date_cache: string | null;
  deleted_at: string | null;
  is_archived: boolean | null;
};

type UiService = {
  id: string;
  title: string;
  subtitle: string;
  typeLabel: string;
  includesLine: string | null;
  statusRank: number;
};

function formatServiceType(type: ServiceType | null) {
  if (type === "minor") return "Minor service";
  if (type === "major") return "Major service";
  return "Single item";
}

function formatInterval(service: RawServiceRow) {
  const parts: string[] = [];

  if (service.interval_distance_km) {
    parts.push(`${service.interval_distance_km.toLocaleString()} km`);
  }
  if (service.interval_months) {
    parts.push(`${service.interval_months} months`);
  }
  if (service.interval_hours) {
    parts.push(`${service.interval_hours.toLocaleString()} hours`);
  }

  if (!parts.length) return "No interval";
  return `Every ${parts.join(" · ")}`;
}

function formatLastDone(service: RawServiceRow) {
  const parts: string[] = [];

  if (service.last_completed_odometer_km_cache != null) {
    parts.push(`${service.last_completed_odometer_km_cache.toLocaleString()} km`);
  }

  if (service.last_completed_engine_hours_cache != null) {
    parts.push(`${service.last_completed_engine_hours_cache.toLocaleString()} h`);
  }

  if (service.last_completed_date_cache) {
    parts.push(new Date(service.last_completed_date_cache).toLocaleDateString());
  }

  if (!parts.length) return "Last done not set";
  return `Last done: ${parts.join(" · ")}`;
}

function formatDueText(bike: BikeRow, service: RawServiceRow) {
  if (service.next_due_odometer_km_cache != null) {
    const remaining = Math.round(service.next_due_odometer_km_cache - bike.odometer_km);

    if (remaining < 0) return `Overdue by ${Math.abs(remaining).toLocaleString()} km`;
    if (remaining === 0) return "Due now";
    return `Due in ${remaining.toLocaleString()} km`;
  }

  if (
    service.next_due_engine_hours_cache != null &&
    bike.engine_hours_value != null
  ) {
    const remaining = Math.round(
      service.next_due_engine_hours_cache - bike.engine_hours_value
    );

    if (remaining < 0) return `Overdue by ${Math.abs(remaining).toLocaleString()} h`;
    if (remaining === 0) return "Due now";
    return `Due in ${remaining.toLocaleString()} h`;
  }

  if (service.next_due_date_cache) {
    return `Due ${new Date(service.next_due_date_cache).toLocaleDateString()}`;
  }

  return null;
}

function getStatusRank(bike: BikeRow, service: RawServiceRow) {
  const hasBaseline =
    service.last_completed_date_cache != null ||
    service.last_completed_odometer_km_cache != null ||
    service.last_completed_engine_hours_cache != null;

  if (!hasBaseline) return 0;

  if (
    service.next_due_odometer_km_cache != null &&
    bike.odometer_km >= service.next_due_odometer_km_cache
  ) {
    return 1;
  }

  if (
    service.next_due_odometer_km_cache != null &&
    bike.odometer_km >= service.next_due_odometer_km_cache - 1000
  ) {
    return 2;
  }

  return 3;
}

function buildUiService(bike: BikeRow, service: RawServiceRow): UiService {
  const dueText = formatDueText(bike, service);
  const intervalText = formatInterval(service);
  const lastDoneText = formatLastDone(service);

  const subtitle =
    getStatusRank(bike, service) === 0
      ? `${intervalText} · Log first completion`
      : dueText
      ? `${dueText} · ${lastDoneText}`
      : `${intervalText} · ${lastDoneText}`;

  const items = Array.isArray(service.included_items) ? service.included_items : [];
  const includesLine =
    items.length > 0 ? `Includes: ${items.join(", ")}` : null;

  return {
    id: service.id,
    title: service.name,
    subtitle,
    typeLabel: formatServiceType(service.service_type),
    includesLine,
    statusRank: getStatusRank(bike, service),
  };
}

export default function BikeMaintenanceScreen() {
  const router = useRouter();
  const { bikeId } = useLocalSearchParams<{ bikeId?: string }>();

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const [bike, setBike] = useState<BikeRow | null>(null);
  const [services, setServices] = useState<UiService[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!bikeId) return;

    const { data: bikeData } = await supabase
      .from("maintenance_bikes")
      .select("id, display_name, odometer_km, engine_hours_value")
      .eq("id", bikeId)
      .single();

    const { data: serviceData } = await supabase
      .from("maintenance_services")
      .select("*")
      .eq("bike_id", bikeId)
      .order("created_at", { ascending: true });

    const active = ((serviceData ?? []) as RawServiceRow[]).filter(
      (s) => !s.deleted_at && !s.is_archived
    );

    const ui = active
      .map((s) => buildUiService(bikeData as BikeRow, s))
      .sort((a, b) => a.statusRank - b.statusRank);

    setBike(bikeData as BikeRow);
    setServices(ui);
  }, [bikeId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  function deleteService(serviceId: string) {
    Alert.alert(
      "Delete service",
      "Are you sure you want to delete this service?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await supabase
              .from("maintenance_services")
              .update({ deleted_at: new Date().toISOString() })
              .eq("id", serviceId);

            load();
          },
        },
      ]
    );
  }

  return (
    <View style={[L1.screen, { backgroundColor: t.screenBg }]}>
      <ScrollView
        style={{ backgroundColor: t.screenBg }}
        contentContainerStyle={[L1.scrollContent24, { paddingBottom: 160 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        <ToolHero
          screen="Maintenance-tool"
          title={bike?.display_name ?? "Maintenance"}
          subtitle={bike ? `${bike.odometer_km.toLocaleString()} km` : " "}
        />

        <AppHeader
          title="Bike maintenance"
          right={
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(premium)/maintenance/history",
                  params: { bikeId: bike?.id },
                })
              }
              style={({ pressed }) => [
                styles.historyIconButton,
                { opacity: pressed ? 0.92 : 1 },
              ]}
            >
              <History size={18} color={t.text} />
            </Pressable>
          }
        />

        <View style={styles.wrap}>
          {services.map((item) => (
            <View
              key={item.id}
              style={[
                styles.serviceRow,
                { backgroundColor: t.pillBg, borderColor: t.pillBorder },
              ]}
            >
              <Text style={[styles.serviceType, { color: t.textMuted }]}>
                {item.typeLabel}
              </Text>

              <Text style={[styles.serviceName, { color: t.text }]}>
                {item.title}
              </Text>

              <Text style={[styles.serviceMeta, { color: t.textMuted }]}>
                {item.subtitle}
              </Text>

              {item.includesLine ? (
                <Text style={[styles.serviceIncludes, { color: t.textMuted }]}>
                  {item.includesLine}
                </Text>
              ) : null}

              <Pressable
                style={styles.deleteButton}
                onPress={() => deleteService(item.id)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.ctaWrap}>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(premium)/maintenance/add-service",
              params: { bikeId: bike?.id },
            })
          }
          style={({ pressed }) => [L2.ctaOuter, { opacity: pressed ? 0.92 : 1 }]}
        >
          <LinearGradient
            colors={d.goldGradient as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={L2.absoluteFill}
          />

          <View style={L2.ctaInner}>
            <Text style={[L2.ctaText, { color: d.goldTextOn }]}>
              Add service
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },

  historyIconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  serviceRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },

  serviceType: { fontSize: 11, fontWeight: "700" },
  serviceName: { fontSize: 14, fontWeight: "800" },
  serviceMeta: { fontSize: 12 },
  serviceIncludes: { fontSize: 12 },

  deleteButton: {
    position: "absolute",
    bottom: 8,
    right: 12,
  },

  deleteText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },

  ctaWrap: {
    position: "absolute",
    bottom: 65,
    left: 20,
    right: 20,
  },
});