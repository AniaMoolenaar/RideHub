import { useMemo } from "react";
import { Platform, StyleSheet } from "react-native";
import { useAppTheme } from "../theme/theme";
import { getDesign } from "../theme/design";

/**
 * Keep SPACING export unchanged (so no layout changes).
 */
export const SPACING = {
  screenPadding: 16,
  gutter: 15,
  radius: 12,
  labelRadius: 8,
  labelHeight: 36,
} as const;

/**
 * Internal: create styles from theme values.
 */
function makeUI(d: ReturnType<typeof getDesign>) {
  return StyleSheet.create({
    screen: {
      backgroundColor: d.background,
    },

    centerText: {
      textAlign: "center",
      color: d.textPrimary,
    },

    mutedText: {
      color: d.textMutedUi,
    },

    gridRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },

    card: {
      borderRadius: SPACING.radius,
      overflow: "hidden",
      backgroundColor: d.surface,
      ...Platform.select({
        ios: {
          shadowColor: d.shadowColor,
          shadowOpacity: 0.05,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 8 },
        },
        android: { elevation: 1 },
        default: {},
      }),
    },

    cardFree: {
      borderWidth: 0,
      borderColor: d.divider,
    },

    cardPremium: {
      borderWidth: 0,
      borderColor: d.premiumBase,
    },

    pressed: {
      opacity: 0.98,
      transform: [{ scale: 0.996 }],
    },

    imageFill: {
      flex: 1,
    },

    imageRadius: {},

    premiumInnerEdge: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      borderRadius: SPACING.radius,
      borderWidth: 1,
      borderColor: d.premiumInner,
    },

    premiumSpecHit: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 10,
      backgroundColor: d.premiumSpec,
    },

    premiumBadge: {
      position: "absolute",
      top: 10,
      right: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 4,
      backgroundColor: d.premiumBadgeBg,
      borderWidth: 0,
      borderColor: d.premiumBadgeBorder,
    },

    premiumBadgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: d.textPrimary,
    },

    bottomLabel: {
      position: "absolute",
      left: 10,
      right: 10,
      bottom: 10,
      height: SPACING.labelHeight,
      borderRadius: SPACING.labelRadius,
      paddingHorizontal: 10,
      justifyContent: "center",
      backgroundColor: d.bottomLabelBg,
    },

    bottomLabelText: {
      fontSize: 12,
      fontWeight: "700",
      color: d.bottomLabelText,
      lineHeight: 15,
    },
  });
}

/**
 * Public: theme-aware UI styles
 */
export function useUI() {
  const { isDark } = useAppTheme();
  const d = getDesign(isDark);

  // regenerate when theme flips
  return useMemo(() => makeUI(d), [d]);
}
