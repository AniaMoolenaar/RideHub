import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import ToolHero from "../../components/ToolHero";
import AppHeader from "../../components/AppHeader";
import { useAppTheme, themeTokens } from "../../theme/theme";
import { getDesign } from "../../theme/design";
import { L2 } from "../../styles/level2";
import { supabase } from "../../lib/supabase";
import { clearPin } from "./pinStorage";

export default function CrashCardForgotPinScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!active) return;

        if (error) {
          Alert.alert("Error", error.message);
          return;
        }

        setEmail(data.user?.email ?? "");
      } finally {
        if (active) setLoadingEmail(false);
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  const onResetPin = async () => {
    if (!email) {
      Alert.alert("No account email", "We could not find your signed-in email address.");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Password required", "Enter your RideHub password to reset your PIN.");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert("Verification failed", "That password was not accepted.");
        return;
      }

      await clearPin();

      Alert.alert("PIN reset", "Your Crash Card PIN has been cleared.", [
        {
          text: "OK",
          onPress: () => router.replace("/(premium)/crash-card?reset=1"),
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.screenBg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ backgroundColor: t.screenBg }}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ToolHero
          screen="Crash-Card"
          title="Forgot PIN"
          subtitle="Verify your RideHub account to reset your Crash Card PIN"
        />

        <AppHeader title="Crash Card" />

        <View style={styles.body}>
          <Text style={[styles.text, { color: t.text }]}>
            Resetting your PIN will keep your Crash Card data on this device, but you will need to
            create a new 4-digit PIN before using Crash Card again.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: t.text }]}>Account email</Text>
            <View
              style={[
                styles.field,
                {
                  backgroundColor: t.pillBg,
                  borderColor: t.pillBorder,
                },
              ]}
            >
              <Text style={[styles.fieldValue, { color: t.textMuted }]}>
                {loadingEmail ? "Loading…" : email || "No email found"}
              </Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: t.text }]}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={t.textMuted}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.input,
                {
                  color: t.text,
                  backgroundColor: t.pillBg,
                  borderColor: t.pillBorder,
                },
              ]}
            />
          </View>

          <Pressable
            onPress={onResetPin}
            disabled={submitting || loadingEmail}
            style={({ pressed }) => [
              L2.ctaOuter,
              {
                marginTop: 12,
                opacity: submitting || loadingEmail ? 0.4 : pressed ? 0.92 : 1,
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
              <Text style={[L2.ctaText, { color: d.goldTextOn }]}>
                {submitting ? "Verifying…" : "Verify and reset PIN"}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 22,
    paddingTop: 20,
    gap: 18,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
  field: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  fieldValue: {
    fontSize: 14,
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
});