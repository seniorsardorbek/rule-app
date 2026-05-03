import { useColorScheme } from "nativewind";

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryDeep: string;
  primarySoft: string;
  primaryGlow: string;
  info: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerDeep: string;
  dangerSoft: string;
  bg: string;
  surface: string;
  surfaceSoft: string;
  border: string;
  ink: string;
  inkMid: string;
  inkMuted: string;
  inkDim: string;
}

export const lightColors: ThemeColors = {
  primary: "#0088FF",
  primaryDark: "#006FD1",
  primaryDeep: "#0064D6",
  primarySoft: "#E6F3FF",
  primaryGlow: "rgba(0,136,255,0.18)",
  info: "#00C0E8",
  success: "#34C759",
  successSoft: "#E8F9EC",
  warning: "#FFCC00",
  warningSoft: "#FFF9E6",
  danger: "#F56F72",
  dangerDeep: "#E5484D",
  dangerSoft: "#FEECED",

  bg: "#F4F6FB",
  surface: "#FFFFFF",
  surfaceSoft: "#F4F6FB",
  border: "rgba(15,25,55,0.08)",

  ink: "#100910",
  inkMid: "#3B4252",
  inkMuted: "#BEBEBE",
  inkDim: "#AFB7C7",
};

export const darkColors: ThemeColors = {
  primary: "#3B9EFF",
  primaryDark: "#0088FF",
  primaryDeep: "#0064D6",
  primarySoft: "rgba(59,158,255,0.16)",
  primaryGlow: "rgba(59,158,255,0.45)",
  info: "#00C0E8",
  success: "#3DD693",
  successSoft: "rgba(61,214,147,0.16)",
  warning: "#FFCC4D",
  warningSoft: "rgba(255,204,77,0.16)",
  danger: "#FF6B6F",
  dangerDeep: "#E5484D",
  dangerSoft: "rgba(255,107,111,0.16)",

  bg: "#0A0E1A",
  surface: "#161B2E",
  surfaceSoft: "#1A2138",
  border: "rgba(255,255,255,0.08)",

  ink: "#F2F4FA",
  inkMid: "#C7CEDB",
  inkMuted: "#7B86A8",
  inkDim: "#5C667C",
};

// Static export — keep for backward-compat with code that imports `colors` directly.
// For mode-aware values use `useThemeColors()`.
export const colors = lightColors;

export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark" ? darkColors : lightColors;
}

export type ColorName = keyof ThemeColors;
