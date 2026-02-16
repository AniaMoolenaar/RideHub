/**
 * DESIGN METRICS
 * Numbers only.
 * No colors here.
 * No layout here.
 */

export const RADII = {
  circle: 999,        // back buttons
  tileL2: 18,         // Level 2 tiles
  cardL3: 16,         // Level 3 article cards
  button: 16,         // action / CTA buttons
  uiCard: 12,         // existing UI.card radius (Level 1)
  label: 8,           // bottom label radius
} as const;

export const SIZES = {
  backButton: 40,
  actionButtonHeight: 46,
  labelHeight: 36,
} as const;

export const BORDERS = {
  thin: 1,
  none: 0,
} as const;
