import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Switch,
  TextInput,
  Image,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  Palette,
  Pencil,
  Settings,
} from "lucide-react-native";

import { useAppTheme, themeTokens } from "../../src/theme/theme";
import { supabase } from "../../src/lib/supabase";

// Supabase Storage source (bucket + path)
const PROFILE_IMAGE_BUCKET = "profile images";
const PROFILE_IMAGE_PATH = "nick-van-der-vegt-4ldc6lB9oBw-unsplash.jpg";

// Fallback (only used if getPublicUrl fails or returns empty)
const FALLBACK_PROFILE_IMAGE =
  "https://olibvhoibsnawrjpubuk.supabase.co/storage/v1/object/public/profile%20images/nick-van-der-vegt-4ldc6lB9oBw-unsplash.jpg";

/** animated number: rolls from 0 -> value */
function AnimatedCount({
  value,
  duration = 520,
  style,
}: {
  value: number;
  duration?: number;
  style?: any;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    anim.stopAnimation();
    anim.setValue(0);
    setShown(0);

    const id = anim.addListener(({ value: v }) => {
      setShown(Math.round(v));
    });

    Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      anim.removeListener(id);
    };
  }, [value, duration, anim]);

  return <Text style={style}>{shown}</Text>;
}

type TileRowProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
};

function TileRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  disabled,
  colors,
}: TileRowProps & {
  colors: ReturnType<typeof themeTokens>;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.tileRow,
        {
          backgroundColor: colors.pillBg,
          borderColor: colors.pillBorder,
        },
        pressed && !disabled ? styles.tileRowPressed : null,
        disabled ? styles.tileRowDisabled : null,
      ]}
    >
      <View
        style={[
          styles.tileRowIcon,
          {
            backgroundColor: colors.pillBg,
            borderColor: colors.pillBorder,
          },
        ]}
      >
        {icon}
      </View>

      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text
          style={[styles.tileRowTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text
            style={[styles.tileRowSub, { color: colors.textMuted }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.tileRowRight}>{right}</View>
    </Pressable>
  );
}

function ProgressTile({
  label,
  value,
  total,
  colors,
  loading,
}: {
  label: string;
  value: number;
  total: number;
  colors: ReturnType<typeof themeTokens>;
  loading: boolean;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    if (loading) {
      fade.setValue(0);
      slide.setValue(6);
      return;
    }

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [loading, fade, slide]);

  return (
    <View style={[styles.progressTile, { backgroundColor: colors.pillBg }]}>
      {loading ? (
        <Text style={[styles.progressValue, { color: colors.textMuted }]}>
          <Text style={[styles.progressValueMain, { color: colors.textMuted }]}>
            —
          </Text>
          <Text
            style={[styles.progressValueTotal, { color: colors.textMuted }]}
          >
            /—
          </Text>
        </Text>
      ) : (
        <Animated.View
          style={{ opacity: fade, transform: [{ translateY: slide }] }}
        >
          <View style={styles.progressInline}>
            <AnimatedCount
              value={value}
              duration={520}
              style={[styles.progressValueMain, { color: colors.text }]}
            />
            <Text style={[styles.progressValueTotal, { color: colors.text }]}>
              /{total}
            </Text>
          </View>
        </Animated.View>
      )}

      <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { isDark, setMode } = useAppTheme();
  const colors = themeTokens(isDark);

  const themeLabel = isDark ? "Dark" : "Light";

  const [guestExpanded, setGuestExpanded] = useState(false);

  const [displayName, setDisplayName] = useState("user");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [progressLoading, setProgressLoading] = useState(true);
  const [articlesRead, setArticlesRead] = useState(0);
  const [articlesTotal, setArticlesTotal] = useState(0);

  const [groupsFinished, setGroupsFinished] = useState(0);
  const [groupsTotal, setGroupsTotal] = useState(0);

  const [packsOwned, setPacksOwned] = useState(0);
  const [packsTotal, setPacksTotal] = useState(3);

  // Notifications toggle (local only)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // profile image URL pulled from Storage bucket (public URL generated at runtime)
  const [profileImageUrl, setProfileImageUrl] = useState<string>(
    FALLBACK_PROFILE_IMAGE
  );

  useEffect(() => {
    const { data } = supabase.storage
      .from(PROFILE_IMAGE_BUCKET)
      .getPublicUrl(PROFILE_IMAGE_PATH);

    const url = data?.publicUrl;
    if (typeof url === "string" && url.length > 0) {
      setProfileImageUrl(url);
    } else {
      setProfileImageUrl(FALLBACK_PROFILE_IMAGE);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;

        const userId = authData?.user?.id;
        if (!userId) {
          if (mounted) setLoadingProfile(false);
          return;
        }

        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("display_name, city, country")
          .eq("id", userId)
          .single();

        if (profErr) throw profErr;

        if (mounted && profile) {
          setDisplayName(profile.display_name ?? "user");
          setCity(profile.city ?? "");
          setCountry(profile.country ?? "");
        }
      } catch {
        // keep local state if anything fails
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadProgress() {
      setProgressLoading(true);
      try {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw authErr;

        const userId = authData?.user?.id;
        if (!userId) {
          if (mounted) setProgressLoading(false);
          return;
        }

        // Total articles
        const { count: totalArticlesCount, error: totalArticlesErr } =
          await supabase
            .from("articles")
            .select("id", { count: "exact", head: true });

        if (!totalArticlesErr && typeof totalArticlesCount === "number") {
          if (mounted) setArticlesTotal(totalArticlesCount);
        }

        // Read articles for user
        const { count: readCount, error: readErr } = await supabase
          .from("user_article_state")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_read", true);

        if (!readErr && typeof readCount === "number") {
          if (mounted) setArticlesRead(readCount);
        }

        // Groups total
        const { count: groupsCount, error: groupsErr } = await supabase
          .from("groups")
          .select("id", { count: "exact", head: true });

        if (!groupsErr && typeof groupsCount === "number") {
          if (mounted) setGroupsTotal(groupsCount);
        }

        // Groups finished (A): all articles in group are read
        const { data: allArticles, error: allArticlesErr } = await supabase
          .from("articles")
          .select("id, group_id");

        if (!allArticlesErr && allArticles) {
          const { data: readRows, error: readRowsErr } = await supabase
            .from("user_article_state")
            .select("article_id")
            .eq("user_id", userId)
            .eq("is_read", true);

          if (!readRowsErr && readRows) {
            const readSet = new Set<string>(
              readRows
                .map((r: any) =>
                  typeof r?.article_id === "string" ? r.article_id : ""
                )
                .filter(Boolean)
            );

            const byGroup = new Map<string, string[]>();
            for (const a of allArticles as any[]) {
              const gid = a?.group_id;
              const aid = a?.id;
              if (!gid || !aid) continue;
              const arr = byGroup.get(String(gid)) ?? [];
              arr.push(String(aid));
              byGroup.set(String(gid), arr);
            }

            let finished = 0;
            for (const [, articleIds] of byGroup.entries()) {
              if (articleIds.length === 0) continue;
              const allRead = articleIds.every((id) => readSet.has(String(id)));
              if (allRead) finished += 1;
            }

            if (mounted) setGroupsFinished(finished);
          }
        }

        // Packs owned from profiles booleans
        const { data: packProfile, error: packProfErr } = await supabase
          .from("profiles")
          .select("has_ride, has_maintain, has_learn")
          .eq("id", userId)
          .single();

        if (!packProfErr && packProfile) {
          const owned =
            (packProfile.has_ride ? 1 : 0) +
            (packProfile.has_maintain ? 1 : 0) +
            (packProfile.has_learn ? 1 : 0);

          if (mounted) {
            setPacksOwned(owned);
            setPacksTotal(3);
          }
        } else {
          if (mounted) {
            setPacksOwned(0);
            setPacksTotal(3);
          }
        }
      } catch {
        // keep existing state on failure
      } finally {
        if (mounted) setProgressLoading(false);
      }
    }

    loadProgress();
    return () => {
      mounted = false;
    };
  }, []);

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;

      const userId = authData?.user?.id;
      if (!userId) return;

      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          city,
          country,
        })
        .eq("id", userId);

      if (upErr) throw upErr;

      setGuestExpanded(false);
    } catch {
      // no UI changes requested on error
    } finally {
      setSavingProfile(false);
    }
  }

  const safeArticlesTotal = useMemo(
    () => Math.max(0, articlesTotal),
    [articlesTotal]
  );
  const safeGroupsTotal = useMemo(() => Math.max(0, groupsTotal), [groupsTotal]);
  const safePacksTotal = useMemo(() => Math.max(0, packsTotal), [packsTotal]);

  return (
    <View style={[styles.root, { backgroundColor: colors.screenBg }]}>
      <LinearGradient
        colors={
          isDark
            ? ["#1E1F22", "#1B1C1F", "#18191C"]
            : ["#FFFFFF", "#FAFAF9", "#F5F5F4"]
        }
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backBtn}
          >
            <ChevronLeft size={20} color={colors.text} />
          </Pressable>

          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Profile
          </Text>

          <View style={{ width: 40 }} />
        </View>

        {/* Tall profile tile */}
        <View
          style={[
            styles.guestTile,
            {
              backgroundColor: colors.pillBg,
              borderColor: colors.pillBorder,
            },
          ]}
        >
          <Image
            source={{ uri: profileImageUrl }}
            resizeMode="cover"
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.guestBottom}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.guestWelcome, { color: "#fff" }]}>
                Welcome {displayName}
              </Text>
              <Text style={styles.guestHint}>Your learning awaits.</Text>
            </View>

            <Pressable
              onPress={() => setGuestExpanded((v) => !v)}
              hitSlop={12}
              style={({ pressed }) => [
                styles.pencilBtn,
                {
                  borderColor: "rgba(255,255,255,0.6)",
                  backgroundColor: "rgba(0,0,0,0.25)",
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Pencil size={16} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Profile editing */}
        {guestExpanded ? (
          <View
            style={[
              styles.guestExpand,
              { backgroundColor: colors.pillBg, borderColor: colors.pillBorder },
            ]}
          >
            <Text style={[styles.editLabel, { color: colors.textMuted }]}>
              Username
            </Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="username"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.screenBg,
                  borderColor: colors.pillBorder,
                },
              ]}
              editable={!loadingProfile && !savingProfile}
            />

            <Text style={[styles.editLabel, { color: colors.textMuted }]}>
              Country
            </Text>
            <TextInput
              value={country}
              onChangeText={setCountry}
              placeholder="country"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.screenBg,
                  borderColor: colors.pillBorder,
                },
              ]}
              editable={!loadingProfile && !savingProfile}
            />

            <Text style={[styles.editLabel, { color: colors.textMuted }]}>
              City
            </Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="city"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.screenBg,
                  borderColor: colors.pillBorder,
                },
              ]}
              editable={!loadingProfile && !savingProfile}
            />

            <Pressable
              onPress={saveProfile}
              disabled={savingProfile || loadingProfile}
              style={({ pressed }) => [
                styles.saveBtn,
                {
                  borderColor: colors.pillBorder,
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.saveBtnText, { color: colors.text }]}>
                Save
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Progress */}
        <View style={styles.progressRow}>
          <ProgressTile
            label="Articles read"
            value={articlesRead}
            total={safeArticlesTotal}
            colors={colors}
            loading={progressLoading}
          />
          <ProgressTile
            label="Groups finished"
            value={groupsFinished}
            total={safeGroupsTotal}
            colors={colors}
            loading={progressLoading}
          />
          <ProgressTile
            label="Packs owned"
            value={packsOwned}
            total={safePacksTotal}
            colors={colors}
            loading={progressLoading}
          />
        </View>

        {/* Preferences */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          Preferences
        </Text>

        <TileRow
          colors={colors}
          icon={<Palette size={18} color={colors.text} />}
          title="Theme"
          subtitle={themeLabel}
          right={
            <Switch
              value={isDark}
              onValueChange={(v) => setMode(v ? "dark" : "light")}
              thumbColor={Platform.OS === "android" ? colors.text : undefined}
              trackColor={{
                false: "rgba(0,0,0,0.15)",
                true: "#f8c331",
              }}
            />
          }
        />

        <TileRow
          colors={colors}
          icon={<Palette size={18} color={colors.text} />}
          title="Notifications"
          subtitle={notificationsEnabled ? "On" : "Off"}
          right={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              thumbColor={Platform.OS === "android" ? colors.text : undefined}
              trackColor={{
                false: "rgba(0,0,0,0.15)",
                true: "#f8c331",
              }}
            />
          }
        />

        {/* Library */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          Library
        </Text>

        <TileRow
          colors={colors}
          icon={<BookOpenCheck size={18} color={colors.text} />}
          title="Reading status"
          subtitle="Read, saved, in-progress"
          right={<ChevronRight size={18} color={colors.textMuted} />}
          onPress={() => router.push("/menu/reading-status")}
        />

        {/* Settings */}
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          Settings
        </Text>

        <TileRow
          colors={colors}
          icon={<Settings size={18} color={colors.text} />}
          title="Settings"
          subtitle="Purchases, privacy, account"
          right={<ChevronRight size={18} color={colors.textMuted} />}
          onPress={() => router.push("/menu/settings")}
        />

        <View style={{ height: 10 }} />
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

  guestTile: {
    height: 280,
    borderRadius: 18,
    borderWidth: 0,
    overflow: "hidden",
    position: "relative",
    marginBottom: 10,
  },

  guestBottom: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  guestWelcome: { fontSize: 18, fontWeight: "900" },
  guestHint: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.8)",
  },

  pencilBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  guestExpand: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 0,
    padding: 14,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 10,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  saveBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 0,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 14, fontWeight: "900" },

  progressRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  progressTile: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  progressInline: { flexDirection: "row", alignItems: "baseline" },
  progressValue: { fontSize: 18 },
  progressValueMain: { fontSize: 18, fontWeight: "900" },
  progressValueTotal: { fontSize: 16, fontWeight: "800" },
  progressLabel: { marginTop: 6, fontSize: 11, lineHeight: 14 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 18,
    marginBottom: 10,
    letterSpacing: 0.2,
  },

  tileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 0,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 0 },
    }),
  },
  tileRowPressed: { opacity: 0.98 },
  tileRowDisabled: { opacity: 0.55 },

  tileRowIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tileRowTitle: { fontSize: 13, fontWeight: "900" },
  tileRowSub: { marginTop: 3, fontSize: 11 },

  tileRowRight: { justifyContent: "center", alignItems: "flex-end" },
});
