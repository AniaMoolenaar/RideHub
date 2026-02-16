import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, X } from "lucide-react-native";
import { supabase } from "../lib/supabase";

import { useAppTheme, themeTokens } from "../theme/theme";

type BlogRow = {
  id: string;
  title: string | null;
  subtitle: string | null;
  hero_image_url: string | null;
  sort_order: number | null;
};

type SlideRow = {
  blog_id: string;
  position: number | null;
  text: string | null;
};

type JournalPage = { text: string };

type JournalArticle = {
  id: string;
  title: string;
  subtitle: string;
  imageUri: string;
  pages: JournalPage[];
};

const { width: SCREEN_W } = Dimensions.get("window");

const FALLBACK_IMAGE_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO1+f0sAAAAASUVORK5CYII=";

const CARD_W_RATIO = 0.8;
const CARD_H_RATIO = 1.5;
const GAP = 1;

const CENTER_SCALE = 1.0;
const SIDE_SCALE = 0.9;
const SIDE_OPACITY = 0.62;

const CARD_OVERLAY_TOP = 0.01;
const CARD_OVERLAY_BOTTOM = 0.3;

const STORY_GRADIENT_TOP = 0.001;
const STORY_GRADIENT_MIDDLE = 0.01;
const STORY_GRADIENT_BOTTOM = 1.5;

function asMessage(e: unknown) {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyE = e as any;
  return anyE?.message || JSON.stringify(anyE);
}

