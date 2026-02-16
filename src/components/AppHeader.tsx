import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import { useAppTheme, themeTokens } from "../theme/theme";

type Props = {
  title?: string;
  subtitle?: string;
  subtitleOnly?: boolean;
  right?: React.ReactNode;
  onBackPress?: () => void;
};

export default function AppHeader({
  title,
  subtitle,
  subtitleOnly,
  right,
  onBackPress,
}: Props) {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const t = themeTokens(isDark);

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Pressable
        onPress={onBackPress ?? (() => router.back())}
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 0,
        }}
        hitSlop={10}
      >
        <ChevronLeft size={18} color={t.text} />
      </Pressable>

      {subtitleOnly ? (
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 18,
            fontWeight: "800",
            marginHorizontal: 14,
            lineHeight: 20,
            color: t.text,
          }}
          numberOfLines={2}
        >
          {subtitle ?? ""}
        </Text>
      ) : (
        <View style={{ flex: 1, marginHorizontal: 14 }}>
          <Text
            style={{
              textAlign: "center",
              fontSize: 18,
              fontWeight: "800",
              lineHeight: 20,
              color: t.text,
            }}
            numberOfLines={1}
          >
            {title ?? ""}
          </Text>

          {!!subtitle ? (
            <Text
              style={{
                marginTop: 4,
                textAlign: "center",
                color: t.text,
                opacity: 0.9,
              }}
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      )}

      {right ? <View>{right}</View> : <View style={{ width: 40 }} />}
    </View>
  );
}
