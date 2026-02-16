import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, CheckCircle } from "lucide-react-native";

import { useAppTheme, themeTokens } from "../../src/theme/theme";
import { supabase } from "../../src/lib/supabase";

type ArticleRow = {
  id: string;
  title: string;
  tab: "ride" | "maintain" | "learn" | "unknown";
  category: string | null;
  is_read: boolean;
  is_locked: boolean;
};

/** Hex colours */
const HEX_READ = "#f8c331";
const HEX_ARTICLE = "#969696";
const HEX_LOCKED = "#646464";

// dark theme
const HEX_SECTION_TITLE_DARK = "#e7e7e7";
const HEX_GROUP_TITLE_DARK = "#e9e9e9";

// light theme
const HEX_SECTION_TITLE_LIGHT = "#000000";
const HEX_GROUP_TITLE_LIGHT = "#000000";

/** Section header height control */
const SECTION_PILL_HEIGHT = 54;
const SECTION_PILL_PADDING_H = 14;

function normalizeTab(v: unknown): ArticleRow["tab"] {
  const s = String(v ?? "").toLowerCase();
  if (s === "ride") return "ride";
  if (s === "maintain") return "maintain";
  if (s === "learn") return "learn";
  return "unknown";
}

function groupByCategory(items: ArticleRow[]) {
  const map = new Map<string, ArticleRow[]>();
  for (const a of items) {
    const key = (a.category ?? "").trim() || "Uncategorised";
    const bucket = map.get(key);
    bucket ? bucket.push(a) : map.set(key, [a]);
  }
  return Array.from(map.entries()).map(([category, rows]) => ({
    category,
    rows,
  }));
}

function CategoryBlock({
  title,
  items,
  hexGroupTitle,
}: {
  title: string;
  items: ArticleRow[];
  hexGroupTitle: string;
}) {
  return (
    <View style={styles.categoryBlock}>
      <Text style={[styles.categoryTitle, { color: hexGroupTitle }]}>
        {title}
      </Text>

      {items.map((a) => {
        const articleColor = a.is_locked
          ? HEX_LOCKED
          : a.is_read
          ? HEX_READ
          : HEX_ARTICLE;

        return (
          <View key={a.id} style={styles.textRow}>
            <Text
              style={[styles.textItem, { color: articleColor }]}
              numberOfLines={2}
            >
              {a.title}
            </Text>

            {a.is_read && !a.is_locked && (
              <CheckCircle size={14} color={HEX_READ} />
            )}
          </View>
        );
      })}
    </View>
  );
}

function SectionBox({
  items,
  colors,
  orderMap,
  hexGroupTitle,
}: {
  items: ArticleRow[];
  colors: ReturnType<typeof themeTokens>;
  orderMap?: Map<string, number>;
  hexGroupTitle: string;
}) {
  const grouped = useMemo(() => {
    const groups = groupByCategory(items);

    groups.sort((A, B) => {
      const aKey = A.category;
      const bKey = B.category;

      const aOrd = orderMap?.has(aKey)
        ? orderMap.get(aKey)!
        : Number.POSITIVE_INFINITY;
      const bOrd = orderMap?.has(bKey)
        ? orderMap.get(bKey)!
        : Number.POSITIVE_INFINITY;

      if (aOrd !== bOrd) return aOrd - bOrd;
      return aKey.localeCompare(bKey);
    });

    return groups;
  }, [items, orderMap]);

  return (
    <View
      style={[
        styles.box,
        { backgroundColor: colors.pillBg, borderColor: colors.pillBorder },
      ]}
    >
      {grouped.map((g) => (
        <CategoryBlock
          key={g.category}
          title={g.category}
          items={g.rows}
          hexGroupTitle={hexGroupTitle}
        />
      ))}
    </View>
  );
}

type SectionRow = { id: string; slug?: string | null; title?: string | null };
type GroupRow = { title: string; sort_order: number | null; section_id: string };

