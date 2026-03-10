import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";

import ToolHero from "../../../components/ToolHero";
import AppHeader from "../../../components/AppHeader";
import { useAppTheme, themeTokens } from "../../../theme/theme";
import { getDesign } from "../../../theme/design";
import { L1 } from "../../../styles/level1";
import { L2 } from "../../../styles/level2";
import { supabase } from "../../../lib/supabase";

type ServiceType = "single" | "minor" | "major";
type FinalDriveType = "chain" | "belt" | "shaft";

type BikeRow = {
  id: string;
  final_drive_type: FinalDriveType | null;
};

type ServiceEditRow = {
  id: string;
  name: string;
  service_type: ServiceType | null;
  interval_distance_km: number | null;
  interval_months: number | null;
  interval_hours: number | null;
  last_completed_date_cache: string | null;
  last_completed_odometer_km_cache: number | null;
  last_completed_engine_hours_cache: number | null;
  deleted_at: string | null;
};

type ServiceItemRow = {
  item_key: string;
  item_name: string;
};

const ITEM_LABELS: Record<string, string> = {
  engine_oil: "Engine oil",
  oil_filter: "Oil filter",
  air_filter: "Air filter",
  spark_plugs: "Spark plugs",
  coolant: "Coolant",
  brake_fluid: "Brake fluid",
  brake_pads: "Brake pads",
  chain_clean: "Chain clean",
  chain_adjust: "Chain adjust",
  chain_lube: "Chain lube",
  belt_inspection: "Belt inspection",
  belt_tension: "Belt tension",
  belt_replacement: "Belt replacement",
  tyres: "Tyres",
  fork_oil: "Fork oil",
  battery_check: "Battery check",
  general_inspection: "General inspection",
  valve_clearance: "Valve clearance",
};

const ORDERED_ITEM_KEYS = [
  "engine_oil",
  "oil_filter",
  "air_filter",
  "spark_plugs",
  "coolant",
  "brake_fluid",
  "brake_pads",
  "chain_clean",
  "chain_adjust",
  "chain_lube",
  "belt_inspection",
  "belt_tension",
  "belt_replacement",
  "tyres",
  "fork_oil",
  "battery_check",
  "general_inspection",
  "valve_clearance",
] as const;

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, "");
}

