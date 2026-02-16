// src/styles/level3.ts
import { StyleSheet, Platform } from "react-native";

export const L3_SECTION_GAP = 14;

export const L3 = StyleSheet.create({
  /* ===============================
     HEADER
  =============================== */

  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    marginHorizontal: 14,
    lineHeight: 20,
  },

  headerSpacer: {
    width: 40,
  },

  /* ===============================
     ARTICLE CARD
  =============================== */

  articleWrap: {
    paddingHorizontal: 16,
  },

  sectionWrap: {},

  card: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 0 },
    }),
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },

  /* ===============================
     ACTIONS
  =============================== */

  actionsWrap: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },

  actionBtnOuter: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    overflow: "hidden",
  },

  actionBtnInner: {
    flex: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  actionText: {
    fontSize: 13,
    fontWeight: "900",
  },

  loginHint: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.9,
  },

  /* ===============================
     UTILITIES
  =============================== */

  absoluteFill: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});
