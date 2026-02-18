import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

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

export default function AddServiceScreen() {
  const router = useRouter();
  const { bikeId, mode, serviceId } = useLocalSearchParams<{
    bikeId: string;
    mode: "create" | "edit";
    serviceId?: string;
  }>();

  const isEdit = mode === "edit";

  const [name, setName] = useState("");
  const [intervalType, setIntervalType] = useState<"distance" | "time">("distance");
  const [intervalValue, setIntervalValue] = useState("");
  const [reminderThreshold, setReminderThreshold] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [booked, setBooked] = useState(false);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    if (!bikeId || !serviceId) return;

    (async () => {
      setError(null);
      try {
        setLoading(true);
        const details = await fetchBikeDetails(bikeId);
        const svc = details.services.find((s) => s.id === serviceId) as ServiceRow | undefined;
        if (!svc) throw new Error("Service not found.");

        setName(svc.name ?? "");
        setIntervalType((svc.interval_type as any) ?? "distance");
        setIntervalValue(svc.interval_value != null ? String(svc.interval_value) : "");
        setReminderThreshold(svc.reminder_threshold != null ? String(svc.reminder_threshold) : "");
        setEstimatedCost(svc.estimated_cost != null ? String(svc.estimated_cost) : "");
        setBooked(!!svc.booked);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load service.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, bikeId, serviceId]);

  const filteredSuggestions = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (!q) return SUGGESTIONS.slice(0, 6);
    return SUGGESTIONS.filter((s) => s.toLowerCase().includes(q)).slice(0, 6);
  }, [name]);

  async function onSave() {
    setError(null);
    if (!bikeId) return setError("Missing bike id.");
    if (!name.trim()) return setError("Service name is required.");

    const iv = Number(intervalValue);
    const rt = Number(reminderThreshold);
    const cost = estimatedCost.trim() ? Number(estimatedCost) : null;

    if (!intervalValue.trim() || Number.isNaN(iv)) return setError("Interval value must be a number.");
    if (!reminderThreshold.trim() || Number.isNaN(rt)) return setError("Reminder threshold must be a number.");
    if (cost !== null && Number.isNaN(cost)) return setError("Estimated cost must be a number.");

    setSaving(true);
    try {
      await upsertService({
        bike_id: bikeId,
        service_id: isEdit ? serviceId : undefined,
        name: name.trim(),
        interval_type: intervalType,
        interval_value: iv,
        reminder_threshold: rt,
        estimated_cost: cost,
        booked,
      });

      router.replace({
        pathname: `/(premium)/maintenance/bike/${bikeId}`,
        params: { refreshToken: String(Date.now()) },
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to save service.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ opacity: 0.7 }}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: "800" }}>
          {isEdit ? "Edit service" : "Add service"}
        </Text>

        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: "700" }}>Service name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Oil & filter"
            style={{
              padding: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#e6e6e6",
              backgroundColor: "#fff",
            }}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {filteredSuggestions.map((s) => (
              <Pressable key={s} onPress={() => setName(s)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: "#e6e6e6" }}>
                <Text style={{ fontWeight: "700", opacity: 0.85 }}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={{ fontWeight: "700" }}>Interval type</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Chip selected={intervalType === "distance"} onPress={() => setIntervalType("distance")} label="Distance" />
          <Chip selected={intervalType === "time"} onPress={() => setIntervalType("time")} label="Time" />
        </View>

        <Field label="Interval value" value={intervalValue} onChangeText={setIntervalValue} keyboardType="number-pad" />
        <Field label="Reminder threshold" value={reminderThreshold} onChangeText={setReminderThreshold} keyboardType="number-pad" />
        <Field label="Estimated cost (optional)" value={estimatedCost} onChangeText={setEstimatedCost} keyboardType="number-pad" />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ fontWeight: "800" }}>Booked</Text>
          <Pressable onPress={() => setBooked((b) => !b)}>
            <Text style={{ fontWeight: "800" }}>{booked ? "Yes" : "No"}</Text>
          </Pressable>
        </View>

        {error ? <Text style={{ opacity: 0.9 }}>{error}</Text> : null}
      </ScrollView>

      <View style={{ padding: 16 }}>
        <Pressable
          onPress={onSave}
          disabled={saving}
          style={{ padding: 14, borderRadius: 16, backgroundColor: "#111", alignItems: "center" }}
        >
          <Text style={{ color: "white", fontWeight: "800" }}>
            {saving ? "Saving…" : "Save"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Field(props: any) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "700" }}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType={props.keyboardType}
        style={{
          padding: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#e6e6e6",
          backgroundColor: "#fff",
        }}
      />
    </View>
  );
}

function Chip({ selected, onPress, label }: { selected: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: selected ? "#111" : "#e6e6e6",
        backgroundColor: selected ? "#111" : "#fff",
      }}
    >
      <Text style={{ color: selected ? "#fff" : "#111", fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}
