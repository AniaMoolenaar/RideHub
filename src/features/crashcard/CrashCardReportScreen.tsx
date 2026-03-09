import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";

import ToolHero from "../../components/ToolHero";
import AppHeader from "../../components/AppHeader";
import { useAppTheme, themeTokens } from "../../theme/theme";
import { getDesign } from "../../theme/design";
import { L2 } from "../../styles/level2";
import type { CrashPhoto, CrashReportPayload } from "./historyStorage";

type RouteParams = {
  payload?: string;
  reportId?: string;
  createdAt?: string;
};

function pad2(v: number) {
  return String(v).padStart(2, "0");
}

function getNowValues() {
  const d = new Date();

  return {
    date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
  };
}

function makePhotoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parsePayload(raw?: string): CrashReportPayload | null {
  try {
    if (!raw) return null;
    return JSON.parse(raw) as CrashReportPayload;
  } catch {
    return null;
  }
}

export default function CrashCardReportScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<RouteParams>();
  const existing = parsePayload(params.payload);

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const allowLeaveRef = useRef(false);

  const initialNow = getNowValues();

  const [date, setDate] = useState(existing?.date ?? initialNow.date);
  const [time, setTime] = useState(existing?.time ?? initialNow.time);
  const [location, setLocation] = useState(existing?.location ?? "");
  const [weather, setWeather] = useState(existing?.weather ?? "");

  const [yourName, setYourName] = useState(existing?.yourName ?? "");
  const [yourPhone, setYourPhone] = useState(existing?.yourPhone ?? "");
  const [yourEmail, setYourEmail] = useState(existing?.yourEmail ?? "");
  const [yourBike, setYourBike] = useState(existing?.yourBike ?? "");
  const [yourRegistration, setYourRegistration] = useState(existing?.yourRegistration ?? "");

  const [otherName, setOtherName] = useState(existing?.otherName ?? "");
  const [otherPhone, setOtherPhone] = useState(existing?.otherPhone ?? "");
  const [otherVehicle, setOtherVehicle] = useState(existing?.otherVehicle ?? "");
  const [otherRegistration, setOtherRegistration] = useState(existing?.otherRegistration ?? "");
  const [otherInsurance, setOtherInsurance] = useState(existing?.otherInsurance ?? "");

  const [witnessName, setWitnessName] = useState(existing?.witnessName ?? "");
  const [witnessPhone, setWitnessPhone] = useState(existing?.witnessPhone ?? "");
  const [witnessNotes, setWitnessNotes] = useState(existing?.witnessNotes ?? "");

  const [whatHappened, setWhatHappened] = useState(existing?.whatHappened ?? "");
  const [damageNotes, setDamageNotes] = useState(existing?.damageNotes ?? "");
  const [injuryNotes, setInjuryNotes] = useState(existing?.injuryNotes ?? "");

  const [photos, setPhotos] = useState<CrashPhoto[]>(existing?.photos ?? []);
  const [photoBusy, setPhotoBusy] = useState(false);

  const isDirty = useMemo(() => {
    return !!(
      location.trim() ||
      weather.trim() ||
      yourName.trim() ||
      yourPhone.trim() ||
      yourEmail.trim() ||
      yourBike.trim() ||
      yourRegistration.trim() ||
      otherName.trim() ||
      otherPhone.trim() ||
      otherVehicle.trim() ||
      otherRegistration.trim() ||
      otherInsurance.trim() ||
      witnessName.trim() ||
      witnessPhone.trim() ||
      witnessNotes.trim() ||
      whatHappened.trim() ||
      damageNotes.trim() ||
      injuryNotes.trim() ||
      photos.length > 0
    );
  }, [
    location,
    weather,
    yourName,
    yourPhone,
    yourEmail,
    yourBike,
    yourRegistration,
    otherName,
    otherPhone,
    otherVehicle,
    otherRegistration,
    otherInsurance,
    witnessName,
    witnessPhone,
    witnessNotes,
    whatHappened,
    damageNotes,
    injuryNotes,
    photos,
  ]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (allowLeaveRef.current) {
        return;
      }

      if (!isDirty) {
        return;
      }

      e.preventDefault();

      Alert.alert(
        "Discard report?",
        "You have started a crash report. If you leave now, your unsaved changes will be lost.",
        [
          { text: "Stay", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, isDirty]);

  const payload = useMemo(
    () => ({
      date,
      time,
      location,
      weather,
      yourName,
      yourPhone,
      yourEmail,
      yourBike,
      yourRegistration,
      otherName,
      otherPhone,
      otherVehicle,
      otherRegistration,
      otherInsurance,
      witnessName,
      witnessPhone,
      witnessNotes,
      whatHappened,
      damageNotes,
      injuryNotes,
      photos,
    }),
    [
      date,
      time,
      location,
      weather,
      yourName,
      yourPhone,
      yourEmail,
      yourBike,
      yourRegistration,
      otherName,
      otherPhone,
      otherVehicle,
      otherRegistration,
      otherInsurance,
      witnessName,
      witnessPhone,
      witnessNotes,
      whatHappened,
      damageNotes,
      injuryNotes,
      photos,
    ]
  );

  const clearReport = () => {
    const nowValues = getNowValues();

    setDate(nowValues.date);
    setTime(nowValues.time);
    setLocation("");
    setWeather("");

    setYourName("");
    setYourPhone("");
    setYourEmail("");
    setYourBike("");
    setYourRegistration("");

    setOtherName("");
    setOtherPhone("");
    setOtherVehicle("");
    setOtherRegistration("");
    setOtherInsurance("");

    setWitnessName("");
    setWitnessPhone("");
    setWitnessNotes("");

    setWhatHappened("");
    setDamageNotes("");
    setInjuryNotes("");

    setPhotos([]);
  };

  const addPhotoToState = (uri: string, source: "camera" | "library") => {
    setPhotos((current) => [
      ...current,
      {
        id: makePhotoId(),
        uri,
        source,
      },
    ]);
  };

  const removePhoto = (id: string) => {
    setPhotos((current) => current.filter((photo) => photo.id !== id));
  };

  const onTakePhoto = async () => {
    setPhotoBusy(true);

    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert("Camera permission needed", "Allow camera access to take crash photos.");
        return;
      }

      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      if (!mediaPermission.granted) {
        Alert.alert(
          "Gallery permission needed",
          "Allow photo library access so camera photos can be saved to your gallery as a backup."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      await MediaLibrary.saveToLibraryAsync(asset.uri);
      addPhotoToState(asset.uri, "camera");
    } finally {
      setPhotoBusy(false);
    }
  };

  const onAddFromGallery = async () => {
    setPhotoBusy(true);

    try {
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libraryPermission.granted) {
        Alert.alert("Gallery permission needed", "Allow photo library access to attach photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.9,
        selectionLimit: 0,
      });

      if (result.canceled || !result.assets?.length) return;

      result.assets.forEach((asset) => {
        addPhotoToState(asset.uri, "library");
      });
    } finally {
      setPhotoBusy(false);
    }
  };

  const generate = () => {
    allowLeaveRef.current = true;

    router.push({
      pathname: "/(premium)/crash-card/summary",
      params: {
        payload: JSON.stringify(payload),
        reportId: params.reportId ?? "",
        createdAt: params.createdAt ?? "",
      },
    });
  };

  return (
    <ScrollView
      style={{ backgroundColor: t.screenBg }}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ToolHero
        screen="Crash-Card"
        title="Crash report"
        subtitle="Record details in one place"
      />

      <AppHeader title="Crash Card" />

      <View style={styles.body}>
        <Section title="Crash details" t={t}>
          <Field value={date} onChange={setDate} placeholder="Date" t={t} />
          <Field value={time} onChange={setTime} placeholder="Time" t={t} />
          <Field value={location} onChange={setLocation} placeholder="Location" t={t} />
          <Field value={weather} onChange={setWeather} placeholder="Weather / conditions" t={t} />
        </Section>

        <Section title="Your details" t={t}>
          <Field value={yourName} onChange={setYourName} placeholder="Your name" t={t} />
          <Field value={yourPhone} onChange={setYourPhone} placeholder="Your phone" t={t} />
          <Field value={yourEmail} onChange={setYourEmail} placeholder="Your email" t={t} />
          <Field value={yourBike} onChange={setYourBike} placeholder="Bike" t={t} />
          <Field
            value={yourRegistration}
            onChange={setYourRegistration}
            placeholder="Bike registration"
            t={t}
          />
        </Section>

        <Section title="Other party" t={t}>
          <Field value={otherName} onChange={setOtherName} placeholder="Name" t={t} />
          <Field value={otherPhone} onChange={setOtherPhone} placeholder="Phone" t={t} />
          <Field value={otherVehicle} onChange={setOtherVehicle} placeholder="Vehicle" t={t} />
          <Field
            value={otherRegistration}
            onChange={setOtherRegistration}
            placeholder="Vehicle registration"
            t={t}
          />
          <Field
            value={otherInsurance}
            onChange={setOtherInsurance}
            placeholder="Insurance"
            t={t}
          />
        </Section>

        <Section title="Witness" t={t}>
          <Field value={witnessName} onChange={setWitnessName} placeholder="Witness name" t={t} />
          <Field value={witnessPhone} onChange={setWitnessPhone} placeholder="Witness phone" t={t} />
          <Field
            value={witnessNotes}
            onChange={setWitnessNotes}
            placeholder="Witness notes"
            multiline
            t={t}
          />
        </Section>

        <Section title="Incident notes" t={t}>
          <Field
            value={whatHappened}
            onChange={setWhatHappened}
            placeholder="What happened"
            multiline
            t={t}
          />
          <Field
            value={damageNotes}
            onChange={setDamageNotes}
            placeholder="Damage notes"
            multiline
            t={t}
          />
          <Field
            value={injuryNotes}
            onChange={setInjuryNotes}
            placeholder="Injury notes"
            multiline
            t={t}
          />
        </Section>

        <Section title="Photos" t={t}>
          <View style={styles.photoActions}>
            <Pressable
              onPress={onTakePhoto}
              disabled={photoBusy}
              style={({ pressed }) => [
                styles.photoButton,
                {
                  backgroundColor: t.pillBg,
                  borderColor: t.pillBorder,
                  opacity: photoBusy ? 0.5 : pressed ? 0.92 : 1,
                },
              ]}
            >
              <Text style={[styles.photoButtonText, { color: t.text }]}>
                {photoBusy ? "Working…" : "Take photo"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onAddFromGallery}
              disabled={photoBusy}
              style={({ pressed }) => [
                styles.photoButton,
                {
                  backgroundColor: t.pillBg,
                  borderColor: t.pillBorder,
                  opacity: photoBusy ? 0.5 : pressed ? 0.92 : 1,
                },
              ]}
            >
              <Text style={[styles.photoButtonText, { color: t.text }]}>Add photo</Text>
            </Pressable>
          </View>

          {photos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoStrip}
            >
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoCard}>
                  <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                  <Pressable
                    onPress={() => removePhoto(photo.id)}
                    style={({ pressed }) => [
                      styles.removePhotoButton,
                      {
                        backgroundColor: t.pillBg,
                        borderColor: t.pillBorder,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.removePhotoText, { color: t.textMuted }]}>Remove</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.photoHint, { color: t.textMuted }]}>
              Camera photos will also be saved to your gallery as a backup.
            </Text>
          )}
        </Section>

        <Pressable
          onPress={() =>
            Alert.alert("Clear report?", "This will remove everything you entered.", [
              { text: "Cancel", style: "cancel" },
              { text: "Clear", style: "destructive", onPress: clearReport },
            ])
          }
          style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={[styles.clearText, { color: t.textMuted }]}>Clear report</Text>
        </Pressable>

        <Pressable
          onPress={generate}
          style={({ pressed }) => [L2.ctaOuter, { opacity: pressed ? 0.92 : 1 }]}
        >
          <LinearGradient
            colors={[...d.goldGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={L2.absoluteFill}
          />
          <View style={L2.ctaInner}>
            <Text style={[L2.ctaText, { color: d.goldTextOn }]}>Generate report</Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Section({
  title,
  children,
  t,
}: {
  title: string;
  children: React.ReactNode;
  t: ReturnType<typeof themeTokens>;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: t.text }]}>{title}</Text>
      <View style={styles.fields}>{children}</View>
    </View>
  );
}

function Field({
  value,
  onChange,
  placeholder,
  multiline = false,
  t,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
  t: ReturnType<typeof themeTokens>;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={t.textMuted}
      multiline={multiline}
      textAlignVertical={multiline ? "top" : "center"}
      style={[
        styles.input,
        multiline && styles.inputMulti,
        {
          color: t.text,
          backgroundColor: t.pillBg,
          borderColor: t.pillBorder,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 22,
    paddingTop: 18,
    gap: 22,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  fields: {
    gap: 10,
  },
  input: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  inputMulti: {
    minHeight: 110,
    paddingTop: 14,
    paddingBottom: 14,
  },
  photoActions: {
    flexDirection: "row",
    gap: 10,
  },
  photoButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  photoButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  photoHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  photoStrip: {
    gap: 12,
    paddingTop: 2,
  },
  photoCard: {
    width: 120,
    gap: 8,
  },
  photoThumb: {
    width: 120,
    height: 120,
    borderRadius: 14,
  },
  removePhotoButton: {
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  removePhotoText: {
    fontSize: 12,
    fontWeight: "600",
  },
  clearText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});