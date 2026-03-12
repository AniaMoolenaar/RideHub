import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAppTheme, themeTokens } from "../../src/theme/theme";
import { getDesign } from "../../src/theme/design";
import { supabase } from "../../src/lib/supabase";

type SupportCategory =
  | "general"
  | "account"
  | "purchase"
  | "bug"
  | "content"
  | "other";

const CATEGORY_OPTIONS: Array<{ key: SupportCategory; label: string }> = [
  { key: "general", label: "General" },
  { key: "account", label: "Account" },
  { key: "purchase", label: "Purchase" },
  { key: "bug", label: "Bug" },
  { key: "content", label: "Content" },
  { key: "other", label: "Other" },
];

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const appVersion =
    Constants.expoConfig?.version ||
    Constants.manifest2?.extra?.expoClient?.version ||
    "Unknown";

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState<SupportCategory>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const subjectTrimmed = subject.trim();
  const messageTrimmed = message.trim();

  const subjectValid = subjectTrimmed.length >= 3 && subjectTrimmed.length <= 120;
  const messageValid = messageTrimmed.length >= 10 && messageTrimmed.length <= 4000;
  const canSubmit = !!userId && subjectValid && messageValid && !submitting;

  const messageCountText = useMemo(() => `${message.length}/4000`, [message.length]);

  const loadUser = useCallback(async () => {
    setLoadingUser(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? "");
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  async function onSubmit() {
    if (!userId) {
      Alert.alert("Sign in required", "You need to be signed in to send a support request.");
      return;
    }

    if (!subjectValid) {
      Alert.alert("Check subject", "Please enter a subject between 3 and 120 characters.");
      return;
    }

    if (!messageValid) {
      Alert.alert("Check message", "Please enter a message between 10 and 4000 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("support_requests").insert({
        user_id: userId,
        user_email: userEmail || null,
        category,
        subject: subjectTrimmed,
        message: messageTrimmed,
        app_version: appVersion,
      });

      if (error) {
        Alert.alert("Could not send request", error.message);
        return;
      }

      setCategory("general");
      setSubject("");
      setMessage("");

      Alert.alert(
        "Support request sent",
        "Your request has been saved and will appear in your support queue."
      );
    } catch (e: any) {
      Alert.alert("Could not send request", e?.message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: t.screenBg }]}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 40,
            paddingHorizontal: 16,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={[
                styles.backBtn,
                { backgroundColor: t.pillBg, borderColor: t.pillBorder },
              ]}
            >
              <ChevronLeft size={20} color={t.text} />
            </Pressable>

            <Text style={[styles.headerTitle, { color: t.text }]}>Support</Text>

            <View style={{ width: 40 }} />
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: t.pillBg,
                borderColor: t.pillBorder,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: t.text }]}>Request support</Text>

            <Text style={[styles.cardText, { color: t.textMuted }]}>
              Send a support request directly from the app. This request will be saved with your
              account and app version.
            </Text>
          </View>

          <View style={styles.sectionWrap}>
            <Text style={[styles.label, { color: t.textMuted }]}>Category</Text>

            <View style={styles.chipsWrap}>
              {CATEGORY_OPTIONS.map((option) => {
                const selected = category === option.key;

                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setCategory(option.key)}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        backgroundColor: selected ? t.text : t.pillBg,
                        borderColor: selected ? t.text : t.pillBorder,
                        opacity: pressed ? 0.92 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: selected ? t.screenBg : t.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <Text style={[styles.label, { color: t.textMuted }]}>Subject</Text>

            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="What do you need help with?"
              placeholderTextColor={t.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: t.pillBg,
                  borderColor: t.pillBorder,
                  color: t.text,
                },
              ]}
              maxLength={120}
            />
          </View>

          <View style={styles.sectionWrap}>
            <View style={styles.messageHeader}>
              <Text style={[styles.label, { color: t.textMuted }]}>Message</Text>
              <Text style={[styles.counter, { color: t.textMuted }]}>{messageCountText}</Text>
            </View>

            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Describe the issue or request in as much detail as you can."
              placeholderTextColor={t.textMuted}
              style={[
                styles.textArea,
                {
                  backgroundColor: t.pillBg,
                  borderColor: t.pillBorder,
                  color: t.text,
                },
              ]}
              multiline
              textAlignVertical="top"
              maxLength={4000}
            />
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: t.pillBg,
                borderColor: t.pillBorder,
              },
            ]}
          >
            {loadingUser ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={t.textMuted} />
              </View>
            ) : userId ? (
              <>
                <Text style={[styles.metaTitle, { color: t.text }]}>Request details</Text>
                <Text style={[styles.metaText, { color: t.textMuted }]}>
                  Signed in as: {userEmail || "Unknown"}
                </Text>
                <Text style={[styles.metaText, { color: t.textMuted }]}>
                  App version: {appVersion}
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.metaTitle, { color: t.text }]}>Sign in required</Text>
                <Text style={[styles.metaText, { color: t.textMuted }]}>
                  You need to be signed in before you can send a support request.
                </Text>
              </>
            )}
          </View>

          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.ctaOuter,
              {
                opacity: !canSubmit ? 0.45 : pressed ? 0.92 : 1,
              },
            ]}
          >
            <LinearGradient
              colors={[...d.goldGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.absoluteFill}
            />
            <View style={styles.ctaInner}>
              <Text style={[styles.ctaText, { color: d.goldTextOn }]}>
                {submitting ? "Sending..." : "Send support request"}
              </Text>
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
  },

  card: {
    borderRadius: 12,
    borderWidth: 0,
    padding: 16,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 6,
  },

  cardText: {
    fontSize: 12,
    lineHeight: 18,
  },

  sectionWrap: {
    marginBottom: 16,
  },

  label: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 10,
    letterSpacing: 0.2,
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  chip: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 0,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  chipText: {
    fontSize: 12,
    fontWeight: "800",
  },

  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 0,
    paddingHorizontal: 14,
    fontSize: 14,
  },

  textArea: {
    minHeight: 180,
    borderRadius: 12,
    borderWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    lineHeight: 20,
  },

  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  counter: {
    fontSize: 11,
    fontWeight: "700",
  },

  metaTitle: {
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 6,
  },

  metaText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },

  loadingRow: {
    minHeight: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  ctaOuter: {
    marginTop: 4,
    height: 46,
    borderRadius: 16,
    overflow: "hidden",
  },

  ctaInner: {
    flex: 1,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  ctaText: {
    fontSize: 13,
    fontWeight: "900",
  },

  absoluteFill: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});