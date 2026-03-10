import { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { Bookmark, CheckCircle } from "lucide-react-native";

import Hero from "../../src/components/Hero";
import Disclaimer from "../../src/components/Disclaimer";
import AppHeader from "../../src/components/AppHeader";
import {
  fetchCurrentUser,
  fetchGroup,
  fetchGroupArticles,
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

export default function LearnGroupScreen() {
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
  const [group, setGroup] = useState<GroupRow | null>(null);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!groupId) {
        setLoading(false);
        setError("Missing groupId.");
        return;
      }

      let alive = true;

      (async () => {
        setLoading(true);
        setError(null);
        setLocked(false);

        try {
          const groupData = await fetchGroup(groupId);

          if (!alive) return;

          if (!groupData) {
            setError("Group not found.");
            setGroup(null);
            setArticles([]);
            setLoading(false);
            return;
          }

          const normalizedGroup: GroupRow = {
            id: groupData.id,
            title: groupData.title,
            description: groupData.description ?? null,
            is_premium: !!groupData.is_premium,
          };

          setGroup(normalizedGroup);

          const articleData = await fetchGroupArticles(groupId, "learn");

          if (!alive) return;

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

            if (!alive) return;

            if (!user) {
              setLocked(true);
              setArticles(baseArticles);
              setLoading(false);
              return;
            }

            const profile = await fetchProfileEntitlements(user.id);

            if (!alive) return;

            if (!profile || !profile.has_learn) {
              setLocked(true);
              setArticles(baseArticles);
              setLoading(false);
              return;
            }
          }

          const user = await fetchCurrentUser();

          if (!alive) return;

          if (!user) {
            setArticles(baseArticles);
            setLoading(false);
            return;
          }

          const ids = baseArticles.map((a) => a.id);
          const stateRows = await fetchUserArticleState(user.id, ids);

          if (!alive) return;

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

          setLoading(false);
        } catch (e: any) {
          if (!alive) return;
          setError(e?.message ?? "Failed to load group.");
          setGroup(null);
          setArticles([]);
          setLoading(false);
        }
      })();

      return () => {
        alive = false;
      };
    }, [groupId])
  );

  const heroTitle = group?.title ?? "Learn";
  const heroSubtitle = group?.description ?? "Choose an article";

  return (
    <ScrollView
      style={{ backgroundColor: t.screenBg }}
      contentContainerStyle={{ paddingBottom: 0 }}
      showsVerticalScrollIndicator={false}
    >
      <Hero screen="learn" title={heroTitle} subtitle={heroSubtitle} />

      <AppHeader title={heroTitle} />

      <View style={L2.contentWrap}>
        {loading ? (
          <ActivityIndicator />
        ) : error ? (
          <Text style={{ color: t.textMuted }}>{error}</Text>
        ) : locked ? (
          <View style={L2.lockedWrap}>
            <View
              style={[
                L2.tile,
                {
                  backgroundColor: t.pillBg,
                  borderColor: t.pillBorder,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[L2.tileTitle, { color: t.text }]}>Learn Pack</Text>

              <Text style={[L2.tileSub, { color: t.textMuted }]}>
                This group is part of the Learn Pack. Unlock full access to continue.
              </Text>

              {articles.length ? (
                <View style={L2.topicsMetaWrap}>
                  <Text style={[L2.smallHeading, { color: t.text }]}>Topics included</Text>

                  <View style={L2.topicsList}>
                    {articles.slice(0, 8).map((a) => (
                      <Text key={a.id} style={[L2.bullet, { color: t.textMuted }]}>
                        • {a.title}
                      </Text>
                    ))}
                  </View>
                </View>
              ) : null}

              <Pressable
                onPress={() => router.push("/(tabs)/premium")}
                style={({ pressed }) => [L2.ctaOuter, { opacity: pressed ? 0.92 : 1 }]}
              >
                <LinearGradient
                  colors={d.goldGradient as unknown as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={L2.absoluteFill}
                />
                <View style={L2.ctaInner}>
                  <Text style={[L2.ctaText, { color: d.goldTextOn }]}>
                    Browse Premium Packs
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={L2.listWrap}>
            {articles.map((a) => {
              const subheading =
                a.subheading?.trim() ||
                a.summary?.trim() ||
                "Tap to explore this topic";

              return (
                <Pressable
                  key={a.id}
                  onPress={() =>
                    router.push({
                      pathname: "/learn-article/[articleId]",
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
            })}
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