import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";

import ToolHero from "../../components/ToolHero";
import AppHeader from "../../components/AppHeader";
import { useAppTheme, themeTokens } from "../../theme/theme";
import { hasPin, savePin, verifyPin } from "./pinStorage";

const MAX_PIN_LENGTH = 6;

export default function CrashCardPinScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [pinExists, setPinExists] = useState(false);
  const [setupStep, setSetupStep] = useState<"idle" | "create" | "confirm">("idle");
  const [firstPin, setFirstPin] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPinState() {
      try {
        const exists = await hasPin();
        if (!active) return;
        setPinExists(exists);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPinState();

    return () => {
      active = false;
    };
  }, []);

  const dots = useMemo(
    () =>
      Array.from({ length: MAX_PIN_LENGTH }, (_, i) => ({
        key: String(i),
        filled: i < pin.length,
      })),
    [pin]
  );

  const title = useMemo(() => {
    if (loading) return "Crash Card";
    if (pinExists) return "Enter PIN";
    if (setupStep === "create") return "Create PIN";
    if (setupStep === "confirm") return "Confirm PIN";
    return "Crash Card";
  }, [loading, pinExists, setupStep]);

  const secondaryLabel = useMemo(() => {
    if (loading) return "";
    if (pinExists) return "";
    if (setupStep === "idle") return "Set up PIN";
    return "";
  }, [loading, pinExists, setupStep]);

  const onPressDigit = (digit: string) => {
    setPin((current) => {
      if (current.length >= MAX_PIN_LENGTH) return current;
      return current + digit;
    });
  };

  const onBackspace = () => {
    setPin((current) => current.slice(0, -1));
  };

  const resetEntry = () => {
    setPin("");
  };

  const onContinue = async () => {
    if (pin.length < 4) return;

    if (pinExists) {
      const ok = await verifyPin(pin);
      if (!ok) {
        Alert.alert("Incorrect PIN", "That PIN does not match this device.");
        resetEntry();
        return;
      }

      resetEntry();
      router.push("/(premium)/crash-card/home");
      return;
    }

    if (setupStep === "create") {
      setFirstPin(pin);
      setPin("");
      setSetupStep("confirm");
      return;
    }

    if (setupStep === "confirm") {
      if (pin !== firstPin) {
        Alert.alert("PINs do not match", "Please start again.");
        setPin("");
        setFirstPin("");
        setSetupStep("create");
        return;
      }

      await savePin(pin);
      setPinExists(true);
      setSetupStep("idle");
      setFirstPin("");
      setPin("");
      Alert.alert("PIN saved", "Crash Card is now protected on this device.");
      return;
    }
  };

  const onSetupPin = () => {
    setPin("");
    setFirstPin("");
    setSetupStep("create");
  };

  return (
    <ScrollView
      style={{ backgroundColor: t.screenBg }}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      <ToolHero
        screen="Crash-Card"
        title="Crash Card"
        subtitle="Private accident record tool"
      />

      <AppHeader title="Crash Card" />

      <View style={styles.body}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: t.text }]}>{title}</Text>

          <View style={styles.dotsRow}>
            {dots.map((dot) => (
              <View
                key={dot.key}
                style={[
                  styles.dot,
                  {
                    backgroundColor: dot.filled ? t.text : "transparent",
                    borderColor: t.pillBorder,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.keypad}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <Pressable
                key={digit}
                onPress={() => onPressDigit(digit)}
                disabled={loading}
                style={({ pressed }) => [
                  styles.key,
                  {
                    backgroundColor: t.pillBg,
                    borderColor: t.pillBorder,
                    opacity: loading ? 0.5 : pressed ? 0.9 : 1,
                  },
                ]}
              >
                <Text style={[styles.keyText, { color: t.text }]}>{digit}</Text>
              </Pressable>
            ))}

            <View style={styles.keyPlaceholder} />

            <Pressable
              onPress={() => onPressDigit("0")}
              disabled={loading}
              style={({ pressed }) => [
                styles.key,
                {
                  backgroundColor: t.pillBg,
                  borderColor: t.pillBorder,
                  opacity: loading ? 0.5 : pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={[styles.keyText, { color: t.text }]}>0</Text>
            </Pressable>

            <Pressable
              onPress={onBackspace}
              disabled={loading}
              style={({ pressed }) => [
                styles.key,
                {
                  backgroundColor: t.pillBg,
                  borderColor: t.pillBorder,
                  opacity: loading ? 0.5 : pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={[styles.keyText, { color: t.text }]}>⌫</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onContinue}
            disabled={loading || pin.length < 4 || (!pinExists && setupStep === "idle")}
            style={({ pressed }) => [
              styles.continueButton,
              {
                opacity:
                  loading || pin.length < 4 || (!pinExists && setupStep === "idle")
                    ? 0.45
                    : pressed
                    ? 0.9
                    : 1,
              },
            ]}
          >
            <Text style={[styles.continueText, { color: t.text }]}>
              {pinExists ? "Continue" : setupStep === "confirm" ? "Save PIN" : "Continue"}
            </Text>
          </Pressable>

          {!!secondaryLabel && (
            <Pressable onPress={onSetupPin}>
              <Text style={[styles.secondaryAction, { color: t.textMuted }]}>
                {secondaryLabel}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 16,
    paddingTop: 20,
    alignItems: "center",
  },
  content: {
    width: "85%",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
    marginBottom: 22,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  key: {
    width: "32%",
    height: 60,
    borderRadius: 16,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  keyPlaceholder: {
    width: "32%",
    height: 50,
  },
  keyText: {
    fontSize: 22,
    fontWeight: "700",
  },
  continueButton: {
    marginTop: 16,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryAction: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
});