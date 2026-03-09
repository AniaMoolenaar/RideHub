import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";

import ToolHero from "../../components/ToolHero";
import AppHeader from "../../components/AppHeader";
import { useAppTheme, themeTokens } from "../../theme/theme";
import { getDesign } from "../../theme/design";
import { L2 } from "../../styles/level2";
import { hasPin, savePin, verifyPin } from "./pinStorage";

const PIN_LENGTH = 4;

export default function CrashCardPinScreen() {
  const router = useRouter();
  const { reset } = useLocalSearchParams<{ reset?: string }>();
  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [pinExists, setPinExists] = useState(false);
  const [setupStep, setSetupStep] = useState<"create" | "confirm" | null>(null);
  const [firstPin, setFirstPin] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPinState() {
      try {
        const exists = await hasPin();
        if (!active) return;

        const shouldForceResetFlow = reset === "1";

        if (exists && !shouldForceResetFlow) {
          setPinExists(true);
          setSetupStep(null);
        } else {
          setPinExists(false);
          setSetupStep("create");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPinState();

    return () => {
      active = false;
    };
  }, [reset]);

  const dots = useMemo(
    () =>
      Array.from({ length: PIN_LENGTH }, (_, i) => ({
        key: String(i),
        filled: i < pin.length,
      })),
    [pin]
  );

  const title = useMemo(() => {
    if (loading) return "Crash Card";
    if (pinExists) return "Enter PIN";
    if (setupStep === "confirm") return "Verify PIN";
    return "Enter new PIN";
  }, [loading, pinExists, setupStep]);

  const buttonLabel = useMemo(() => {
    if (pinExists) return "Continue";
    if (setupStep === "confirm") return "Verify PIN";
    return "Set up PIN";
  }, [pinExists, setupStep]);

  const canContinue = pin.length === PIN_LENGTH;

  const onPressDigit = (digit: string) => {
    setPin((current) => {
      if (current.length >= PIN_LENGTH) return current;
      return current + digit;
    });
  };

  const onBackspace = () => {
    setPin((current) => current.slice(0, -1));
  };

  const onContinue = async () => {
    if (!canContinue) return;

    if (pinExists) {
      const ok = await verifyPin(pin);
      if (!ok) {
        Alert.alert("Incorrect PIN", "That PIN does not match this device.");
        setPin("");
        return;
      }

      setPin("");
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
        Alert.alert("PINs do not match", "Please try again.");
        setPin("");
        setFirstPin("");
        setSetupStep("create");
        return;
      }

      await savePin(pin);
      setPin("");
      setFirstPin("");
      setSetupStep(null);
      setPinExists(true);

      Alert.alert("PIN saved", "Crash Card is now protected on this device.");
      return;
    }
  };

  const onForgotPin = () => {
    router.push("/(premium)/crash-card/forgot-pin");
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
            disabled={loading || !canContinue}
            style={({ pressed }) => [
              L2.ctaOuter,
              {
                marginTop: 18,
                opacity: loading || !canContinue ? 0.4 : pressed ? 0.92 : 1,
              },
            ]}
          >
            <LinearGradient
              colors={[...d.goldGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={L2.absoluteFill}
            />
            <View style={L2.ctaInner}>
              <Text style={[L2.ctaText, { color: d.goldTextOn }]}>{buttonLabel}</Text>
            </View>
          </Pressable>

          {pinExists && (
            <Pressable onPress={onForgotPin} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
              <Text style={[styles.secondaryAction, { color: t.textMuted }]}>Forgot PIN</Text>
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
    gap: 12,
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
    height: 60,
  },
  keyText: {
    fontSize: 22,
    fontWeight: "700",
  },
  secondaryAction: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
});