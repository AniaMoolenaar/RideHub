import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";

import Hero from "../../src/components/Hero";
import HomeSearchBar from "../../src/components/HomeSearchBar";
import SavedTopicsGrid, { type Topic } from "../../src/components/SavedTopicsGrid";
import JournalSection from "../../src/components/JournalSection";
import Disclaimer from "../../src/components/Disclaimer";

import { supabase } from "../../src/lib/supabase";
import { useSavedArticleIds } from "../../src/state/articleState";
import { useAppTheme, themeTokens } from "../../src/theme/theme";
import { L1 } from "../../src/styles/level1";

type SearchHit = {
  id: string;
  title: string;
  tab: string | null;
  category: string | null;
};

export default function HomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);

  // Search
  const [query, setQuery] = useState("");
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const showPopup = query.trim().length >= 2;

  // Saved topics
  const { savedIds } = useSavedArticleIds();
  const [savedTopics, setSavedTopics] = useState<Topic[]>([]);

  // -----------------------------
  // Saved-only grid
  // -----------------------------
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!savedIds.length) {
        if (alive) setSavedTopics([]);
        return;
      }

      const { data, error } = await supabase
        .from("articles")
        .select("id,title,hero_image_url,groups(image_url)")
        .in("id", savedIds);

      if (!alive) return;

      if (error) {
        console.log("SAVED GRID ERROR:", error);
        setSavedTopics([]);
        return;
      }

      const map = new Map((data ?? []).map((a: any) => [a.id, a]));
      const ordered: Topic[] = savedIds
        .map((id) => map.get(id))
        .filter(Boolean)
        .map((a: any) => ({
          id: a.id,
          title: a.title,
          image_url: a.groups?.image_url ?? a.hero_image_url ?? null,
          saved: true,
        }));

      setSavedTopics(ordered);
    })();

    return () => {
      alive = false;
    };
  }, [savedIds]);

  // -----------------------------
  // Search popup results
  // -----------------------------
  useEffect(() => {
    let alive = true;

    (async () => {
      const q = query.trim();

      if (q.length < 2) {
        if (!alive) return;
        setSearchHits([]);
        setSearching(false);
        return;
      }

      setSearching(true);

      const { data, error } = await supabase
        .from("articles")
        .select("id,title,tab,category")
        .or(
          [`title.ilike.%${q}%`, `slug.ilike.%${q}%`, `category.ilike.%${q}%`].join(",")
        )
        .limit(8);

      if (!alive) return;

      if (error) {
        console.log("SEARCH ERROR:", error);
        setSearchHits([]);
        setSearching(false);
        return;
      }

      setSearchHits((data ?? []) as any);
      setSearching(false);
    })();

    return () => {
      alive = false;
    };
  }, [query]);

  function openHit(hit: SearchHit) {
    const tab = (hit.tab ?? "").toLowerCase();

    if (tab === "ride") {
      router.push({ pathname: "/ride-article/[articleId]", params: { articleId: hit.id } });
      return;
    }

    if (tab === "maintain") {
      router.push("/maintain-gateway");
      return;
    }

    if (tab === "learn") {
      router.push("/learn-gateway");
      return;
    }

    router.push("/premium");
  }

  return (
    <KeyboardAvoidingView
      style={[L1.screen, { backgroundColor: t.screenBg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scrollRef}
        style={{ backgroundColor: t.screenBg }}
        contentContainerStyle={[L1.scrollContent40, { backgroundColor: t.screenBg }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Hero
          screen="home"
          variant="home"
          title="Ride with Confidence"
          subtitle="Your complete guide to motorcycle ownership"
        />

        {/* SEARCH */}
        <View style={L1.relativeWrap}>
          <HomeSearchBar
            value={query}
            onChangeText={setQuery}
            onFocus={() => scrollRef.current?.scrollTo({ y: 120, animated: true })}
          />

          {showPopup ? (
            <View style={[L1.searchPopup, { backgroundColor: t.pillBg, borderColor: t.pillBorder }]}>
              <View style={L1.searchPopupHeader}>
                <Text style={[L1.searchMetaText, { color: t.textMuted }]}>
                  {searching
                    ? "Searching…"
                    : `${searchHits.length} result${searchHits.length === 1 ? "" : "s"}`}
                </Text>

                <Pressable onPress={() => setQuery("")}>
                  <Text style={[L1.searchClearText, { color: t.textMuted }]}>Clear</Text>
                </Pressable>
              </View>

              {searching ? (
                <View style={L1.searchLoadingWrap}>
                  <ActivityIndicator size="small" color={t.textMuted} />
                </View>
              ) : searchHits.length ? (
                searchHits.map((hit) => (
                  <Pressable
                    key={hit.id}
                    onPress={() => openHit(hit)}
                    style={({ pressed }) => [
                      L1.hitRow,
                      { borderTopColor: t.pillBorder, opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <Text style={[L1.hitTitle, { color: t.text }]}>{hit.title}</Text>
                    <Text style={[L1.hitSub, { color: t.textMuted }]}>
                      {(hit.tab ?? "").toUpperCase()}
                      {hit.category ? ` • ${hit.category}` : ""}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <View style={[L1.noMatchesWrap, { borderTopColor: t.pillBorder }]}>
                  <Text style={[L1.noMatchesText, { color: t.textMuted }]}>No matches</Text>
                </View>
              )}
            </View>
          ) : null}
        </View>

        {/* SAVED TOPICS */}
        <SavedTopicsGrid
          items={savedTopics}
          onTopicPress={(topic) =>
            router.push({ pathname: "/ride-article/[articleId]", params: { articleId: topic.id } })
          }
        />

        <JournalSection />

        <Disclaimer />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
