export const lightTheme = {
  // existing themeTokens() values
  screenBg: "#FFFFFF",
  text: "#111111",
  textMuted: "rgba(17,17,17,0.60)",
  pillBg: "#F2F2F2",
  pillBorder: "rgba(0,0,0,0.08)",
  ownershipTimelineLine: "rgba(0,0,0,0.12)",

  // article screen values
  articleText: "rgba(17,17,17,0.86)",
  articleCardBg: "#fafaf9",
  articleCardBorder: "rgba(0,0,0,0.08)",

  tileFadeFrom: "rgba(0,0,0,0.8)",
  tileFadeTo: "transparent",

  goldGradient: ["#926806", "#d4b463", "#ffe093"] as const,
  goldTextOn: "#07110E",

  premiumSparkle: "#f8c331",

  bottomLabelBg: "rgba(0,0,0,0.50)",
  bottomLabelText: "#FFFFFF",

  // UI.ts bridge values (kept identical for zero visual change)
  background: "#1E1F22",
  surface: "#FFFFFF",
  divider: "#E6E8EA",

  textPrimary: "#FAFAF8",
  textMutedUi: "#5E6066",

  premiumBase: "#9B8552",
  premiumInner: "rgba(237, 230, 214, 0.35)",
  premiumSpec: "rgba(250, 249, 246, 0.18)",

  premiumBadgeBg: "rgba(255,255,255,0.70)",
  premiumBadgeBorder: "rgba(255,255,255,0.25)",

  shadowColor: "#000",
} as const;

export type LightTheme = typeof lightTheme;
