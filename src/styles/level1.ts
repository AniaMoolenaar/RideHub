// src/styles/level1.ts
import { StyleSheet } from "react-native";
import { SPACING } from "./ui";

export const L1 = StyleSheet.create({
  /* ===============================
     SCREEN + SCROLL
  =============================== */

  screen: {
    flex: 1,
  },

  scrollContent40: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  scrollContent24: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  /* ===============================
     COMMON WRAPS
  =============================== */

  relativeWrap: {
    position: "relative",
  },

  sectionWrap: {
    paddingHorizontal: SPACING.screenPadding,
  },

  sectionTop38: {
    paddingTop: 38,
  },

  centerIntroText: {
    textAlign: "center",
    marginBottom: 38,
  },

  /* ===============================
     HOME SEARCH POPUP
  =============================== */

  searchPopup: {
    marginHorizontal: 20,
    marginTop: 2,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },

  searchPopupHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  searchMetaText: {
    fontSize: 12,
  },

  searchClearText: {
    fontSize: 12,
  },

  searchLoadingWrap: {
    padding: 12,
  },

  hitRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
  },

  hitTitle: {
    fontSize: 14,
  },

  hitSub: {
    fontSize: 11,
    marginTop: 3,
  },

  noMatchesWrap: {
    padding: 12,
    borderTopWidth: 1,
  },

  noMatchesText: {
    fontSize: 12,
  },

  /* ===============================
     LEVEL 1 TILE OVERLAY (MASONRY)
  =============================== */

  fadeWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "40%",
    overflow: "hidden",
  },

  sparklePos: {
    position: "absolute",
    right: 12,
    bottom: 12,
  },

  bottomLabelPos: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
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

  gutterSpacer: {
    width: SPACING.gutter,
  },
});
