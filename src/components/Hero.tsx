import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  Text,
  Pressable,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Menu } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { supabase } from "../lib/supabase";

type HeroConfigRow = {
  media_type: "image" | "video" | null;
  media_url: string | null;
  poster_url: string | null;
  offset_y: number | null;
  offset_x: number | null;
  scale: number | null;
};

type HeroConfig = {
  media_type: "image" | "video";
  media_url: string;
  poster_url: string | null;
  offset_y: number;
  offset_x: number;
  scale: number;
};

type SectionCopyRow = {
  hero_title: string | null;
  hero_subtitle: string | null;
};

type Props = {
  title?: string;
  subtitle?: string;
  variant?: "home" | "default";
  screen: "home" | "ride" | "learn" | "maintain" | "premium" | "menu";
  onPressMenu?: () => void;
  showSparkles?: boolean;
  onPressSparkles?: () => void;
  hideSubtitleVisual?: boolean;
};

function normaliseHeroConfig(row: HeroConfigRow | null): HeroConfig | null {
  if (!row?.media_url) return null;

  return {
    media_type: row.media_type === "video" ? "video" : "image",
    media_url: row.media_url,
    poster_url: row.poster_url ?? null,
    offset_y: typeof row.offset_y === "number" ? row.offset_y : 0,
    offset_x: typeof row.offset_x === "number" ? row.offset_x : 0,
    scale: typeof row.scale === "number" && row.scale > 0 ? row.scale : 1,
  };
}

export default function Hero({
  title,
  subtitle,
  variant = "default",
  screen,
  onPressMenu,
  hideSubtitleVisual = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const heroHeight = variant === "home" ? 480 : 280;
  const topPad = insets.top + 20;

  const [config, setConfig] = useState<HeroConfig | null>(null);
  const [dbTitle, setDbTitle] = useState<string | null>(null);
  const [dbSubtitle, setDbSubtitle] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadHero() {
      const [{ data: heroData, error: heroError }, { data: sectionData, error: sectionError }] =
        await Promise.all([
          supabase
            .from("hero_images")
            .select("media_type, media_url, poster_url, offset_y, offset_x, scale")
            .eq("screen", screen)
            .maybeSingle<HeroConfigRow>(),
          supabase
            .from("sections")
            .select("hero_title, hero_subtitle")
            .eq("slug", screen)
            .maybeSingle<SectionCopyRow>(),
        ]);

      if (!isActive) return;

      if (heroError) {
        setConfig(null);
      } else {
        setConfig(normaliseHeroConfig(heroData ?? null));
      }

      if (sectionError) {
        setDbTitle(null);
        setDbSubtitle(null);
      } else {
        setDbTitle(sectionData?.hero_title ?? null);
        setDbSubtitle(sectionData?.hero_subtitle ?? null);
      }
    }

    loadHero();

    return () => {
      isActive = false;
    };
  }, [screen]);

  const openMenu = () => {
    onPressMenu?.();
    router.push("/menu/menu");
  };

  const mediaStyle = useMemo(
    () => [
      styles.media,
      {
        transform: [
          { translateX: config?.offset_x ?? 0 },
          { translateY: config?.offset_y ?? 0 },
          { scale: config?.scale ?? 1 },
        ],
      },
    ],
    [config]
  );

  const videoPlayer = useVideoPlayer(
    config?.media_type === "video" ? config.media_url : null,
    (player) => {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  );

  const resolvedTitle = title ?? dbTitle ?? undefined;
  const resolvedSubtitle = subtitle ?? dbSubtitle ?? undefined;
  const hasSubtitle = !!resolvedSubtitle?.trim();

  return (
    <View style={[styles.outer, { height: heroHeight }]}>
      <View style={styles.inner}>
        {config?.media_type === "image" ? (
          <Image
            source={{ uri: config.media_url }}
            resizeMode="cover"
            style={mediaStyle}
          />
        ) : null}

        {config?.media_type === "video" && videoPlayer ? (
          <VideoView
            player={videoPlayer}
            style={mediaStyle}
            nativeControls={false}
            contentFit="cover"
            allowsFullscreen={false}
            allowsPictureInPicture={false}
          />
        ) : null}

        <LinearGradient
          colors={[
            "rgba(0,0,0,0.08)",
            "rgba(0,0,0,0.18)",
            "rgba(0,0,0,0.70)",
          ]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.topRow, { paddingTop: topPad }]}>
          <View style={styles.topSlot}>
            <Pressable hitSlop={12} onPress={openMenu} style={styles.iconBtn}>
              <Menu color="#fff" size={22} />
            </Pressable>
          </View>

          <View style={[styles.topSlot, styles.centerSlot]}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>RIDEHUB</Text>
            </View>
          </View>

          <View style={styles.topSlot}>
            <View style={{ width: 38, height: 38 }} />
          </View>
        </View>

        {resolvedTitle || resolvedSubtitle ? (
          <View style={styles.bottomTextWrap}>
            {!!resolvedTitle ? <Text style={styles.title}>{resolvedTitle}</Text> : null}

            {hasSubtitle ? (
              <Text
                style={[
                  styles.subtitle,
                  hideSubtitleVisual && styles.subtitleHidden,
                ]}
              >
                {resolvedSubtitle}
              </Text>
            ) : null}
          </View>
        ) : null}

        <LinearGradient
          colors={["#926806", "#ffe093", "#c99b32", "#8a6000"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.divider}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: "100%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  inner: {
    flex: 1,
  },

  media: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "110%",
  },

  topRow: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  topSlot: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
  },

  centerSlot: {
    flex: 1,
  },

  iconBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.14,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 0,
      },
    }),
  },

  logoBox: {
    borderColor: "#fff",
    borderWidth: 3.5,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },

  logoText: {
    color: "#fff",
    letterSpacing: 3,
    fontWeight: "600",
    fontSize: 18,
  },

  bottomTextWrap: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 36,
    alignItems: "center",
    zIndex: 20,
  },

  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
  },

  subtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    textAlign: "center",
    maxWidth: 340,
    marginBottom: 30,
  },

  subtitleHidden: {
    opacity: 0,
  },

  divider: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    zIndex: 50,
  },
});