export const darkTheme = {
  // existing themeTokens()
  screenBg: "#1E1F22",
  text: "#FAFAF8",
  textMuted: "rgba(250,250,248,0.62)",
  pillBg: "rgba(250,250,248,0.06)",
  pillBorder: "rgba(250,250,248,0.10)",

  // values currently hard-coded in Level 1/2/3 screens
  articleText: "rgba(250,250,248,0.82)",
  articleCardBg: "rgba(255,255,255,0.06)",
  articleCardBorder: "rgba(255,255,255,0.10)",

  tileFadeFrom: "rgba(0,0,0,0.8)",
  tileFadeTo: "transparent",

  goldGradient: ["#926806", "#d4b463", "#ffe093"] as const,
  goldTextOn: "#07110E",

  premiumSparkle: "#f8c331",

  bottomLabelBg: "rgba(0,0,0,0.50)",
  bottomLabelText: "#FFFFFF",

  // values currently in src/styles/ui.ts
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

export type DarkTheme = typeof darkTheme;
