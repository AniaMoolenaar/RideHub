import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";

import AppHeader from "../../../src/components/AppHeader";
import ToolHero from "../../../src/components/ToolHero";
import { useAppTheme, themeTokens } from "../../../src/theme/theme";
import { getDesign } from "../../../src/theme/design";
import { L2 } from "../../../src/styles/level2";

import { fetchBikeDetails, upsertService } from "../../../src/features/maintenance/api";
import type { ServiceRow } from "../../../src/features/maintenance/types";

const SUGGESTIONS = [
  "Oil & filter",
  "Chain clean & lube",
  "Chain adjustment",
  "Brake fluid",
  "Coolant",
  "Air filter",
  "Tyres",
  "Brake pads",
];

type IntervalType = "distance" | "time";

function digitsOnly(s: string) {
  return s.replace(/[^\d]/g, "");
}

export default function ServiceScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const { bikeId, mode, serviceId } = useLocalSearchParams<{
    bikeId?: string;
    mode?: "create" | "edit";
    serviceId?: string;
  }>();

  const bikeIdStr = String(bikeId ?? "");
  const isEdit = mode === "edit";

  const [name, setName] = useState("");
  const [intervalType, setIntervalType] = useState<IntervalType>("distance");
  const [intervalValue, setIntervalValue] = useState("");
  const [reminderValue, setReminderValue] = useState(""); // OPTIONAL

  const [loading, setLoading] = useState<boolean>(!!isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (!isEdit) setTimeout(() => nameRef.current?.focus(), 120);
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    if (!bikeIdStr || !serviceId) return;

    (async () => {
      setError(null);
      try {
        setLoading(true);

        const details = await fetchBikeDetails(bikeIdStr);
        const svc = details.services.find((s) => s.id === serviceId) as ServiceRow | undefined;
        if (!svc) throw new Error("Service not found.");

        setName(svc.name ?? "");

        const tpe = (svc.interval_type as IntervalType) ?? "distance";
        setIntervalType(tpe);

        const interval = tpe === "distance" ? svc.interval_distance_km : svc.interval_months;
        setIntervalValue(interval != null ? String(interval) : "");

        const reminder = tpe === "distance" ? svc.reminder_distance_km : svc.reminder_days;
        setReminderValue(reminder != null ? String(reminder) : "");
      } catch (e: any) {
        setError(e?.message ?? "Failed to load service.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, bikeIdStr, serviceId]);

  const filteredSuggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q) return SUGGESTIONS.slice(0, 6);
    return SUGGESTIONS.filter((s) => s.toLowerCase().includes(q)).slice(0, 6);
  }, [name]);

  const intervalLabel = intervalType === "distance" ? "Interval (km)" : "Interval (months)";
  const reminderLabel = intervalType === "distance" ? "Reminder (km) (optional)" : "Reminder (days) (optional)";

  const onSave = useCallback(async () => {
    setError(null);

    if (!bikeIdStr) return setError("Missing bike id.");
    if (!name.trim()) return setError("Service name is required.");

    const iv = Number(intervalValue);
    if (!intervalValue.trim() || Number.isNaN(iv)) return setError("Interval must be a number.");

    const rTrim = reminderValue.trim();
    const rv = rTrim ? Number(rTrim) : null;
    if (rTrim && Number.isNaN(rv as any)) return setError("Reminder must be a number or blank.");

    setSaving(true);
    try {
      await upsertService({
        bike_id: bikeIdStr as any,
        service_id: isEdit ? (serviceId as any) : undefined,
        name: name.trim(),
        interval_type: intervalType,
        interval_value: iv,
        reminder_threshold: rv,
      });

      router.replace({
        pathname: `/(premium)/maintenance/bike/${bikeIdStr}`,
        params: { refreshToken: String(Date.now()) },
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to save service.");
    } finally {
      setSaving(false);
    }
  }, [bikeIdStr, isEdit, name, intervalType, intervalValue, reminderValue, serviceId, router]);

  if (!bikeIdStr) {
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: t.screenBg, gap: 10 }}>
        <Text style={{ color: t.text, fontWeight: "800" }}>Missing bikeId</Text>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
          <Text style={{ color: t.text, fontWeight: "800" }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: t.screenBg }}>
        <Text style={{ opacity: 0.7, color: t.text }}>Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.screenBg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        style={{ backgroundColor: t.screenBg }}
        contentContainerStyle={{ paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ToolHero
          screen="Maintenance-tool"
          title={isEdit ? "Edit service" : "Add service"}
          subtitle="Interval is required. Reminder is optional."
        />

        <AppHeader title="Details" />

        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 14 }}>
          <View style={[styles.card, { backgroundColor: d.articleCardBg, borderColor: d.articleCardBorder }]}>
            <Text style={{ color: t.text, fontWeight: "800" }}>Service name</Text>

            <View style={[styles.inputWrap, { backgroundColor: t.pillBg, borderColor: t.pillBorder }]}>
              <TextInput
                ref={nameRef}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Oil & filter"
                placeholderTextColor={t.textMuted}
                autoCapitalize="sentences"
                autoCorrect={false}
                style={{ flex: 1, fontSize: 14, color: t.text }}
              />
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {filteredSuggestions.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setName(s)}
                  style={({ pressed }) => [
                    styles.suggestionChip,
                    {
                      backgroundColor: t.pillBg,
                      borderColor: t.pillBorder,
                      opacity: pressed ? 0.92 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontWeight: "800", color: t.text }}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: d.articleCardBg, borderColor: d.articleCardBorder }]}>
            <Text style={{ color: t.text, fontWeight: "800" }}>Interval type</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <Chip selected={intervalType === "distance"} onPress={() => setIntervalType("distance")} label="Distance" t={t} />
              <Chip selected={intervalType === "time"} onPress={() => setIntervalType("time")} label="Time" t={t} />
            </View>
          </View>

          <Field
            label={intervalLabel}
            value={intervalValue}
            onChangeText={(v) => setIntervalValue(digitsOnly(v))}
            keyboardType="number-pad"
            t={t}
            d={d}
            placeholder="Required"
          />

          <Field
            label={reminderLabel}
            value={reminderValue}
            onChangeText={(v) => setReminderValue(digitsOnly(v))}
            keyboardType="number-pad"
            t={t}
            d={d}
            placeholder="Optional"
          />

          {error ? (
            <View style={[styles.errorCard, { backgroundColor: d.articleCardBg, borderColor: d.articleCardBorder }]}>
              <Text style={{ color: t.text, fontWeight: "800" }}>Fix this</Text>
              <Text style={{ color: t.textMuted, marginTop: 4 }}>{error}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: t.screenBg, borderTopColor: t.pillBorder }]}>
        <GradientCta label={saving ? "Saving…" : "Save service"} onPress={onSave} disabled={saving} d={d} />
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  t,
  d,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: any;
  t: ReturnType<typeof themeTokens>;
  d: ReturnType<typeof getDesign>;
  placeholder?: string;
}) {
  return (
    <View style={[styles.card, { backgroundColor: d.articleCardBg, borderColor: d.articleCardBorder }]}>
      <Text style={{ color: t.text, fontWeight: "800" }}>{label}</Text>

      <View style={[styles.inputWrap, { backgroundColor: t.pillBg, borderColor: t.pillBorder }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder ?? ""}
          placeholderTextColor={t.textMuted}
          style={{ flex: 1, fontSize: 14, color: t.text }}
        />
      </View>
    </View>
  );
}

function Chip({
  selected,
  onPress,
  label,
  t,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  t: ReturnType<typeof themeTokens>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? t.text : t.pillBg,
          borderColor: selected ? t.text : t.pillBorder,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <Text style={{ color: selected ? t.screenBg : t.text, fontWeight: "800" }}>{label}</Text>
    </Pressable>
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
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  suggestionChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  errorCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 70,
    borderTopWidth: 1,
  },
});