import { useCallback, useMemo, useState } from "react";
import { ScrollView, View, Text, RefreshControl, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Markdown from "react-native-markdown-display";
import { Bookmark, CheckCircle2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import Hero from "../../src/components/Hero";
import Disclaimer from "../../src/components/Disclaimer";
import AppHeader from "../../src/components/AppHeader";
import LoadingBlock from "../../src/components/LoadingBlock";
import ErrorBlock from "../../src/components/ErrorBlock";
import EmptyState from "../../src/components/EmptyState";

import { fetchArticle } from "../../src/features/content/api";

import { useAppTheme, themeTokens } from "../../src/theme/theme";
import { getDesign } from "../../src/theme/design";
import { useSupabaseArticleState } from "../../src/state/articleState";
import { L3 } from "../../src/styles/level3";
import { L2 } from "../../src/styles/level2";

type Article = {
  title: string;
  summary: string | null;
  content_md: string;
  group_title: string | null;
};

type Section = {
  heading: string;
  body: string;
};

function splitIntoSections(md: string): Section[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const sections: Section[] = [];
  let current: Section = { heading: "", body: "" };

  for (const line of lines) {
    const match = line.match(/^##\s+(.*)$/);

    if (match) {
      if (current.body.trim()) sections.push(current);
      current = { heading: match[1], body: "" };
      continue;
    }

    current.body += line + "\n";
  }

  if (current.body.trim()) sections.push(current);

  return sections;
}

export default function LearnArticleScreen() {
  const params = useLocalSearchParams();

  const articleId =
    typeof params.articleId === "string" ? params.articleId : null;

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const { state, setSaved, setRead } = useSupabaseArticleState(articleId);

  const isSaved = !!state?.is_saved;
  const isRead = !!state?.is_read;

  const loadArticle = useCallback(
    async (isRefresh = false) => {
      if (!articleId) {
        setError("Missing articleId.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      try {
        const data = await fetchArticle(articleId);

        if (!data) {
          setError("Article not found.");
          setArticle(null);
          return;
        }

        setArticle(data as Article);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load article.");
        setArticle(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [articleId]
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        if (!active) return;
        await loadArticle(false);
      })();

      return () => {
        active = false;
      };
    }, [loadArticle, reloadKey])
  );

  const sections = useMemo(
    () => splitIntoSections(article?.content_md ?? ""),
    [article?.content_md]
  );

  const textColor = d.articleText;
  const cardBg = d.articleCardBg;
  const cardBorder = d.articleCardBorder;

  const mdStyles = {
    body: {
      color: textColor,
      fontSize: 14,
      lineHeight: 22,
    },
    paragraph: {
      color: textColor,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 12,
    },
    strong: {
      fontWeight: "800",
    },
    em: {
      fontStyle: "italic",
    },
    bullet_list: {
      marginBottom: 12,
    },
    ordered_list: {
      marginBottom: 12,
    },
    list_item: {
      marginBottom: 6,
      color: textColor,
      fontSize: 14,
      lineHeight: 22,
    },
    heading1: {
      color: t.text,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "800",
      marginTop: 2,
      marginBottom: 12,
    },
    heading2: {
      color: t.text,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "800",
      marginTop: 2,
      marginBottom: 10,
    },
    heading3: {
      color: t.text,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "800",
      marginTop: 2,
      marginBottom: 8,
    },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: t.pillBorder,
      paddingLeft: 12,
      marginBottom: 12,
      opacity: 0.96,
    },
    code_inline: {
      backgroundColor: t.pillBg,
      color: t.text,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      fontSize: 13,
    },
    code_block: {
      backgroundColor: t.pillBg,
      color: t.text,
      padding: 12,
      borderRadius: 12,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 12,
    },
    fence: {
      backgroundColor: t.pillBg,
      color: t.text,
      padding: 12,
      borderRadius: 12,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 12,
    },
    link: {
      color: t.text,
      textDecorationLine: "underline",
    },
    hr: {
      backgroundColor: t.pillBorder,
      height: 1,
      marginVertical: 14,
    },
  } as any;

  const heroTitle = article?.group_title ?? "Learn";
  const heroSubtitle = article?.title ?? "";

  const headerText = article?.summary ?? "";

  return (
    <ScrollView
      style={{ backgroundColor: t.screenBg }}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        !loading ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadArticle(true)}
          />
        ) : undefined
      }
    >
      <Hero screen="learn" title={heroTitle} subtitle={heroSubtitle} />

      <AppHeader subtitle={headerText} subtitleOnly />

      <View style={L3.articleWrap}>
        {loading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorBlock
            message={error}
            onRetry={() => setReloadKey((v) => v + 1)}
          />
        ) : sections.length === 0 ? (
          <EmptyState message="This article has no content yet." />
        ) : (
          sections.map((s, i) => (
            <View
              key={i}
              style={[
                L3.sectionWrap,
                i < sections.length - 1 && L3.sectionGap,
              ]}
            >
              <View
                style={[
                  L3.card,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                {!!s.heading ? (
                  <Text style={[L3.cardTitle, { color: t.text }]}>
                    {s.heading}
                  </Text>
                ) : null}

                <Markdown style={mdStyles}>{s.body.trim()}</Markdown>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={L3.actionsWrap}>
        <View style={L3.actionsRow}>
          <Pressable onPress={() => setSaved(!isSaved)} style={L3.actionBtnOuter}>
            {isSaved ? (
              <LinearGradient
                colors={d.goldGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={L3.absoluteFill}
              />
            ) : (
              <View style={[L3.absoluteFill, { backgroundColor: t.pillBg }]} />
            )}

            <View style={L3.actionBtnInner}>
              <Bookmark size={18} color={isSaved ? d.goldTextOn : t.text} />
              <Text
                style={[
                  L3.actionText,
                  { color: isSaved ? d.goldTextOn : t.text },
                ]}
              >
                {isSaved ? "Saved" : "Save"}
              </Text>
            </View>
          </Pressable>

          <Pressable onPress={() => setRead(!isRead)} style={L3.actionBtnOuter}>
            {isRead ? (
              <LinearGradient
                colors={d.goldGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={L3.absoluteFill}
              />
            ) : (
              <View style={[L3.absoluteFill, { backgroundColor: t.pillBg }]} />
            )}

            <View style={L3.actionBtnInner}>
              <CheckCircle2 size={18} color={isRead ? d.goldTextOn : t.text} />
              <Text
                style={[
                  L3.actionText,
                  { color: isRead ? d.goldTextOn : t.text },
                ]}
              >
                {isRead ? "Read" : "Mark read"}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={L2.disclaimerWrap}>
        <Disclaimer />
      </View>
    </ScrollView>
  );
}