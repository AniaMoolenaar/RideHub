import { darkTheme } from "./dark-theme";
import { lightTheme } from "./light-theme";

export function getDesign(isDark: boolean) {
  return isDark ? darkTheme : lightTheme;
}
