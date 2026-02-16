// src/styles/level2.ts
import { StyleSheet, Platform } from "react-native";

export const L2 = StyleSheet.create({
  /* ===============================
     STRUCTURE
  =============================== */

  contentWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  sectionHeaderWrap: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  disclaimerWrap: {
    paddingBottom: 40,
  },

  /* ===============================
     LIST SPACING
  =============================== */

  listWrap: {
    gap: 12,
  },

  lockedWrap: {
    gap: 14,
  },

  topicsMetaWrap: {
    marginTop: 12,
  },

  topicsList: {
    marginTop: 8,
    gap: 6,
  },

  /* ===============================
     HEADER
  =============================== */

  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
  },

  sectionTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    marginHorizontal: 10,
  },

  headerSpacer: {
    width: 40,
  },

  /* ===============================
     ARTICLE TILE
  =============================== */

  tile: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.10,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 0 },
    }),
  },

  tileTitle: {
    fontSize: 17,
    fontWeight: "800",
  },

  tileSub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 19,
  },

  smallHeading: {
    fontSize: 13,
    fontWeight: "800",
  },

  bullet: {
    fontSize: 13,
    lineHeight: 18,
  },

  /* ===============================
     CTA
  =============================== */

  ctaOuter: {
    marginTop: 16,
    height: 46,
    borderRadius: 16,
    overflow: "hidden",
  },

  ctaInner: {
    flex: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  ctaText: {
    fontSize: 13,
    fontWeight: "900",
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