export default function JournalSection() {
  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);

  const [items, setItems] = useState<JournalArticle[]>([]);
  const [openArticle, setOpenArticle] = useState<JournalArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<Animated.FlatList<JournalArticle> | null>(null);

  const CARD_W = useMemo(() => Math.min(600, Math.round(SCREEN_W * CARD_W_RATIO)), []);
  const CARD_H = useMemo(() => Math.round(CARD_W * CARD_H_RATIO), [CARD_W]);

  const STEP = CARD_W + GAP;
  const SIDE_INSET = Math.max(18, Math.round((SCREEN_W - CARD_W) / 2));

  // --- Infinite loop setup (no other behavior changes) ---
  const BASE_LEN = items.length;
  const LOOP_MULT = 3;
  const loopData = useMemo(() => {
    if (BASE_LEN === 0) return [];
    const out: JournalArticle[] = [];
    for (let i = 0; i < LOOP_MULT; i++) out.push(...items);
    return out;
  }, [items, BASE_LEN]);

  const INITIAL_INDEX = useMemo(() => (BASE_LEN ? BASE_LEN : 0), [BASE_LEN]);
  const INITIAL_OFFSET = useMemo(() => INITIAL_INDEX * STEP, [INITIAL_INDEX, STEP]);

  const jumpToOffset = useCallback(
    (offset: number) => {
      if (!listRef.current) return;
      listRef.current.scrollToOffset({ offset, animated: false });
      scrollX.setValue(offset);
    },
    [scrollX]
  );

  const normalizeLoopPosition = useCallback(
    (offset: number) => {
      if (BASE_LEN < 2) return;

      const idx = Math.round(offset / STEP);

      // Middle copy is [BASE_LEN .. (2*BASE_LEN - 1)]
      if (idx < BASE_LEN) {
        const newOffset = offset + BASE_LEN * STEP;
        jumpToOffset(newOffset);
        return;
      }

      if (idx >= BASE_LEN * 2) {
        const newOffset = offset - BASE_LEN * STEP;
        jumpToOffset(newOffset);
      }
    },
    [BASE_LEN, STEP, jumpToOffset]
  );

  const onMomentumEnd = useCallback(
    (e: any) => {
      const x = e?.nativeEvent?.contentOffset?.x ?? 0;
      normalizeLoopPosition(x);
    },
    [normalizeLoopPosition]
  );

  const fetchJournal = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data: blogs, error: blogsError } = await supabase
        .from("blogs")
        .select("id, title, subtitle, hero_image_url, sort_order")
        .order("sort_order", { ascending: true });

      if (blogsError) {
        setItems([]);
        setErrorMsg(`blogs SELECT failed: ${blogsError.message}`);
        return;
      }

      const blogRows = (blogs ?? []) as BlogRow[];
      if (blogRows.length === 0) {
        setItems([]);
        setErrorMsg(null);
        return;
      }

      const blogIds = blogRows.map((b) => b.id);

      const { data: slides, error: slidesError } = await supabase
        .from("blog_slides")
        .select("blog_id, position, text")
        .in("blog_id", blogIds)
        .order("position", { ascending: true });

      if (slidesError) {
        setItems([]);
        setErrorMsg(`blog_slides SELECT failed: ${slidesError.message}`);
        return;
      }

      const slideRows = (slides ?? []) as SlideRow[];
      const slidesByBlog: Record<string, JournalPage[]> = {};

      for (const s of slideRows) {
        if (!slidesByBlog[s.blog_id]) slidesByBlog[s.blog_id] = [];
        slidesByBlog[s.blog_id].push({ text: s.text ?? "" });
      }

      const mapped: JournalArticle[] = blogRows.map((b) => ({
        id: b.id,
        title: b.title ?? "Untitled",
        subtitle: b.subtitle ?? "",
        imageUri: b.hero_image_url ? String(b.hero_image_url) : FALLBACK_IMAGE_URI,
        pages: slidesByBlog[b.id] ?? [],
      }));

      setItems(mapped);

      const anyPages = mapped.some((m) => m.pages.length > 0);
      if (!anyPages) {
        setErrorMsg("Blogs loaded, but no slides found. Check blog_slides.blog_id matches blogs.id.");
      }
    } catch (e) {
      const msg = asMessage(e);
      setItems([]);
      if (msg.toLowerCase().includes("network request failed")) {
        setErrorMsg("Network request failed: Supabase could not be reached from the device.");
      } else {
        setErrorMsg(`Load failed: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJournal();
  }, [fetchJournal]);

  // Start on the middle copy so you can swipe both directions immediately
  useEffect(() => {
    if (loading) return;
    if (BASE_LEN < 2) return;
    const id = requestAnimationFrame(() => jumpToOffset(INITIAL_OFFSET));
    return () => cancelAnimationFrame(id);
  }, [loading, BASE_LEN, INITIAL_OFFSET, jumpToOffset]);

  const onOpen = useCallback((article: JournalArticle) => setOpenArticle(article), []);
  const onClose = useCallback(() => setOpenArticle(null), []);

  if (loading) {
    return (
      <View style={styles.section}>
        <Header title="Blogs" textColor={t.text} />
        <View style={styles.stateBox}>
          <ActivityIndicator color={t.textMuted} />
          <Text style={[styles.stateText, { color: t.textMuted }]}>Loading Journal…</Text>
        </View>
      </View>
    );
  }

  if (errorMsg && items.length === 0) {
    return (
      <View style={styles.section}>
        <Header title="Blogs" textColor={t.text} />
        <View style={styles.stateBox}>
          <Text style={[styles.stateText, { color: "#7f1d1d" }]}>{errorMsg}</Text>

          <Pressable
            style={[styles.retryBtn, { backgroundColor: t.pillBg, borderColor: t.pillBorder }]}
            onPress={fetchJournal}
          >
            <Text style={[styles.retryText, { color: t.text }]}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.section}>
        <Header title="Blogs" textColor={t.text} />
        <View style={styles.stateBox}>
          <Text style={[styles.stateText, { color: t.textMuted }]}>No journal posts yet.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Header title="Blogs" textColor={t.text} />

      <Animated.FlatList
        ref={(r) => {
          // keep the ref typed for scrollToOffset
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          listRef.current = r as any;
        }}
        data={BASE_LEN >= 2 ? loopData : items}
        keyExtractor={(item, index) => `${item.id}__${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={STEP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: SIDE_INSET }}
        getItemLayout={(_, index) => ({ length: STEP, offset: STEP * index, index })}
        onMomentumScrollEnd={onMomentumEnd}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          const centerOffset = index * STEP;
          const inputRange = [centerOffset - STEP, centerOffset, centerOffset + STEP];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [SIDE_SCALE, CENTER_SCALE, SIDE_SCALE],
            extrapolate: "clamp",
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [SIDE_OPACITY, 1, SIDE_OPACITY],
            extrapolate: "clamp",
          });

          return (
            <View style={{ width: STEP, overflow: "visible" }}>
              <View style={[styles.cardSlot, { height: CARD_H }]}>
                <Animated.View style={{ width: CARD_W, height: CARD_H, opacity, transform: [{ scale }] }}>
                  <Pressable onPress={() => onOpen(item)} style={[styles.card, { width: CARD_W, height: CARD_H }]}>
                    <ImageBackground source={{ uri: item.imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />

                    <LinearGradient
                      colors={[
                        `rgba(0,0,0,${CARD_OVERLAY_TOP})`,
                        `rgba(0,0,0,${CARD_OVERLAY_BOTTOM})`,
                      ]}
                      style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.cardSub} numberOfLines={2}>
                        {item.subtitle}
                      </Text>

                      <View style={styles.cardCtaRow}>
                        <Text style={styles.cardCta}>Explore</Text>
                        <ChevronRight size={16} color="#fff" />
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={!!openArticle} animationType="fade" onRequestClose={onClose} presentationStyle="fullScreen">
        {openArticle ? <ImmersiveStoryArticle article={openArticle} onClose={onClose} /> : null}
      </Modal>
    </View>
  );
}

function Header({ title, textColor }: { title: string; textColor: string }) {
  return (
    <View style={styles.headerWrap}>
      <View style={styles.headerRow}>
        <LinearGradient
          colors={["transparent", "#ffe093", "#c99b32", "#926806"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.headerLine}
        />
        <Text style={[styles.headerText, { color: textColor }]}>{title}</Text>
        <LinearGradient
          colors={["#926806", "#c99b32", "#ffe093", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.headerLine}
        />
      </View>
    </View>
  );
}

function ImmersiveStoryArticle({ article, onClose }: { article: JournalArticle; onClose: () => void }) {
  const [pageIndex, setPageIndex] = useState(0);
  const pan = useRef(new Animated.Value(0)).current;

  const pages = article.pages.length ? article.pages : [{ text: "No slides for this article yet." }];
  const TOP = (Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0) + 12;

  useEffect(() => {
    Animated.timing(pan, {
      toValue: pageIndex,
      duration: 520,
      useNativeDriver: true,
    }).start();
  }, [pageIndex, pan]);

  const goNext = useCallback(() => {
    if (pageIndex < pages.length - 1) setPageIndex((p) => p + 1);
    else onClose();
  }, [pageIndex, pages.length, onClose]);

  const goPrev = useCallback(() => {
    if (pageIndex > 0) setPageIndex((p) => p - 1);
  }, [pageIndex]);

  const translateX = pan.interpolate({
    inputRange: [0, Math.max(1, pages.length - 1)],
    outputRange: [10, -18],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.storyRoot}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={[styles.storyTitleTopWrap, { top: TOP + 40 }]}>
        <Text style={styles.storyTitleTop} numberOfLines={2}>
          {article.title}
        </Text>
      </View>

      <Animated.View style={[styles.storyBgWrap, { transform: [{ scale: 1.18 }, { translateX }] }]}>
        <ImageBackground source={{ uri: article.imageUri }} style={styles.storyBg} resizeMode="cover" />
        <LinearGradient
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          colors={[
            `rgba(0,0,0,${STORY_GRADIENT_TOP})`,
            `rgba(0,0,0,${STORY_GRADIENT_MIDDLE})`,
            `rgba(0,0,0,${STORY_GRADIENT_BOTTOM})`,
          ]}
          locations={[0, 0.5, 1]}
          style={styles.storyOverlay}
        />
      </Animated.View>

      <View style={styles.tapZones} pointerEvents="box-none">
        <Pressable style={styles.tapZone} onPress={goPrev} />
        <Pressable style={styles.tapZone} onPress={goNext} />
      </View>

      <View style={[styles.progressRow, { top: TOP + 10 }]}>
        {pages.map((_, i) => (
          <View key={i} style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: i <= pageIndex ? "100%" : "0%" }]} />
          </View>
        ))}
      </View>

      <Pressable onPress={onClose} style={[styles.closeBtn, { top: TOP + 35 }]}>
        <X size={18} color="#fff" />
      </Pressable>

      <View style={styles.bottomWrap} pointerEvents="none">
        <View style={styles.bottomTextBox}>
          <Text style={styles.storyText}>{pages[pageIndex]?.text ?? ""}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingTop: 36, paddingBottom: 10 },

  headerWrap: { paddingHorizontal: 20, marginBottom: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 },
  headerLine: { height: 2, flex: 1 },
  headerText: { fontSize: 18, fontWeight: "600" },

  stateBox: { paddingHorizontal: 20, paddingVertical: 14, gap: 10 },
  stateText: { fontSize: 12 },

  retryBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  retryText: { fontSize: 12, fontWeight: "600" },

  // IMPORTANT: allow scaled center card to exceed slot without being clipped
  cardSlot: { justifyContent: "center", alignItems: "center", overflow: "visible" },

  card: { borderRadius: 18, overflow: "hidden", backgroundColor: "#000" },
  cardContent: { position: "absolute", left: 16, right: 16, bottom: 34 },
  cardTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8 },
  cardSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 30,
  },
  cardCtaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardCta: { color: "#fff", fontSize: 14, fontWeight: "600" },

  storyRoot: { flex: 1, backgroundColor: "#000" },
  storyBgWrap: { ...StyleSheet.absoluteFillObject },
  storyBg: { width: "100%", height: "100%" },
  storyOverlay: { ...StyleSheet.absoluteFillObject },

  storyTitleTopWrap: {
    position: "absolute",
    left: 18,
    right: 62,
    zIndex: 7,
  },
  storyTitleTop: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },

  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 3,
  },
  tapZone: { flex: 1 },

  progressRow: {
    position: "absolute",
    left: 10,
    right: 10,
    flexDirection: "row",
    gap: 6,
    zIndex: 6,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.28)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#fff" },

  closeBtn: {
    position: "absolute",
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 8,
  },

  bottomWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 80,
    zIndex: 5,
  },
  bottomTextBox: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: "transparent",
  },
  storyText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 15,
    lineHeight: 22,
  },
});
