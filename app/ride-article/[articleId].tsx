import { useCallback, useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable, RefreshControl } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Bookmark, CheckCircle2, Info } from "lucide-react-native";
import Markdown from "react-native-markdown-display";
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
import { L3, L3_SECTION_GAP } from "../../src/styles/level3";
import { L2 } from "../../src/styles/level2";

type Article = {
  title: string;
  summary: string | null;
  content_md: string;
  info_image_url: string | null;
  info_text: string | null;
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

function ToggleActionButton({
  label,
  icon,
  active,
  disabled,
  onPress,
  t,
  d,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
  t: ReturnType<typeof themeTokens>;
  d: ReturnType<typeof getDesign>;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        L3.actionBtnOuter,
        { opacity: disabled ? 0.45 : pressed ? 0.92 : 1 },
      ]}
    >
      {active ? (
        <LinearGradient
          colors={d.goldGradient as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={L3.absoluteFill}
        />
      ) : (
        <View style={[L3.absoluteFill, { backgroundColor: t.pillBg }]} />
      )}

      <View style={L3.actionBtnInner}>
        {icon}
        <Text style={[L3.actionText, { color: active ? d.goldTextOn : t.text }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function RideArticleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const articleId = typeof params.articleId === "string" ? params.articleId : null;

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);
  const d = getDesign(isDark);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const { isSignedIn, authLoading, state, loading: stateLoading, setSaved, setRead } =
    useSupabaseArticleState(articleId);

  const [savingSaved, setSavingSaved] = useState(false);
  const [savingRead, setSavingRead] = useState(false);

  const loadArticle = useCallback(
    async (isRefresh = false) => {
      if (!articleId) {
        setError("Missing articleId.");
        setArticle(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

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
    body: { color: textColor, fontSize: 15, lineHeight: 22 },
    paragraph: { color: textColor, fontSize: 13, lineHeight: 22, marginBottom: 6 },
    list_item: { color: textColor, fontSize: 15, lineHeight: 22 },
    strong: { fontWeight: "800" },
  } as any;

  const heroTitle = article?.title ?? "Article";
  const headerSubtitle = article?.summary ?? "";
  const hasInfo = !!article?.info_image_url || !!article?.info_text;

  const isSaved = !!state.is_saved;
  const isRead = !!state.is_read;
  const canPress = !!articleId && isSignedIn && !authLoading && !stateLoading;

  async function onToggleSaved() {
    if (!canPress || savingSaved) return;
    setSavingSaved(true);
    try {
      await setSaved(!isSaved);
    } finally {
      setSavingSaved(false);
    }
  }

  async function onToggleRead() {
    if (!canPress || savingRead) return;
    setSavingRead(true);
    try {
      await setRead(!isRead);
    } finally {
      setSavingRead(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: t.screenBg }}
      contentContainerStyle={{ paddingBottom: 0 }}
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
      <Hero screen="ride" title={heroTitle} subtitle="" />

      <AppHeader
        subtitle={headerSubtitle}
        subtitleOnly
        right={
          <Pressable
            disabled={!hasInfo}
            onPress={() =>
              hasInfo &&
              router.push({
                pathname: "/article-info/[articleId]",
                params: { articleId },
              })
            }
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              opacity: hasInfo ? 1 : 0.3,
            }}
          >
            <Info size={18} color={t.text} />
          </Pressable>
        }
      />

      <View style={L3.articleWrap}>
        {loading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorBlock
            message={error}
            onRetry={() => {
              setReloadKey((v) => v + 1);
            }}
          />
        ) : sections.length === 0 ? (
          <EmptyState message="This article has no content yet." />
        ) : (
          sections.map((s, i) => (
            <View
              key={i}
              style={{ marginBottom: i === sections.length - 1 ? 0 : L3_SECTION_GAP }}
            >
              <View style={[L3.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {!!s.heading && (
                  <Text style={[L3.cardTitle, { color: t.text }]}>{s.heading}</Text>
                )}
                <Markdown style={mdStyles}>{s.body.trim()}</Markdown>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={L3.actionsWrap}>
        <View style={L3.actionsRow}>
          <ToggleActionButton
            label={isSaved ? "Saved" : "Save"}
            icon={<Bookmark size={18} color={isSaved ? d.goldTextOn : t.text} />}
            active={isSaved}
            disabled={!canPress || savingSaved}
            onPress={onToggleSaved}
            t={t}
            d={d}
          />

          <ToggleActionButton
            label={isRead ? "Read" : "Mark read"}
            icon={<CheckCircle2 size={18} color={isRead ? d.goldTextOn : t.text} />}
            active={isRead}
            disabled={!canPress || savingRead}
            onPress={onToggleRead}
            t={t}
            d={d}
          />
        </View>

        {!isSignedIn ? (
          <Text style={[L3.loginHint, { color: t.textMuted }]}>
            Create an account or log in to save articles and track reading.
          </Text>
        ) : null}
      </View>

      <View style={L2.disclaimerWrap}>
        <Disclaimer />
      </View>
    </ScrollView>
  );
}