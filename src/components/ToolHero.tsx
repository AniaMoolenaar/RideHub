import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

type HeroConfig = {
  image_url: string;
  offset_y: number;
  offset_x: number;
  scale: number;
};

type ToolHeroScreen =
  | "home"
  | "ride"
  | "learn"
  | "maintain"
  | "premium"
  | "menu"
  | "Maintenance-tool";

type Props = {
  title?: string;
  subtitle?: string;

  screen: ToolHeroScreen;

  height?: number;
};

export default function ToolHero({
  title,
  subtitle,
  screen,
  height = 220,
}: Props) {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + 20;

  const [config, setConfig] = useState<HeroConfig | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase
      .from("hero_images")
      .select("image_url, offset_y, offset_x, scale")
      .eq("screen", screen)
      .single()
      .then(({ data }) => {
        if (mounted && data) setConfig(data);
      });

    return () => {
      mounted = false;
    };
  }, [screen]);

  return (
    <View style={[styles.outer, { height }]}>
      <View style={styles.inner}>
        {config && (
          <Image
            source={{ uri: config.image_url }}
            resizeMode="cover"
            style={[
              styles.image,
              {
                transform: [
                  { translateX: config.offset_x },
                  { translateY: config.offset_y },
                  { scale: config.scale },
                ],
              },
            ]}
          />
        )}

        <LinearGradient
          colors={[
            "rgba(0,0,0,0.08)",
            "rgba(0,0,0,0.18)",
            "rgba(0,0,0,0.70)",
          ]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.topRow, { paddingTop: topPad }]} />

        {(title || subtitle) && (
          <View style={styles.bottomTextWrap}>
            {!!title && <Text style={styles.title}>{title}</Text>}
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        )}

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
  inner: { flex: 1 },

  image: {
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
  },

  bottomTextWrap: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 70,
    alignItems: "center",
    zIndex: 20,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    textAlign: "center",
    maxWidth: 340,
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
