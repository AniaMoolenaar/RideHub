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

import { useSavedArticleIds } from "../../src/state/articleState";
import { useAppTheme, themeTokens } from "../../src/theme/theme";
import { L1 } from "../../src/styles/level1";
import {
  fetchSavedArticles,
  searchArticles,
  type SearchHit,
} from "../../src/features/content/api";

export default function HomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);

  const [query, setQuery] = useState("");
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const showPopup = query.trim().length >= 2;

  const { savedIds } = useSavedArticleIds();
  const [savedTopics, setSavedTopics] = useState<Topic[]>([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!savedIds.length) {
        if (alive) setSavedTopics([]);
        return;
      }

      try {
        const data = await fetchSavedArticles(savedIds);

        if (!alive) return;

        const map = new Map(data.map((a) => [a.id, a]));

        const ordered: Topic[] = savedIds
          .map((id) => map.get(id))
          .filter(Boolean)
          .map((a) => {
            const groupImage = Array.isArray(a!.groups)
              ? a!.groups[0]?.image_url ?? null
              : a!.groups?.image_url ?? null;

            return {
              id: a!.id,
              title: a!.title,
              tab: a!.tab ?? null,
              image_url: groupImage ?? a!.hero_image_url ?? null,
              saved: true,
            };
          });

        setSavedTopics(ordered);
      } catch {
        if (alive) setSavedTopics([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [savedIds]);

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

      try {
        const data = await searchArticles(q);

        if (!alive) return;

        setSearchHits(data);
        setSearching(false);
      } catch {
        if (!alive) return;
        setSearchHits([]);
        setSearching(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [query]);

  function openArticleByTab(articleId: string, tab?: string | null) {
    const normalizedTab = (tab ?? "").toLowerCase();

    if (normalizedTab === "ride") {
      router.push({
        pathname: "/ride-article/[articleId]",
        params: { articleId },
      });
      return;
    }

    if (normalizedTab === "learn") {
      router.push({
        pathname: "/learn-article/[articleId]",
        params: { articleId },
      });
      return;
    }

    if (normalizedTab === "maintain") {
      router.push({
        pathname: "/maintain-article/[articleId]",
        params: { articleId },
      });
      return;
    }

    router.push("/premium");
  }

  function openHit(hit: SearchHit) {
    openArticleByTab(hit.id, hit.tab);
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
        <Hero screen="home" variant="home" />

        <View style={L1.relativeWrap}>
          <HomeSearchBar
            value={query}
            onChangeText={setQuery}
            onFocus={() => scrollRef.current?.scrollTo({ y: 120, animated: true })}
          />

          {showPopup ? (
            <View
              style={[
                L1.searchPopup,
                { backgroundColor: t.pillBg, borderColor: t.pillBorder },
              ]}
            >
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

        <SavedTopicsGrid
          items={savedTopics}
          onTopicPress={(topic) => openArticleByTab(topic.id, topic.tab)}
        />

        <JournalSection />

        <Disclaimer />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}