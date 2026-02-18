import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";

import { addBike } from "../../../src/features/maintenance/api";

export default function AddBikeScreen() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [unit, setUnit] = useState<"km" | "miles">("km");
  const [odometer, setOdometer] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    setError(null);

    const odo = Number(odometer);
    const yr = year.trim() ? Number(year) : null;

    if (!displayName.trim()) return setError("Display name is required.");
    if (!odometer.trim() || Number.isNaN(odo)) return setError("Odometer must be a number.");
    if (yr !== null && Number.isNaN(yr)) return setError("Year must be a number.");

    setSaving(true);
    try {
      await addBike({
        display_name: displayName.trim(),
        make: make.trim() || null,
        model: model.trim() || null,
        year: yr,
        unit,
        current_odometer: odo,
      });

      router.replace({
        pathname: "/(premium)/maintenance",
        params: { refreshToken: String(Date.now()) },
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to save bike.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Field label="Display name" value={displayName} onChangeText={setDisplayName} />
        <Field label="Make" value={make} onChangeText={setMake} />
        <Field label="Model" value={model} onChangeText={setModel} />
        <Field label="Year" value={year} onChangeText={setYear} keyboardType="number-pad" />

        <Text style={{ fontWeight: "600", marginTop: 4 }}>Unit</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Chip selected={unit === "km"} onPress={() => setUnit("km")} label="km" />
          <Chip selected={unit === "miles"} onPress={() => setUnit("miles")} label="miles" />
        </View>

        <Field
          label="Current odometer"
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="number-pad"
        />

        {error ? (
          <Text style={{ color: "#333", opacity: 0.9 }}>{error}</Text>
        ) : null}
      </ScrollView>

      <View style={{ padding: 16, gap: 10 }}>
        <Pressable
          onPress={onSave}
          disabled={saving}
          style={{
            padding: 14,
            borderRadius: 16,
            backgroundColor: saving ? "#333" : "#111",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
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
      <Text style={{ fontWeight: "600" }}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType={props.keyboardType}
        placeholder={props.placeholder}
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
      <Text style={{ color: selected ? "#fff" : "#111", fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}
