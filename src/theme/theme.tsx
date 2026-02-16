import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDesign } from "./design";

export type AppThemeMode = "dark" | "light";

type ThemeContextValue = {
  mode: AppThemeMode;
  isDark: boolean;
  setMode: (next: AppThemeMode) => Promise<void>;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "ridehub:theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppThemeMode>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!alive) return;

        if (saved === "light" || saved === "dark") {
          setModeState(saved);
        } else {
          setModeState("dark");
        }
      } catch {
        if (!alive) return;
        setModeState("dark");
      } finally {
        if (alive) setReady(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const setMode = async (next: AppThemeMode) => {
    setModeState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      isDark: mode === "dark",
      setMode,
      toggle: () => setMode(mode === "dark" ? "light" : "dark"),
    }),
    [mode]
  );

  if (!ready) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used inside ThemeProvider");
  return ctx;
}

/**
 * LEGACY BRIDGE (SAFE MODE)
 * Only return the original 5 keys used everywhere.
 * Anything else must come from: const d = getDesign(isDark)
 */
export function themeTokens(isDark: boolean) {
  const d = getDesign(isDark);

  return {
    screenBg: d.screenBg,
    text: d.text,
    textMuted: d.textMuted,
    pillBg: d.pillBg,
    pillBorder: d.pillBorder,
  };
}
