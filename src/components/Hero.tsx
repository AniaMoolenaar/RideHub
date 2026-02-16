import React, { useEffect, useState } from "react";
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
import { supabase } from "../lib/supabase";

type HeroConfig = {
  image_url: string;
  offset_y: number;
  offset_x: number;
  scale: number;
};

type Props = {
  title?: string;
  subtitle?: string;
  variant?: "home" | "default";
  screen: "home" | "ride" | "learn" | "maintain" | "premium" | "menu";

  onPressMenu?: () => void;
  showSparkles?: boolean;
  onPressSparkles?: () => void;
};

export default function Hero({
  title,
  subtitle,
  variant = "default",
  screen,
  onPressMenu,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const heroHeight = variant === "home" ? 480 : 280;
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

  const openMenu = () => {
    onPressMenu?.();
    router.push("/menu/menu");
  };

  return (
    <View style={[styles.outer, { height: heroHeight }]}>
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

        {/* Top bar */}
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

          {/* sparkles removed */}
          <View style={styles.topSlot}>
            <View style={{ width: 38, height: 38 }} />
          </View>
        </View>

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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  topSlot: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  centerSlot: { flex: 1 },

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
      android: { elevation: 0 },
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
    fontSize: 14,
    textAlign: "center",
    maxWidth: 340,
    marginBottom: 30,
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