export default function ReadingStatusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { isDark } = useAppTheme();
  const colors = themeTokens(isDark);

  const hexSectionTitle = isDark
    ? HEX_SECTION_TITLE_DARK
    : HEX_SECTION_TITLE_LIGHT;
  const hexGroupTitle = isDark
    ? HEX_GROUP_TITLE_DARK
    : HEX_GROUP_TITLE_LIGHT;

  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<ArticleRow[]>([]);

  const [orderRide, setOrderRide] = useState<Map<string, number> | undefined>();
  const [orderMaintain, setOrderMaintain] = useState<
    Map<string, number> | undefined
  >();
  const [orderLearn, setOrderLearn] = useState<
    Map<string, number> | undefined
  >();

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id;
        if (!userId) return;

        const [
          { data: allArticles },
          { data: readRows },
          { data: sections },
          { data: groups },
        ] = await Promise.all([
          supabase.from("articles").select("id, title, tab, category"),
          supabase
            .from("user_article_state")
            .select("article_id")
            .eq("user_id", userId)
            .eq("is_read", true),
          supabase.from("sections").select("id, slug, title"),
          supabase.from("groups").select("title, sort_order, section_id"),
        ]);

        const readSet = new Set((readRows ?? []).map((r) => r.article_id));

        const sectionIdToTab = new Map<string, ArticleRow["tab"]>();
        for (const s of (sections ?? []) as SectionRow[]) {
          const tab = normalizeTab(s.slug ?? s.title ?? "");
          if (tab !== "unknown") sectionIdToTab.set(s.id, tab);
        }

        const rideMap = new Map<string, number>();
        const maintainMap = new Map<string, number>();
        const learnMap = new Map<string, number>();

        for (const g of (groups ?? []) as GroupRow[]) {
          const tab = sectionIdToTab.get(g.section_id);
          if (!tab) continue;

          const title = String(g.title ?? "").trim();
          if (!title) continue;

          const ord =
            typeof g.sort_order === "number"
              ? g.sort_order
              : Number.POSITIVE_INFINITY;

          if (tab === "ride") rideMap.set(title, ord);
          if (tab === "maintain") maintainMap.set(title, ord);
          if (tab === "learn") learnMap.set(title, ord);
        }

        if (mounted && allArticles) {
          setOrderRide(rideMap);
          setOrderMaintain(maintainMap);
          setOrderLearn(learnMap);

          setArticles(
            allArticles.map((a: any) => ({
              id: a.id,
              title: a.title,
              tab: normalizeTab(a.tab),
              category: a.category ?? null,
              is_read: readSet.has(a.id),
              is_locked: false,
            }))
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const ride = articles.filter((a) => a.tab === "ride");
  const maintain = articles.filter((a) => a.tab === "maintain");
  const learn = articles.filter((a) => a.tab === "learn");

  return (
    <View style={[styles.root, { backgroundColor: colors.screenBg }]}>
      <LinearGradient
        colors={
          isDark
            ? ["#1E1F22", "#1B1C1F", "#18191C"]
            : ["#FFFFFF", "#FAFAF9", "#F5F5F4"]
        }
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <ChevronLeft size={20} color={colors.text} />
          </Pressable>

          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Reading status
          </Text>

          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator />
          </View>
        ) : (
          <>
            {/* Ride */}
            <View
              style={[
                styles.sectionPill,
                {
                  backgroundColor: colors.pillBg,
                  height: SECTION_PILL_HEIGHT,
                  paddingHorizontal: SECTION_PILL_PADDING_H,
                },
              ]}
            >
              <Text style={[styles.sectionPillText, { color: hexSectionTitle }]}>
                Ride
              </Text>
            </View>
            <SectionBox
              items={ride}
              colors={colors}
              orderMap={orderRide}
              hexGroupTitle={hexGroupTitle}
            />

            {/* Maintain */}
            <View
              style={[
                styles.sectionPill,
                {
                  backgroundColor: colors.pillBg,
                  height: SECTION_PILL_HEIGHT,
                  paddingHorizontal: SECTION_PILL_PADDING_H,
                },
              ]}
            >
              <Text style={[styles.sectionPillText, { color: hexSectionTitle }]}>
                Maintain
              </Text>
            </View>
            <SectionBox
              items={maintain}
              colors={colors}
              orderMap={orderMaintain}
              hexGroupTitle={hexGroupTitle}
            />

            {/* Learn */}
            <View
              style={[
                styles.sectionPill,
                {
                  backgroundColor: colors.pillBg,
                  height: SECTION_PILL_HEIGHT,
                  paddingHorizontal: SECTION_PILL_PADDING_H,
                },
              ]}
            >
              <Text style={[styles.sectionPillText, { color: hexSectionTitle }]}>
                Learn
              </Text>
            </View>
            <SectionBox
              items={learn}
              colors={colors}
              orderMap={orderLearn}
              hexGroupTitle={hexGroupTitle}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { paddingHorizontal: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(250,250,248,0.06)",
    borderWidth: 0,
    borderColor: "rgba(250,250,248,0.10)",
  },
  headerTitle: { fontSize: 16, fontWeight: "900" },

  loadingWrap: {
    paddingTop: 18,
    paddingBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionPill: {
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionPillText: {
    fontSize: 18,
    fontWeight: "800",
  },

  box: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },

  categoryBlock: { marginBottom: 12 },

  categoryTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },

  textRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  textItem: {
    flex: 1,
    paddingRight: 8,
    fontSize: 13,
    fontWeight: "500",
  },
});
