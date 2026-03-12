import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, CheckCircle2, Circle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme, themeTokens } from "../../src/theme/theme";
import { supabase } from "../../src/lib/supabase";

type OwnershipState = {
  is_premium: boolean;
  has_ride: boolean;
  has_maintain: boolean;
  has_learn: boolean;
};

type OwnershipRowProps = {
  label: string;
  owned: boolean;
  t: ReturnType<typeof themeTokens>;
};

function OwnershipRow({ label, owned, t }: OwnershipRowProps) {
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: t.pillBg,
          borderColor: t.pillBorder,
        },
      ]}
    >
      <View style={styles.rowLeft}>
        {owned ? (
          <CheckCircle2 size={18} color={t.text} />
        ) : (
          <Circle size={18} color={t.textMuted} />
        )}

        <Text style={[styles.rowTitle, { color: t.text }]}>{label}</Text>
      </View>

      <Text style={[styles.rowStatus, { color: owned ? t.text : t.textMuted }]}>
        {owned ? "Owned" : "Not owned"}
      </Text>
    </View>
  );
}

export default function PurchasedContentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownership, setOwnership] = useState<OwnershipState>({
    is_premium: false,
    has_ride: false,
    has_maintain: false,
    has_learn: false,
  });

  const loadOwnership = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setOwnership({
          is_premium: false,
          has_ride: false,
          has_maintain: false,
          has_learn: false,
        });
        setError("You need to be signed in to view purchases.");
        setLoading(false);
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("is_premium, has_ride, has_maintain, has_learn")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setOwnership({
          is_premium: false,
          has_ride: false,
          has_maintain: false,
          has_learn: false,
        });
        setError(profileError.message);
        setLoading(false);
        return;
      }

      setOwnership({
        is_premium: !!data?.is_premium,
        has_ride: !!data?.has_ride,
        has_maintain: !!data?.has_maintain,
        has_learn: !!data?.has_learn,
      });

      setLoading(false);
    } catch (e: any) {
      setOwnership({
        is_premium: false,
        has_ride: false,
        has_maintain: false,
        has_learn: false,
      });
      setError(e?.message ?? "Failed to load purchased content.");
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOwnership();
    }, [loadOwnership])
  );

  const hasAnything =
    ownership.is_premium ||
    ownership.has_ride ||
    ownership.has_maintain ||
    ownership.has_learn;

  return (
    <View style={[styles.root, { backgroundColor: t.screenBg }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              { backgroundColor: t.pillBg, borderColor: t.pillBorder },
            ]}
          >
            <ChevronLeft size={20} color={t.text} />
          </Pressable>

          <Text style={[styles.title, { color: t.text }]}>Purchased Content</Text>

          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: t.pillBg,
                borderColor: t.pillBorder,
                alignItems: "center",
              },
            ]}
          >
            <ActivityIndicator color={t.textMuted} />
          </View>
        ) : error ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: t.pillBg,
                borderColor: t.pillBorder,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: t.text }]}>Could not load purchases</Text>
            <Text style={[styles.cardText, { color: t.textMuted }]}>{error}</Text>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: t.pillBg,
                  borderColor: t.pillBorder,
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: t.text }]}>
                {hasAnything ? "Your access" : "No purchases yet"}
              </Text>

              <Text style={[styles.cardText, { color: t.textMuted }]}>
                {hasAnything
                  ? "This screen shows what is currently unlocked on your account."
                  : "You do not currently own any packs or full premium access."}
              </Text>
            </View>

            <View style={styles.listWrap}>
              <OwnershipRow label="Full Premium" owned={ownership.is_premium} t={t} />
              <OwnershipRow label="Ride Pack" owned={ownership.is_premium || ownership.has_ride} t={t} />
              <OwnershipRow
                label="Maintain Pack"
                owned={ownership.is_premium || ownership.has_maintain}
                t={t}
              />
              <OwnershipRow label="Learn Pack" owned={ownership.is_premium || ownership.has_learn} t={t} />
            </View>
          </>
        )}
      </ScrollView>
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
    marginBottom: 24,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: "900",
  },

  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
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

  listWrap: {
    marginTop: 14,
    gap: 10,
  },

  row: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  rowTitle: {
    fontSize: 13,
    fontWeight: "800",
  },

  rowStatus: {
    fontSize: 12,
    fontWeight: "700",
  },
});