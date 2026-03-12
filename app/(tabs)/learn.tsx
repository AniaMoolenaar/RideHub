import React, { useMemo, useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";

import Hero from "../../src/components/Hero";
import Disclaimer from "../../src/components/Disclaimer";
import { supabase } from "../../src/lib/supabase";

import { useUI, SPACING } from "../../src/styles/ui";
import { useAppTheme, themeTokens } from "../../src/theme/theme";
import { getDesign } from "../../src/theme/design";
import { L1 } from "../../src/styles/level1";

type GroupRow = {
  id: string;
  title: string;
  description: string | null;
  is_premium: boolean;
  image_url: string | null;
  tile_height: number | null;
};

type Tile = GroupRow & { height: number };

const LEARN_SECTION_ID = "bd23d484-ea2b-485f-ac60-f9ae4bba4097";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function packTwoColumns(items: Tile[]) {
  const left: Tile[] = [];
  const right: Tile[] = [];

  let leftH = 0;
  let rightH = 0;

  for (const item of items) {
    if (leftH <= rightH) {
      left.push(item);
      leftH += item.height + SPACING.gutter;
    } else {
      right.push(item);
      rightH += item.height + SPACING.gutter;
    }
  }

  return { left, right };
}

function formatProgress(total: number, completed: number) {
  const articleLabel = total === 1 ? "Article" : "Articles";
  return `${total} ${articleLabel} • ${completed} Completed`;
}

function TileCard({
  item,
  width,
  onPress,
  UI,
  d,
}: {
  item: Tile;
  width: number;
  onPress: () => void;
  UI: ReturnType<typeof useUI>;
  d: ReturnType<typeof getDesign>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        UI.card,
        { width, height: item.height },
        pressed && UI.pressed,
      ]}
    >
      <ImageBackground
        source={item.image_url ? { uri: item.image_url } : undefined}
        style={UI.imageFill}
        resizeMode="cover"
      >
        <View pointerEvents="none" style={L1.fadeWrap}>
          <LinearGradient
            colors={[d.tileFadeFrom, d.tileFadeTo]}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            style={L1.absoluteFill}
          />
        </View>

        {item.is_premium ? (
          <Sparkles size={18} color={d.premiumSparkle} style={L1.sparklePos} />
        ) : null}

        <Text style={[UI.bottomLabelText, L1.bottomLabelPos]} numberOfLines={2}>
          {item.title}
        </Text>
      </ImageBackground>
    </Pressable>
  );
}

export default function LearnScreen() {
  const router = useRouter();
  const UI = useUI();
  const { isDark } = useAppTheme();

  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalArticles, setTotalArticles] = useState(0);
  const [completedArticles, setCompletedArticles] = useState(0);

  const loadScreen = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("id,title,description,is_premium,image_url,tile_height")
        .eq("section_id", LEARN_SECTION_ID)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      if (groupError) {
        setError(groupError.message);
        setGroups([]);
        setTotalArticles(0);
        setCompletedArticles(0);
        return;
      }

      const nextGroups = (groupData ?? []) as GroupRow[];
      setGroups(nextGroups);

      const freeGroupIds = nextGroups.filter((g) => !g.is_premium).map((g) => g.id);

      if (!freeGroupIds.length) {
        setTotalArticles(0);
        setCompletedArticles(0);
        return;
      }

      const { data: articleData, error: articleError } = await supabase
        .from("articles")
        .select("id")
        .in("group_id", freeGroupIds)
        .eq("tab", "learn")
        .eq("is_published", true);

      if (articleError) {
        setError(articleError.message);
        setTotalArticles(0);
        setCompletedArticles(0);
        return;
      }

      const articleIds = (articleData ?? []).map((a: any) => a.id as string);
      setTotalArticles(articleIds.length);

      if (!articleIds.length) {
        setCompletedArticles(0);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCompletedArticles(0);
        return;
      }

      const { data: stateData, error: stateError } = await supabase
        .from("user_article_state")
        .select("article_id")
        .eq("user_id", user.id)
        .eq("is_read", true)
        .in("article_id", articleIds);

      if (stateError) {
        setError(stateError.message);
        setCompletedArticles(0);
        return;
      }

      const completedIds = new Set((stateData ?? []).map((row: any) => row.article_id));
      setCompletedArticles(completedIds.size);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load Learn.");
      setGroups([]);
      setTotalArticles(0);
      setCompletedArticles(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadScreen();
    }, [loadScreen])
  );

  const screenW = Dimensions.get("window").width;

  const columnWidth = useMemo(() => {
    const available = screenW - SPACING.screenPadding * 2 - SPACING.gutter;
    return Math.floor(available / 2);
  }, [screenW]);

  const tiles: Tile[] = useMemo(
    () =>
      groups.map((g) => ({
        ...g,
        is_premium: !!g.is_premium,
        height: clamp(g.tile_height ?? 180, 120, 360),
      })),
    [groups]
  );

  const masonry = useMemo(() => packTwoColumns(tiles), [tiles]);

  return (
    <ScrollView
      style={{ backgroundColor: t.screenBg }}
      contentContainerStyle={L1.scrollContent24}
      showsVerticalScrollIndicator={false}
    >
      <Hero screen="learn" />

      <View style={[L1.sectionWrap, L1.sectionTop38]}>
        <Text
          style={[
            L1.centerIntroText,
            {
              color: t.text,
              marginBottom: 12,
              lineHeight: 20,
            },
          ]}
        >
          Every ride builds understanding.
        </Text>

        {!loading && !error ? (
          <Text
            style={{
              color: t.textMuted,
              opacity: 0.9,
              fontSize: 13,
              textAlign: "center",
              marginTop: 2,
              marginBottom: 32,
              lineHeight: 16,
            }}
          >
            {formatProgress(totalArticles, completedArticles)}
          </Text>
        ) : null}

        {loading ? <ActivityIndicator /> : null}

        {!loading && error ? <Text style={{ color: t.textMuted }}>{error}</Text> : null}

        {!loading && !error ? (
          <View style={UI.gridRow}>
            <View style={{ width: columnWidth }}>
              {masonry.left.map((item, i) => (
                <View key={item.id} style={{ marginTop: i ? SPACING.gutter : 0 }}>
                  <TileCard
                    item={item}
                    width={columnWidth}
                    UI={UI}
                    d={d}
                    onPress={() =>
                      router.push({
                        pathname: "/learn-group/[groupId]",
                        params: { groupId: item.id },
                      })
                    }
                  />
                </View>
              ))}
            </View>

            <View style={L1.gutterSpacer} />

            <View style={{ width: columnWidth }}>
              {masonry.right.map((item, i) => (
                <View key={item.id} style={{ marginTop: i ? SPACING.gutter : 0 }}>
                  <TileCard
                    item={item}
                    width={columnWidth}
                    UI={UI}
                    d={d}
                    onPress={() =>
                      router.push({
                        pathname: "/learn-group/[groupId]",
                        params: { groupId: item.id },
                      })
                    }
                  />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <Disclaimer />
    </ScrollView>
  );
}