function serviceKey(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function toDateInputValue(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function getDriveAwareDefaults(
  serviceType: ServiceType,
  finalDriveType: FinalDriveType
): string[] {
  if (serviceType === "single") return [];

  if (serviceType === "minor") {
    const base = ["engine_oil", "oil_filter", "general_inspection"];
    if (finalDriveType === "chain") base.push("chain_clean", "chain_lube");
    if (finalDriveType === "belt") base.push("belt_inspection");
    return base;
  }

  return [
    "engine_oil",
    "oil_filter",
    "air_filter",
    "spark_plugs",
    "coolant",
    "brake_fluid",
    "general_inspection",
    "valve_clearance",
  ];
}

function getSuggestedName(serviceType: ServiceType) {
  if (serviceType === "minor") return "Minor service";
  if (serviceType === "major") return "Major service";
  return "";
}

function buildNextDueDate(lastDoneDate: string, intervalMonths: number | null) {
  if (!lastDoneDate || intervalMonths == null) return null;
  const date = new Date(lastDoneDate);
  if (Number.isNaN(date.getTime())) return null;
  date.setMonth(date.getMonth() + intervalMonths);
  return date.toISOString().slice(0, 10);
}

export default function AddTrackedServiceScreen() {
  const router = useRouter();
  const { bikeId, serviceId } = useLocalSearchParams<{
    bikeId?: string;
    serviceId?: string;
  }>();

  const editing = !!serviceId;

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [finalDriveType, setFinalDriveType] = useState<FinalDriveType>("chain");
  const [serviceType, setServiceType] = useState<ServiceType>("single");
  const [name, setName] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [lastDoneKm, setLastDoneKm] = useState("");
  const [lastDoneHours, setLastDoneHours] = useState("");
  const [lastDoneDate, setLastDoneDate] = useState("");
  const [intervalKm, setIntervalKm] = useState("");
  const [intervalMonths, setIntervalMonths] = useState("");
  const [intervalHours, setIntervalHours] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!bikeId) {
        setError("Missing bike id.");
        setLoaded(true);
        return;
      }

      setError(null);

      const { data: bikeData, error: bikeError } = await supabase
        .from("maintenance_bikes")
        .select("id, final_drive_type")
        .eq("id", bikeId)
        .single();

      if (cancelled) return;

      if (bikeError || !bikeData) {
        setError(bikeError?.message ?? "Bike not found.");
        setLoaded(true);
        return;
      }

      const bike = bikeData as BikeRow;
      const drive = bike.final_drive_type ?? "chain";
      setFinalDriveType(drive);

      if (!editing || !serviceId) {
        setLoaded(true);
        return;
      }

      const { data: serviceData, error: serviceError } = await supabase
        .from("maintenance_services")
        .select(
          "id, name, service_type, interval_distance_km, interval_months, interval_hours, last_completed_date_cache, last_completed_odometer_km_cache, last_completed_engine_hours_cache, deleted_at"
        )
        .eq("id", serviceId)
        .single();

      if (cancelled) return;

      if (serviceError || !serviceData) {
        setError(serviceError?.message ?? "Failed to load service.");
        setLoaded(true);
        return;
      }

      const row = serviceData as ServiceEditRow;
      setServiceType(row.service_type ?? "single");
      setName(row.name ?? "");
      setLastDoneKm(
        row.last_completed_odometer_km_cache != null
          ? String(Math.round(row.last_completed_odometer_km_cache))
          : ""
      );
      setLastDoneHours(
        row.last_completed_engine_hours_cache != null
          ? String(Math.round(row.last_completed_engine_hours_cache))
          : ""
      );
      setLastDoneDate(toDateInputValue(row.last_completed_date_cache));
      setIntervalKm(
        row.interval_distance_km != null ? String(Math.round(row.interval_distance_km)) : ""
      );
      setIntervalMonths(
        row.interval_months != null ? String(row.interval_months) : ""
      );
      setIntervalHours(
        row.interval_hours != null ? String(Math.round(row.interval_hours)) : ""
      );

      const { data: itemRows } = await supabase
        .from("maintenance_service_items")
        .select("item_key, item_name")
        .eq("service_id", serviceId)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      const keys = ((itemRows ?? []) as ServiceItemRow[]).map((item) => item.item_key);
      setSelectedItems(keys);
      setLoaded(true);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [bikeId, editing, serviceId]);

  const visibleItems = useMemo(() => {
    return ORDERED_ITEM_KEYS.filter((key) => {
      if (
        finalDriveType !== "chain" &&
        ["chain_clean", "chain_adjust", "chain_lube"].includes(key)
      ) {
        return false;
      }

      if (
        finalDriveType !== "belt" &&
        ["belt_inspection", "belt_tension", "belt_replacement"].includes(key)
      ) {
        return false;
      }

      return true;
    });
  }, [finalDriveType]);

  function applyType(nextType: ServiceType) {
    setServiceType(nextType);

    if (!editing) {
      const suggestedName = getSuggestedName(nextType);
      if (suggestedName) {
        setName(suggestedName);
      } else if (nextType === "single") {
        setName("");
      }

      setSelectedItems(getDriveAwareDefaults(nextType, finalDriveType));
    }
  }

  function toggleItem(itemKey: string) {
    setSelectedItems((prev) =>
      prev.includes(itemKey)
        ? prev.filter((key) => key !== itemKey)
        : [...prev, itemKey]
    );
  }

  async function save() {
    setError(null);

    if (!bikeId) {
      setError("Missing bike id.");
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Service name is required.");
      return;
    }

    if (serviceType !== "single" && selectedItems.length === 0) {
      setError("Select at least one included item.");
      return;
    }

    if (serviceType === "single" && selectedItems.length > 1) {
      setError("Single item can only include one item.");
      return;
    }

    const intervalKmValue = intervalKm.trim() ? Number(intervalKm) : null;
    const intervalMonthsValue = intervalMonths.trim() ? Number(intervalMonths) : null;
    const intervalHoursValue = intervalHours.trim() ? Number(intervalHours) : null;
    const lastKmValue = lastDoneKm.trim() ? Number(lastDoneKm) : null;
    const lastHoursValue = lastDoneHours.trim() ? Number(lastDoneHours) : null;

    if (
      intervalKmValue == null &&
      intervalMonthsValue == null &&
      intervalHoursValue == null
    ) {
      setError("Add at least one interval.");
      return;
    }

    setSaving(true);

    try {
      const nextDueKm =
        lastKmValue != null && intervalKmValue != null
          ? lastKmValue + intervalKmValue
          : null;

      const nextDueHours =
        lastHoursValue != null && intervalHoursValue != null
          ? lastHoursValue + intervalHoursValue
          : null;

      const nextDueDate = buildNextDueDate(lastDoneDate, intervalMonthsValue);

      const payload = {
        bike_id: bikeId,
        name: trimmedName,
        service_type: serviceType,
        interval_type:
          intervalMonthsValue != null && intervalKmValue == null ? "time" : "distance",
        interval_distance_km: intervalKmValue,
        interval_months: intervalMonthsValue,
        interval_hours: intervalHoursValue,
        service_key: serviceKey(trimmedName),
        last_completed_date_cache: lastDoneDate || null,
        last_completed_odometer_km_cache: lastKmValue,
        last_completed_engine_hours_cache: lastHoursValue,
        next_due_odometer_km_cache: nextDueKm,
        next_due_engine_hours_cache: nextDueHours,
        next_due_date_cache: nextDueDate,
        deleted_at: null,
        is_archived: false,
      };

      let targetServiceId = serviceId ?? "";

      if (editing && serviceId) {
        const { error: updateError } = await supabase
          .from("maintenance_services")
          .update(payload)
          .eq("id", serviceId);

        if (updateError) throw updateError;
        targetServiceId = serviceId;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("maintenance_services")
          .insert(payload)
          .select("id")
          .single();

        if (insertError || !inserted) {
          throw insertError ?? new Error("Failed to create service.");
        }

        targetServiceId = inserted.id;
      }

      const { error: deleteItemsError } = await supabase
        .from("maintenance_service_items")
        .delete()
        .eq("service_id", targetServiceId);

      if (deleteItemsError) throw deleteItemsError;

      if (selectedItems.length > 0) {
        const itemPayload = selectedItems.map((itemKey) => ({
          service_id: targetServiceId,
          item_key: itemKey,
          item_name: ITEM_LABELS[itemKey] ?? itemKey,
        }));

        const { error: itemInsertError } = await supabase
          .from("maintenance_service_items")
          .insert(itemPayload);

        if (itemInsertError) throw itemInsertError;
      }

      router.back();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save service.");
    } finally {
      setSaving(false);
    }
  }

  async function archiveService() {
    if (!serviceId) return;

    setSaving(true);
    setError(null);

    try {
      const { error: archiveError } = await supabase
        .from("maintenance_services")
        .update({
          is_archived: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", serviceId);

      if (archiveError) throw archiveError;

      router.back();
    } catch (e: any) {
      setError(e?.message ?? "Failed to archive service.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[L1.screen, { backgroundColor: t.screenBg }]}>
      <ScrollView
        style={{ backgroundColor: t.screenBg }}
        contentContainerStyle={[L1.scrollContent24, { paddingBottom: 180 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ToolHero
          screen="Maintenance-tool"
          title={editing ? "Edit service" : "Add service"}
          subtitle="Set baseline first, then interval"
        />

        <AppHeader title="Service setup" />

        <View style={styles.wrap}>
          {!loaded ? null : (
            <>
              <View style={styles.typeRow}>
                {(["single", "minor", "major"] as ServiceType[]).map((type) => {
                  const selected = serviceType === type;

                  return (
                    <Pressable
                      key={type}
                      onPress={() => applyType(type)}
                      style={({ pressed }) => [
                        styles.typeChip,
                        {
                          backgroundColor: selected ? t.text : t.pillBg,
                          borderColor: selected ? t.text : t.pillBorder,
                          opacity: pressed ? 0.92 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: selected ? t.screenBg : t.text,
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        {type === "single"
                          ? "Single item"
                          : type === "minor"
                          ? "Minor service"
                          : "Major service"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Service name"
                placeholderTextColor={t.textMuted}
                style={[
                  styles.input,
                  { backgroundColor: t.pillBg, color: t.text, borderColor: t.pillBorder },
                ]}
              />

              <Text style={[styles.groupLabel, { color: t.textMuted }]}>Includes</Text>

              <View style={styles.itemWrap}>
                {visibleItems.map((itemKey) => {
                  const selected = selectedItems.includes(itemKey);

                  return (
                    <Pressable
                      key={itemKey}
                      onPress={() => {
                        if (serviceType === "single") {
                          setSelectedItems(selected ? [] : [itemKey]);
                        } else {
                          toggleItem(itemKey);
                        }
                      }}
                      style={({ pressed }) => [
                        styles.itemChip,
                        {
                          backgroundColor: selected ? t.text : t.pillBg,
                          borderColor: selected ? t.text : t.pillBorder,
                          opacity: pressed ? 0.92 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: selected ? t.screenBg : t.text,
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        {ITEM_LABELS[itemKey]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.groupLabel, { color: t.textMuted }]}>Last done</Text>

              <TextInput
                value={lastDoneKm}
                onChangeText={(v) => setLastDoneKm(digitsOnly(v))}
                placeholder="Last done km"
                placeholderTextColor={t.textMuted}
                keyboardType="number-pad"
                style={[
                  styles.input,
                  { backgroundColor: t.pillBg, color: t.text, borderColor: t.pillBorder },
                ]}
              />

              <TextInput
                value={lastDoneHours}
                onChangeText={(v) => setLastDoneHours(digitsOnly(v))}
                placeholder="Last done engine hours"
                placeholderTextColor={t.textMuted}
                keyboardType="number-pad"
                style={[
                  styles.input,
                  { backgroundColor: t.pillBg, color: t.text, borderColor: t.pillBorder },
                ]}
              />

              <TextInput
                value={lastDoneDate}
                onChangeText={setLastDoneDate}
                placeholder="Last done date (YYYY-MM-DD)"
                placeholderTextColor={t.textMuted}
                style={[
                  styles.input,
                  { backgroundColor: t.pillBg, color: t.text, borderColor: t.pillBorder },
                ]}
              />

              <Text style={[styles.groupLabel, { color: t.textMuted }]}>Interval</Text>

              <TextInput
                value={intervalKm}
                onChangeText={(v) => setIntervalKm(digitsOnly(v))}
                placeholder="Interval km"
                placeholderTextColor={t.textMuted}
                keyboardType="number-pad"
                style={[
                  styles.input,
                  { backgroundColor: t.pillBg, color: t.text, borderColor: t.pillBorder },
                ]}
              />

              <TextInput
                value={intervalMonths}
                onChangeText={(v) => setIntervalMonths(digitsOnly(v))}
                placeholder="Interval months"
                placeholderTextColor={t.textMuted}
                keyboardType="number-pad"
                style={[
                  styles.input,
                  { backgroundColor: t.pillBg, color: t.text, borderColor: t.pillBorder },
                ]}
              />

              <TextInput
                value={intervalHours}
                onChangeText={(v) => setIntervalHours(digitsOnly(v))}
                placeholder="Interval engine hours"
                placeholderTextColor={t.textMuted}
                keyboardType="number-pad"
                style={[
                  styles.input,
                  { backgroundColor: t.pillBg, color: t.text, borderColor: t.pillBorder },
                ]}
              />

              {error ? (
                <Text style={[styles.errorText, { color: t.text }]}>{error}</Text>
              ) : null}

              {editing ? (
                <Pressable
                  onPress={archiveService}
                  disabled={saving}
                  style={({ pressed }) => [
                    styles.archiveButton,
                    {
                      backgroundColor: t.pillBg,
                      borderColor: t.pillBorder,
                      opacity: saving ? 0.6 : pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.archiveText, { color: t.text }]}>
                    Archive service
                  </Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.cta}>
        <Pressable
          onPress={save}
          disabled={saving || !loaded}
          style={({ pressed }) => [
            L2.ctaOuter,
            { opacity: saving || !loaded ? 0.6 : pressed ? 0.92 : 1 },
          ]}
        >
          <LinearGradient
            colors={d.goldGradient as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={L2.absoluteFill}
          />
          <View style={L2.ctaInner}>
            <Text style={[L2.ctaText, { color: d.goldTextOn }]}>
              {saving ? "Saving..." : editing ? "Save changes" : "Save service"}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  input: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  itemWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  itemChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
  archiveButton: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    marginTop: 6,
  },
  archiveText: {
    fontSize: 14,
    fontWeight: "700",
  },
  cta: {
    position: "absolute",
    bottom: 65,
    left: 20,
    right: 20,
  },
});