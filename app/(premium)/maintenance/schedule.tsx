// app/(premium)/maintenance/schedule.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";

import AppHeader from "../../../src/components/AppHeader";
import ToolHero from "../../../src/components/ToolHero";
import { useAppTheme, themeTokens } from "../../../src/theme/theme";
import { getDesign } from "../../../src/theme/design";
import { L2 } from "../../../src/styles/level2";
import { supabase } from "../../../src/lib/supabase";

// ---- DB ----
const SCHEDULE_TABLE = "maintenance_schedules";
const SERVICES_TABLE = "maintenance_services";

type UnitType = "km" | "months";
type Interval = { km?: string; months?: string };

type ScheduleKey =
  | "engine_oil"
  | "oil_filter"
  | "air_filter"
  | "coolant"
  | "brake_fluid"
  | "spark_plugs"
  | "valve_clearance"
  | "chain_lube"
  | "chain_adjust"
  | "tyres"
  | "brake_pads"
  | "fork_oil"
  | "steering_head_bearings"
  | "wheel_bearings";

type ScheduleJson = Record<ScheduleKey, Interval>;

const FIELDS: Array<{ key: ScheduleKey; label: string; hint: string }> = [
  { key: "engine_oil", label: "Engine oil", hint: "e.g. 6,000 km or 12 months" },
  { key: "oil_filter", label: "Oil filter", hint: "often with oil changes" },
  { key: "air_filter", label: "Air filter", hint: "depends on conditions" },
  { key: "coolant", label: "Coolant", hint: "e.g. 24 months" },
  { key: "brake_fluid", label: "Brake fluid", hint: "e.g. 24 months" },
  { key: "spark_plugs", label: "Spark plugs", hint: "varies by bike" },
  { key: "valve_clearance", label: "Valve clearance", hint: "varies by engine" },
  { key: "chain_lube", label: "Chain lube", hint: "frequent; optional" },
  { key: "chain_adjust", label: "Chain adjust", hint: "as needed; optional" },
  { key: "tyres", label: "Tyres", hint: "replace when worn" },
  { key: "brake_pads", label: "Brake pads", hint: "replace when worn" },
  { key: "fork_oil", label: "Fork oil", hint: "e.g. 24 months / 20,000 km" },
  { key: "steering_head_bearings", label: "Steering head bearings", hint: "inspection interval" },
  { key: "wheel_bearings", label: "Wheel bearings", hint: "inspection interval" },
];

const emptySchedule = (): ScheduleJson => {
  const out = {} as ScheduleJson;
  for (const f of FIELDS) out[f.key] = {};
  return out;
};

function digitsOnly(s: string) {
  return s.replace(/[^\d]/g, "");
}

function mergeSchedule(json: ScheduleJson | null): ScheduleJson {
  const base = emptySchedule();
  if (!json) return base;
  for (const k of Object.keys(base) as ScheduleKey[]) {
    base[k] = { ...(base[k] || {}), ...(json[k] || {}) };
  }
  return base;
}

function cleanSchedule(schedule: ScheduleJson): ScheduleJson {
  const cleaned: ScheduleJson = emptySchedule();
  for (const f of FIELDS) {
    const km = (schedule[f.key]?.km ?? "").trim();
    const months = (schedule[f.key]?.months ?? "").trim();
    const next: Interval = {};
    if (km) next.km = km;
    if (months) next.months = months;
    cleaned[f.key] = next;
  }
  return cleaned;
}

type ExistingService = { id: string; service_key: string; name: string };

