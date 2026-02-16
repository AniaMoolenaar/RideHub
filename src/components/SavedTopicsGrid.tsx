import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  useWindowDimensions,
} from "react-native";
import { Bookmark } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAppTheme, themeTokens } from "../theme/theme";

export type Topic = {
  id: string;
  title: string;
  image?: any; // local require(...)
  image_url?: string | null; // remote URL
  saved?: boolean;
};

type Props = {
  items?: Topic[];
  onTopicPress?: (topic: Topic) => void;
  title?: string;
  horizontalPadding?: number;
  gap?: number;
  tileHeight?: number;
};

export default function SavedTopicsGrid({
  items = [],
  onTopicPress,
  title = "Your Saved Topics",
  horizontalPadding = 20,
  gap = 12,
  tileHeight = 175,
}: Props) {
  const { width } = useWindowDimensions();

  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);

  const layout = useMemo(() => {
    // Keep it stable + safe across small screens
    const innerW = Math.max(0, width - horizontalPadding * 2);
    const tileW = Math.max(140, Math.floor((innerW - gap) / 2));
    return { tileW, innerW };
  }, [width, horizontalPadding, gap]);

  const savedItems = useMemo(
    () => items.filter((i) => i.saved === true),
    [items]
  );

  return (
    <View style={[styles.section, { paddingHorizontal: horizontalPadding }]}>
      <Header title={title} textColor={t.text} />

      {!savedItems.length ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: t.pillBg,
              borderColor: t.pillBorder,
            },
          ]}
        >
          <Bookmark size={20} color={t.textMuted} />
          <Text style={[styles.emptyTitle, { color: t.text }]}>
            No saved topics yet
          </Text>
          <Text style={[styles.emptyBody, { color: t.textMuted }]}>
            Save articles as you read and they’ll appear here for quick access.
          </Text>
        </View>
      ) : (
        <View style={[styles.grid, { gap }]}>
          {savedItems.map((item) => {
            const source = getImageSource(item);

            return (
              <Pressable
                key={item.id}
                onPress={() => onTopicPress?.(item)}
                style={[
                  styles.tile,
                  { width: layout.tileW, height: tileHeight },
                ]}
              >
                {source ? (
                  <ImageBackground
                    source={source}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={[
                      // keep your fallback but slightly theme-aware
                      isDark ? "#141517" : "#F2F2F3",
                      isDark ? "#232428" : "#E7E7EA",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}

                <LinearGradient
                  colors={[
                    "rgba(0,0,0,0.00)",
                    "rgba(0,0,0,0.18)",
                    "rgba(0,0,0,0.50)",
                  ]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                <View
                  style={[
                    styles.tileLabel,
                    {
                      backgroundColor: isDark
                        ? "rgba(0,0,0,0.42)"
                        : "rgba(0,0,0,0.34)",
                    },
                  ]}
                >
                  <Text style={styles.tileTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function getImageSource(item: Topic) {
  if (item.image_url && item.image_url.trim().length)
    return { uri: item.image_url };
  if (item.image) return item.image;
  return null;
}

function Header({ title, textColor }: { title: string; textColor: string }) {
  return (
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
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 16,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  headerLine: { height: 2, flex: 1 },
  headerText: { fontSize: 18, fontWeight: "600" },

  emptyCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: "600" },
  emptyBody: { fontSize: 13, textAlign: "center" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  tile: {
    borderRadius: 16,
    overflow: "hidden",
  },

  tileLabel: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
  },

  tileTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
});
