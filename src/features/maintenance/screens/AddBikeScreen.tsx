import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import ToolHero from "../../../components/ToolHero";
import AppHeader from "../../../components/AppHeader";
import { useAppTheme, themeTokens } from "../../../theme/theme";
import { getDesign } from "../../../theme/design";
import { L1 } from "../../../styles/level1";
import { L2 } from "../../../styles/level2";
import { supabase } from "../../../lib/supabase";

type FinalDriveType = "chain" | "belt" | "shaft";

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, "");
}

function buildDisplayName(make: string, model: string, year: string) {
  const parts = [year.trim(), make.trim(), model.trim()].filter(Boolean);
  return parts.join(" ");
}

export default function AddBikeScreen() {
  const router = useRouter();

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [odometerKm, setOdometerKm] = useState("");
  const [engineHours, setEngineHours] = useState("");
  const [finalDriveType, setFinalDriveType] = useState<FinalDriveType>("chain");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestedDisplayName = useMemo(() => {
    return buildDisplayName(make, model, year);
  }, [make, model, year]);

  async function saveBike() {
    setError(null);

    const trimmedMake = make.trim();
    const trimmedModel = model.trim();
    const trimmedYear = year.trim();
    const trimmedDisplayName = displayName.trim() || suggestedDisplayName;

    if (!trimmedMake) {
      setError("Make is required.");
      return;
    }

    if (!trimmedModel) {
      setError("Model is required.");
      return;
    }

    if (!trimmedDisplayName) {
      setError("Display name is required.");
      return;
    }

    if (!odometerKm.trim()) {
      setError("Odometer is required.");
      return;
    }

    const odometerValue = Number(odometerKm);
    if (Number.isNaN(odometerValue)) {
      setError("Odometer must be a number.");
      return;
    }

    const yearValue = trimmedYear ? Number(trimmedYear) : null;
    if (trimmedYear && Number.isNaN(yearValue)) {
      setError("Year must be a number.");
      return;
    }

    const engineHoursValue = engineHours.trim() ? Number(engineHours) : null;
    if (engineHours.trim() && Number.isNaN(engineHoursValue)) {
      setError("Engine hours must be a number.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error("You must be signed in.");
      }

      const { error: insertError } = await supabase.from("maintenance_bikes").insert({
        user_id: user.id,
        display_name: trimmedDisplayName,
        make: trimmedMake,
        model: trimmedModel,
        year: yearValue,
        unit: "km",
        odometer_value: odometerValue,
        odometer_km: odometerValue,
        last_odometer_at: new Date().toISOString(),
        engine_hours_value: engineHoursValue,
        service_meter_type: engineHoursValue != null ? "hours" : "distance",
        final_drive_type: finalDriveType,
      });

      if (insertError) {
        throw insertError;
      }

      router.back();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save bike.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[L1.screen, { backgroundColor: t.screenBg }]}>
      <ScrollView
        style={{ backgroundColor: t.screenBg }}
        contentContainerStyle={[L1.scrollContent24, { paddingBottom: 160 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ToolHero
          screen="Maintenance-tool"
          title="Add bike"
          subtitle="Set the bike up once"
        />

        <AppHeader title="Bike details" />

        <View style={styles.wrap}>
          <TextInput
            value={make}
            onChangeText={setMake}
            placeholder="Make"
            placeholderTextColor={t.textMuted}
            style={[
              styles.input,
              { backgroundColor: t.pillBg, color: t.text, borderColor: t.pillBorder },
            ]}
          />

          <TextInput
            value={model}
            onChangeText={setModel}
            placeholder="Model"
            placeholderTextColor={t.textMuted}
            style={[
              styles.input,
              { backgroundColor: t.pillBg, color: t.text, borderColor: t.pillBorder },
            ]}
          />

          <TextInput
            value={year}
            onChangeText={(v) => setYear(digitsOnly(v))}
            placeholder="Year (optional)"
            placeholderTextColor={t.textMuted}
            keyboardType="number-pad"
            style={[
              styles.input,
              { backgroundColor: t.pillBg, color: t.text, borderColor: t.pillBorder },
            ]}
          />

          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={suggestedDisplayName || "Display name"}
            placeholderTextColor={t.textMuted}
            style={[
              styles.input,
              { backgroundColor: t.pillBg, color: t.text, borderColor: t.pillBorder },
            ]}
          />

          <TextInput
            value={odometerKm}
            onChangeText={(v) => setOdometerKm(digitsOnly(v))}
            placeholder="Current odometer km"
            placeholderTextColor={t.textMuted}
            keyboardType="number-pad"
            style={[
              styles.input,
              { backgroundColor: t.pillBg, color: t.text, borderColor: t.pillBorder },
            ]}
          />

          <TextInput
            value={engineHours}
            onChangeText={(v) => setEngineHours(digitsOnly(v))}
            placeholder="Current engine hours (optional)"
            placeholderTextColor={t.textMuted}
            keyboardType="number-pad"
            style={[
              styles.input,
              { backgroundColor: t.pillBg, color: t.text, borderColor: t.pillBorder },
            ]}
          />

          <Text style={[styles.groupLabel, { color: t.textMuted }]}>Final drive</Text>

          <View style={styles.driveRow}>
            {(["chain", "belt", "shaft"] as FinalDriveType[]).map((type) => {
              const selected = finalDriveType === type;

              return (
                <Pressable
                  key={type}
                  onPress={() => setFinalDriveType(type)}
                  style={({ pressed }) => [
                    styles.driveChip,
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
                      textTransform: "capitalize",
                    }}
                  >
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: t.text }]}>{error}</Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.cta}>
        <Pressable
          onPress={saveBike}
          disabled={saving}
          style={({ pressed }) => [
            L2.ctaOuter,
            { opacity: saving ? 0.6 : pressed ? 0.92 : 1 },
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
              {saving ? "Saving..." : "Save bike"}
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

  driveRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },

  driveChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },

  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },

  cta: {
    position: "absolute",
    bottom: 65,
    left: 20,
    right: 20,
  },
});