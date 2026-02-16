import { useEffect, useMemo, useState } from "react";
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
import { useRouter } from "expo-router";
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

const MAINTAIN_SECTION_ID = "3245295d-d37b-48c0-b481-0016b8831e81";

/* helpers */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// simple greedy masonry (2 columns)
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

/* tile */
function TileCard({
  item,
  width,
  onPress,
  UI,
  t,
  d,
}: {
  item: Tile;
  width: number;
  onPress: () => void;
  UI: ReturnType<typeof useUI>;
  t: ReturnType<typeof themeTokens>;
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

        {item.is_premium && (
          <Sparkles size={18} color={d.premiumSparkle} style={L1.sparklePos} />
        )}

        <Text style={[UI.bottomLabelText, L1.bottomLabelPos]} numberOfLines={2}>
          {item.title}
        </Text>
      </ImageBackground>
    </Pressable>
  );
}

/* screen */
export default function MaintainScreen() {
  const router = useRouter();
  const UI = useUI();
  const { isDark } = useAppTheme();

  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("groups")
        .select("id,title,description,is_premium,image_url,tile_height")
        .eq("section_id", MAINTAIN_SECTION_ID)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      if (!mounted) return;

      if (error) {
        setError(error.message);
        setGroups([]);
      } else {
        setGroups((data ?? []) as GroupRow[]);
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

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
      <Hero
        screen="maintain"
        title="Maintain"
        subtitle="Understand your bike and keep it running right"
      />

      <View style={[L1.sectionWrap, L1.sectionTop38]}>
        <Text style={[L1.centerIntroText, { color: t.text }]}>
          Every ride builds understanding.
        </Text>

        {loading && <ActivityIndicator />}

        {!loading && error && <Text style={{ color: t.textMuted }}>{error}</Text>}

        {!loading && !error && (
          <View style={UI.gridRow}>
            {/* left column */}
            <View style={{ width: columnWidth }}>
              {masonry.left.map((item, i) => (
                <View key={item.id} style={{ marginTop: i ? SPACING.gutter : 0 }}>
                  <TileCard
                    item={item}
                    width={columnWidth}
                    UI={UI}
                    t={t}
                    d={d}
                    onPress={() =>
                      router.push({
                        pathname: "/maintain-group/[groupId]",
                        params: { groupId: item.id },
                      })
                    }
                  />
                </View>
              ))}
            </View>

            <View style={L1.gutterSpacer} />

            {/* right column */}
            <View style={{ width: columnWidth }}>
              {masonry.right.map((item, i) => (
                <View key={item.id} style={{ marginTop: i ? SPACING.gutter : 0 }}>
                  <TileCard
                    item={item}
                    width={columnWidth}
                    UI={UI}
                    t={t}
                    d={d}
                    onPress={() =>
                      router.push({
                        pathname: "/maintain-group/[groupId]",
                        params: { groupId: item.id },
                      })
                    }
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <Disclaimer />
    </ScrollView>
  );
}
