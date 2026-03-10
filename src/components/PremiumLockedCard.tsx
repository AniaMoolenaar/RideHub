import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  title: string;
  description: string;
  topics?: string[];
  onPress: () => void;
  goldGradient: readonly [string, string, ...string[]] | readonly string[];
  goldTextOn: string;
  pillBg: string;
  pillBorder: string;
  text: string;
  textMuted: string;
  styles: {
    tile: any;
    tileTitle: any;
    tileSub: any;
    topicsMetaWrap: any;
    smallHeading: any;
    topicsList: any;
    bullet: any;
    ctaOuter: any;
    absoluteFill: any;
    ctaInner: any;
    ctaText: any;
  };
};

export default function PremiumLockedCard({
  title,
  description,
  topics = [],
  onPress,
  goldGradient,
  goldTextOn,
  pillBg,
  pillBorder,
  text,
  textMuted,
  styles,
}: Props) {
  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: pillBg,
          borderColor: pillBorder,
          borderWidth: 1,
        },
      ]}
    >
      <Text style={[styles.tileTitle, { color: text }]}>{title}</Text>

      <Text style={[styles.tileSub, { color: textMuted }]}>{description}</Text>

      {topics.length ? (
        <View style={styles.topicsMetaWrap}>
          <Text style={[styles.smallHeading, { color: text }]}>Topics included</Text>

          <View style={styles.topicsList}>
            {topics.slice(0, 8).map((topic, index) => (
              <Text key={`${topic}-${index}`} style={[styles.bullet, { color: textMuted }]}>
                • {topic}
              </Text>
            ))}
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.ctaOuter, { opacity: pressed ? 0.92 : 1 }]}
      >
        <LinearGradient
          colors={goldGradient as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.absoluteFill}
        />
        <View style={styles.ctaInner}>
          <Text style={[styles.ctaText, { color: goldTextOn }]}>Browse Premium Packs</Text>
        </View>
      </Pressable>
    </View>
  );
}