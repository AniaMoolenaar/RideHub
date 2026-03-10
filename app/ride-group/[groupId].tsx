import { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Bookmark, CheckCircle } from "lucide-react-native";

import Hero from "../../src/components/Hero";
import Disclaimer from "../../src/components/Disclaimer";
import AppHeader from "../../src/components/AppHeader";
import LoadingBlock from "../../src/components/LoadingBlock";
import ErrorBlock from "../../src/components/ErrorBlock";
import EmptyState from "../../src/components/EmptyState";
import PremiumLockedCard from "../../src/components/PremiumLockedCard";

import {
  fetchGroup,
  fetchGroupArticles,
  fetchCurrentUser,
  fetchProfileEntitlements,
  fetchUserArticleState,
} from "../../src/features/content/api";

import { useAppTheme, themeTokens } from "../../src/theme/theme";
import { getDesign } from "../../src/theme/design";
import { L2 } from "../../src/styles/level2";

const HEX_READ = "#f8c331";

type GroupRow = {
  id: string;
  title: string;
  description: string | null;
  is_premium: boolean;
};

type ArticleRow = {
  id: string;
  title: string;
  subheading: string | null;
  summary: string | null;
  is_read: boolean;
  is_saved: boolean;
};

export default function RideGroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const groupId = useMemo(
    () => (typeof params.groupId === "string" ? params.groupId : null),
    [params.groupId]
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [group, setGroup] = useState<GroupRow | null>(null);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const loadScreen = useCallback(
    async (isRefresh = false) => {
      if (!groupId) {
        setError("Missing groupId.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);
      setLocked(false);

      try {
        const groupData = await fetchGroup(groupId);

        if (!groupData) {
          setError("Group not found.");
          setGroup(null);
          setArticles([]);
          return;
        }

        const normalizedGroup: GroupRow = {
          id: groupData.id,
          title: groupData.title,
          description: groupData.description ?? null,
          is_premium: !!groupData.is_premium,
        };

        setGroup(normalizedGroup);

        const articleData = await fetchGroupArticles(groupId, "ride");

        const baseArticles: ArticleRow[] = articleData.map((a) => ({
          id: a.id,
          title: a.title,
          subheading: a.subheading ?? null,
          summary: a.summary ?? null,
          is_read: false,
          is_saved: false,
        }));

        if (normalizedGroup.is_premium) {
          const user = await fetchCurrentUser();

          if (!user) {
            setLocked(true);
            setArticles(baseArticles);
            return;
          }

          const profile = await fetchProfileEntitlements(user.id);

          if (!profile || !profile.has_ride) {
            setLocked(true);
            setArticles(baseArticles);
            return;
          }
        }

        const user = await fetchCurrentUser();

        if (!user) {
          setArticles(baseArticles);
          return;
        }

        const ids = baseArticles.map((a) => a.id);
        const stateRows = await fetchUserArticleState(user.id, ids);

        const stateMap = new Map<string, { is_read: boolean; is_saved: boolean }>();

        for (const r of stateRows) {
          stateMap.set(r.article_id, {
            is_read: !!r.is_read,
            is_saved: !!r.is_saved,
          });
        }

        setArticles(
          baseArticles.map((a) => {
            const s = stateMap.get(a.id);
            return {
              ...a,
              is_read: s?.is_read ?? false,
              is_saved: s?.is_saved ?? false,
            };
          })
        );
      } catch (e: any) {
        setError(e?.message ?? "Failed to load group.");
        setGroup(null);
        setArticles([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [groupId]
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        if (!active) return;
        await loadScreen(false);
      })();

      return () => {
        active = false;
      };
    }, [loadScreen, reloadKey])
  );

  const heroTitle = group?.title ?? "Ride";
  const heroSubtitle = group?.description ?? "Choose an article";

  return (
    <ScrollView
      style={{ backgroundColor: t.screenBg }}
      contentContainerStyle={{ paddingBottom: 0 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        !loading ? (
          <RefreshControl refreshing={refreshing} onRefresh={() => loadScreen(true)} />
        ) : undefined
      }
    >
      <Hero screen="ride" title={heroTitle} subtitle={heroSubtitle} />

      <AppHeader title={heroTitle} />

      <View style={L2.contentWrap}>
        {loading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorBlock message={error} onRetry={() => setReloadKey((v) => v + 1)} />
        ) : locked ? (
          <View style={L2.lockedWrap}>
            <PremiumLockedCard
              title="Ride Pack"
              description="This group is part of the Ride Pack. Unlock full access to continue."
              topics={articles.map((a) => a.title)}
              onPress={() => router.push("/(tabs)/premium")}
              goldGradient={d.goldGradient}
              goldTextOn={d.goldTextOn}
              pillBg={t.pillBg}
              pillBorder={t.pillBorder}
              text={t.text}
              textMuted={t.textMuted}
              styles={{
                tile: L2.tile,
                tileTitle: L2.tileTitle,
                tileSub: L2.tileSub,
                topicsMetaWrap: L2.topicsMetaWrap,
                smallHeading: L2.smallHeading,
                topicsList: L2.topicsList,
                bullet: L2.bullet,
                ctaOuter: L2.ctaOuter,
                absoluteFill: L2.absoluteFill,
                ctaInner: L2.ctaInner,
                ctaText: L2.ctaText,
              }}
            />
          </View>
        ) : (
          <View style={L2.listWrap}>
            {articles.length === 0 ? (
              <EmptyState message="No articles in this group yet." />
            ) : (
              articles.map((a) => {
                const subheading =
                  a.subheading?.trim() ||
                  a.summary?.trim() ||
                  "Tap to explore this topic";

                return (
                  <Pressable
                    key={a.id}
                    onPress={() =>
                      router.push({
                        pathname: "/ride-article/[articleId]",
                        params: { articleId: a.id },
                      })
                    }
                    style={({ pressed }) => [
                      L2.tile,
                      {
                        backgroundColor: t.pillBg,
                        borderColor: t.pillBorder,
                        opacity: pressed ? 0.96 : 1,
                        position: "relative",
                      },
                    ]}
                  >
                    {a.is_read || a.is_saved ? (
                      <View
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {a.is_saved ? <Bookmark size={16} color="#ffffff" /> : null}
                        {a.is_read ? <CheckCircle size={16} color={HEX_READ} /> : null}
                      </View>
                    ) : null}

                    <Text style={[L2.tileTitle, { color: t.text }]}>{a.title}</Text>

                    <Text style={[L2.tileSub, { color: t.textMuted }]}>{subheading}</Text>
                  </Pressable>
                );
              })
            )}
          </View>
        )}
      </View>

      {!locked ? (
        <View style={L2.disclaimerWrap}>
          <Disclaimer />
        </View>
      ) : (
        <View style={L2.disclaimerWrap} />
      )}
    </ScrollView>
  );
}