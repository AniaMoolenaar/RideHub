import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import ToolHero from "../../../src/components/ToolHero";
import AppHeader from "../../../src/components/AppHeader";
import { useAppTheme, themeTokens } from "../../../src/theme/theme";
import { getDesign } from "../../../src/theme/design";
import { L1 } from "../../../src/styles/level1";
import { L2 } from "../../../src/styles/level2";

import { fetchBikePills } from "../../../src/features/maintenance/api";
import type { BikePillRow } from "../../../src/features/maintenance/types";

export default function MaintenanceHome() {
  const router = useRouter();
  const params = useLocalSearchParams<{ refreshToken?: string }>();

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const [rows, setRows] = useState<BikePillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastFetchAtRef = useRef<number>(0);
  const lastRefreshTokenRef = useRef<string | undefined>(undefined);

  const load = useCallback(async () => {
    setError(null);
    const data = await fetchBikePills();
    setRows(data);
    lastFetchAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch (e: any) {
        setError(e?.message ?? "Failed to load bikes.");
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      const token = params.refreshToken;
      const stale = Date.now() - lastFetchAtRef.current > 60_000;

      const tokenChanged = token && token !== lastRefreshTokenRef.current;
      if (tokenChanged) lastRefreshTokenRef.current = token;

      if (tokenChanged || stale) {
        load().catch(() => {});
      }
    }, [params.refreshToken, load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Failed to refresh.");
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const showEmptyPrompt = !loading && rows.length === 0 && !error;

  return (
    <View style={[L1.screen, { backgroundColor: t.screenBg }]}>
      <ScrollView
        style={{ backgroundColor: t.screenBg }}
        contentContainerStyle={[
          L1.scrollContent24,
          { backgroundColor: t.screenBg, paddingBottom: 160 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ToolHero
          screen="Maintenance-tool"
          title="Maintenance Tool"
          subtitle="Services, reminders, and ownership history"
        />

        <AppHeader title="My bikes" />

        <View style={styles.contentWrap}>
          {showEmptyPrompt ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: t.textMuted }]}>
                Add your first bike to begin.
              </Text>
            </View>
          ) : null}

          {error ? (
            <View
              style={[
                styles.errorCard,
                { backgroundColor: t.pillBg, borderColor: t.pillBorder },
              ]}
            >
              <Text style={[styles.errorText, { color: t.textMuted }]}>{error}</Text>

              <Pressable
                onPress={onRefresh}
                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
              >
                <Text style={[styles.retryText, { color: t.text }]}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          <FlatList
            data={rows}
            keyExtractor={(item) => item.bike_id}
            scrollEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={t.textMuted}
              />
            }
            ListEmptyComponent={
              loading ? (
                <Text style={[styles.loadingText, { color: t.textMuted }]}>
                  Loading…
                </Text>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/(premium)/maintenance/bike/${item.bike_id}`)}
                style={({ pressed }) => [
                  styles.bikeCard,
                  {
                    backgroundColor: t.pillBg,
                    borderColor: t.pillBorder,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <View style={styles.bikeTopRow}>
                  <Text style={[styles.bikeName, { color: t.text }]}>
                    {item.display_name}
                  </Text>
                  <Text style={[styles.bikeOdo, { color: t.textMuted }]}>
                    {item.odometer_display}
                  </Text>
                </View>

                <Text style={[styles.counts, { color: t.textMuted }]}>
                  Due now: {item.due_now_count} · Coming up: {item.coming_up_count}
                </Text>

                {item.most_urgent_service_line ? (
                  <Text style={[styles.urgentLine, { color: t.text }]}>
                    {item.most_urgent_service_line}
                  </Text>
                ) : (
                  <Text style={[styles.noneLine, { color: t.textMuted }]}>
                    No services yet
                  </Text>
                )}
              </Pressable>
            )}
          />
        </View>
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View style={styles.fixedCtaWrap}>
        <Pressable
          onPress={() => router.push("/(premium)/maintenance/add-bike")}
          style={({ pressed }) => [L2.ctaOuter, { opacity: pressed ? 0.92 : 1 }]}
        >
          <LinearGradient
            colors={[...d.goldGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={L2.absoluteFill}
          />
          <View style={L2.ctaInner}>
            <Text style={[L2.ctaText, { color: d.goldTextOn }]}>Add Bike</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 14,
  },

  emptyWrap: {
    alignItems: "center",
    marginBottom: 18,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 420,
  },

  errorCard: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "800",
  },

  loadingText: {
    fontSize: 12,
    lineHeight: 16,
    paddingVertical: 10,
  },

  bikeCard: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    marginBottom: 12,
  },
  bikeTopRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  bikeName: {
    fontSize: 15,
    fontWeight: "800",
    flex: 1,
  },
  bikeOdo: {
    fontSize: 12,
    fontWeight: "700",
  },

  counts: {
    fontSize: 12,
    lineHeight: 16,
  },
  urgentLine: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  noneLine: {
    fontSize: 12,
    lineHeight: 16,
  },

  fixedCtaWrap: {
    position: "absolute",
    bottom: 65,
    left: 20,
    right: 20,
  },
});
