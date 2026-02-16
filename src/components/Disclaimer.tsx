import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";

import { useAppTheme, themeTokens } from "../theme/theme";

type DisclaimerRow = {
  key: string;
  title: string;
  body: string;
  body_dark: string | null;
  body_light: string | null;
  is_active: boolean;
};

const DISCLAIMER_KEY = "global_app";

export default function Disclaimer() {
  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);

  const [row, setRow] = useState<DisclaimerRow | null>(null);
  const [loading, setLoading] = useState(true);

  // hard fallback (shown only if fetch fails or no row found)
  const fallback = useMemo(
    () => ({
      title: "Important Notice",
      body:
        "RideHub provides general information and educational content only.\n\n" +
        "It does not constitute professional, mechanical, legal, safety, or medical advice.\n\n" +
        "Use of this app and reliance on any content is at your own risk. Riding and maintenance involve inherent danger.\n\n" +
        "Always seek guidance from qualified professionals before acting on any information.\n\n" +
        "To the maximum extent permitted by law, RideHub and its creators disclaim liability for loss, damage, injury, or claims arising from use of the app or its content.",
    }),
    []
  );

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("disclaimers")
        .select("key, title, body, body_dark, body_light, is_active")
        .eq("key", DISCLAIMER_KEY)
        .eq("is_active", true)
        .maybeSingle();

      if (!alive) return;

      if (!error && data) setRow(data as DisclaimerRow);
      else setRow(null);

      setLoading(false);
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const title = row?.title ?? fallback.title;

  const bodyText = (isDark ? row?.body_dark : row?.body_light) || row?.body || fallback.body;

  const paragraphs = bodyText
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: t.pillBg,
            borderColor: t.pillBorder,
          },
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: t.text }]}>{title}</Text>
          {loading ? <ActivityIndicator size="small" color={t.textMuted} /> : null}
        </View>

        <View style={styles.textGroup}>
          {paragraphs.map((p, i) => (
            <Text key={i} style={[styles.text, { color: t.textMuted }]}>
              {p}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 36,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
  },
  textGroup: {
    gap: 10,
  },
  text: {
    fontSize: 11,
    lineHeight: 16,
  },
});
