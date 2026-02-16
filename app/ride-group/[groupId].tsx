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
import { supabase } from "../../src/lib/supabase";
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

type ProfileEntitlements = {
  is_premium: boolean;
  has_ride: boolean;
  has_maintain: boolean;
  has_learn: boolean;
};

type ArticleStateRow = {
  article_id: string;
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

        const { data: groupData, error: groupErr } = await supabase
          .from("groups")
          .select("id,title,description,is_premium")
          .eq("id", groupId)
          .eq("is_published", true)
          .maybeSingle();

        if (!alive) return;

        if (groupErr || !groupData) {
          setError(groupErr?.message ?? "Group not found.");
          setGroup(null);
          setArticles([]);
          setLoading(false);
          return;
        }

        const normalizedGroup: GroupRow = {
          ...groupData,
          is_premium: !!groupData.is_premium,
        };

        setGroup(normalizedGroup);

        const { data: articleData, error: articleErr } = await supabase
          .from("articles")
          .select("id,title,subheading,summary")
          .eq("group_id", groupId)
          .eq("tab", "ride")
          .eq("is_published", true)
          .order("sort_order", { ascending: true });

        if (!alive) return;

        if (articleErr) {
          setError(articleErr.message);
          setArticles([]);
          setLoading(false);
          return;
        }

        const baseArticles: ArticleRow[] = (articleData ?? []).map((a: any) => ({
          id: a.id,
          title: a.title,
          subheading: a.subheading ?? null,
          summary: a.summary ?? null,
          is_read: false,
          is_saved: false,
        }));

        // Premium lock check (existing behaviour)
        if (normalizedGroup.is_premium) {
          const {
            data: { user },
            error: userErr,
          } = await supabase.auth.getUser();

          if (!alive) return;

          if (userErr || !user) {
            setLocked(true);
            setArticles(baseArticles);
            setLoading(false);
            return;
          }

          const { data: p, error: pErr } = await supabase
            .from("profiles")
            .select("is_premium, has_ride, has_maintain, has_learn")
            .eq("id", user.id)
            .single();

          if (!alive) return;

          if (pErr || !p) {
            setLocked(true);
            setArticles(baseArticles);
            setLoading(false);
            return;
          }

          const profile = p as ProfileEntitlements;

          if (!profile.has_ride) {
            setLocked(true);
            setArticles(baseArticles);
            setLoading(false);
            return;
          }
        }

        // Read/Saved state (refreshes on focus)
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!alive) return;

        if (!user) {
          setArticles(baseArticles);
          setLoading(false);
          return;
        }

        const ids = baseArticles.map((a) => a.id);

        const { data: stateRows, error: stateErr } = await supabase
          .from("user_article_state")
          .select("article_id,is_read,is_saved")
          .eq("user_id", user.id)
          .in("article_id", ids);

        if (!alive) return;

        if (stateErr) {
          setArticles(baseArticles);
          setLoading(false);
          return;
        }

        const stateMap = new Map<string, { is_read: boolean; is_saved: boolean }>();
        for (const r of (stateRows ?? []) as ArticleStateRow[]) {
          stateMap.set(r.article_id, { is_read: !!r.is_read, is_saved: !!r.is_saved });
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
      })();

      return () => {
        alive = false;
      };
    }, [groupId])
  );

  const heroTitle = group?.title ?? "Ride";
  const heroSubtitle = group?.description ?? "Choose an article";

  return (
    <ScrollView
      style={{ backgroundColor: t.screenBg }}
      contentContainerStyle={{ paddingBottom: 0 }}
      showsVerticalScrollIndicator={false}
    >
      <Hero screen="ride" title={heroTitle} subtitle={heroSubtitle} />

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
              <Text style={[L2.tileTitle, { color: t.text }]}>Ride Pack</Text>

              <Text style={[L2.tileSub, { color: t.textMuted }]}>
                This group is part of the Ride Pack. Unlock full access to continue.
              </Text>

              {articles.length ? (
                <View style={L2.topicsMetaWrap}>
                  <Text style={[L2.smallHeading, { color: t.text }]}>
                    Topics included
                  </Text>

                  <View style={L2.topicsList}>
                    {articles.slice(0, 8).map((a) => (
                      <Text
                        key={a.id}
                        style={[L2.bullet, { color: t.textMuted }]}
                      >
                        • {a.title}
                      </Text>
                    ))}
                  </View>
                </View>
              ) : null}

              <Pressable
                onPress={() => router.push("/(tabs)/premium")}
                style={({ pressed }) => [
                  L2.ctaOuter,
                  { opacity: pressed ? 0.92 : 1 },
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
                  {(a.is_read || a.is_saved) ? (
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

                  <Text style={[L2.tileSub, { color: t.textMuted }]}>
                    {subheading}
                  </Text>
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