export default function MaintenanceScheduleScreen() {
  const router = useRouter();
  const { bikeId } = useLocalSearchParams<{ bikeId?: string }>();

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const id = String(bikeId || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [schedule, setSchedule] = useState<ScheduleJson>(emptySchedule());

  const subtitle = useMemo(() => "Leave blank if not applicable. You can use km, months, or both.", []);

  const loadExisting = useCallback(async () => {
    if (!id) return;

    setError(null);
    setLoading(true);

    const { data, error: e } = await supabase
      .from(SCHEDULE_TABLE)
      .select("intervals")
      .eq("bike_id", id)
      .maybeSingle();

    if (e) {
      setError(e.message);
      setLoading(false);
      return;
    }

    setSchedule(mergeSchedule((data as any)?.intervals ?? null));
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadExisting().catch((e: any) => {
      setError(e?.message ?? "Failed to load schedule.");
      setLoading(false);
    });
  }, [loadExisting]);

  const setField = useCallback((key: ScheduleKey, which: UnitType, value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [which]: value },
    }));
  }, []);

  const syncServices = useCallback(
    async (cleaned: ScheduleJson) => {
      // Pull existing services for this bike
      const { data: existing, error: e0 } = await supabase
        .from(SERVICES_TABLE)
        .select("id,service_key,name")
        .eq("bike_id", id);

      if (e0) throw e0;

      const map = new Map<string, ExistingService>();
      (existing as ExistingService[] | null)?.forEach((r) => map.set(r.service_key, r));

      for (const f of FIELDS) {
        const km = cleaned[f.key]?.km;
        const months = cleaned[f.key]?.months;

        // blank schedule entry -> don’t create and don’t delete (no surprises)
        if (!km && !months) continue;

        const interval_type = km ? "distance" : "time";
        const interval_distance_km = km ? Number(km) : null;
        const interval_months = months ? Number(months) : null;

        const match = map.get(f.key);

        if (!match) {
          // CREATE ONCE
          const { error: ei } = await supabase.from(SERVICES_TABLE).insert({
            bike_id: id,
            service_key: f.key, // canonical, stable
            name: f.label,
            interval_type,
            interval_distance_km,
            interval_months,
            reminder_distance_km: null,
            reminder_days: null,
            pinned: false,
            estimated_cost: null,
            is_booked: false, // column is NOT NULL; but we’re not “using” booked in UI anymore
          });
          if (ei) throw ei;
        } else {
          // UPDATE INTELLIGENTLY: ONLY interval fields
          const { error: eu } = await supabase
            .from(SERVICES_TABLE)
            .update({
              interval_type,
              interval_distance_km,
              interval_months,
            })
            .eq("id", match.id);

          if (eu) throw eu;
        }
      }
    },
    [id]
  );

  const save = useCallback(async () => {
    if (!id) return;

    setSaving(true);
    setError(null);

    try {
      const cleaned = cleanSchedule(schedule);

      // 1) save schedule
      const { error: e1 } = await supabase
        .from(SCHEDULE_TABLE)
        .upsert({ bike_id: id, intervals: cleaned }, { onConflict: "bike_id" });

      if (e1) throw e1;

      // 2) sync services
      await syncServices(cleaned);

      // 3) back to bike screen and force refresh
      router.push({
        pathname: `/(premium)/maintenance/bike/${id}`,
        params: { refreshToken: String(Date.now()) },
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to save schedule.");
    } finally {
      setSaving(false);
    }
  }, [id, schedule, router, syncServices]);

  if (!bikeId) {
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: t.screenBg, gap: 10 }}>
        <Text style={{ color: t.text, fontWeight: "800" }}>Missing bikeId</Text>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
          <Text style={{ color: t.text, fontWeight: "800" }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.screenBg }}>
      <ScrollView
        style={{ backgroundColor: t.screenBg }}
        contentContainerStyle={{ paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ToolHero
          screen="Maintenance-tool"
          title="Service Schedule"
          subtitle="Set your intervals once. We’ll use them as your baseline."
        />

        <AppHeader title="Intervals" />

        <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 14 }}>
          <View
            style={{
              padding: 14,
              borderRadius: 16,
              backgroundColor: d.articleCardBg,
              borderWidth: 1,
              borderColor: d.articleCardBorder,
              gap: 8,
            }}
          >
            <Text style={{ color: t.text, fontWeight: "800" }}>How to use this</Text>
            <Text style={{ color: t.textMuted, lineHeight: 18, fontSize: 13 }}>{subtitle}</Text>
          </View>

          {error ? (
            <View
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: d.articleCardBg,
                borderWidth: 1,
                borderColor: d.articleCardBorder,
              }}
            >
              <Text style={{ color: t.text }}>{error}</Text>
            </View>
          ) : null}

          {loading ? (
            <Text style={{ color: t.textMuted, paddingVertical: 10 }}>Loading…</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {FIELDS.map((f) => {
                const km = schedule[f.key]?.km ?? "";
                const months = schedule[f.key]?.months ?? "";

                return (
                  <View
                    key={f.key}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      backgroundColor: d.articleCardBg,
                      borderWidth: 1,
                      borderColor: d.articleCardBorder,
                      gap: 10,
                    }}
                  >
                    <View style={{ gap: 4 }}>
                      <Text style={{ color: t.text, fontWeight: "800" }}>{f.label}</Text>
                      <Text style={{ color: t.textMuted, fontSize: 12 }}>{f.hint}</Text>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <View
                        style={{
                          flex: 1,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: t.pillBorder,
                          backgroundColor: t.pillBg,
                          paddingHorizontal: 12,
                          height: 44,
                          justifyContent: "center",
                        }}
                      >
                        <TextInput
                          value={km}
                          onChangeText={(txt) => setField(f.key, "km", digitsOnly(txt))}
                          placeholder="km"
                          placeholderTextColor={t.textMuted}
                          keyboardType="number-pad"
                          style={{ color: t.text, fontSize: 14 }}
                        />
                      </View>

                      <View
                        style={{
                          flex: 1,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: t.pillBorder,
                          backgroundColor: t.pillBg,
                          paddingHorizontal: 12,
                          height: 44,
                          justifyContent: "center",
                        }}
                      >
                        <TextInput
                          value={months}
                          onChangeText={(txt) => setField(f.key, "months", digitsOnly(txt))}
                          placeholder="months"
                          placeholderTextColor={t.textMuted}
                          keyboardType="number-pad"
                          style={{ color: t.text, fontSize: 14 }}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <Pressable
            onPress={save}
            disabled={saving || loading}
            style={({ pressed }) => [L2.ctaOuter, { opacity: saving || loading ? 0.7 : pressed ? 0.92 : 1 }]}
          >
            <LinearGradient
              colors={[...d.goldGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View style={L2.ctaInner}>
              <Text style={[L2.ctaText, { color: d.goldTextOn }]}>{saving ? "Saving…" : "Save schedule"}</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}