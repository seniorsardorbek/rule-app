/**
 * Brand palette — mirror of the tokens in tailwind.config.js.
 * Use these when you can't pass a className: Ionicons `color`, StyleSheet
 * shadowColor, ActivityIndicator `color`, status-bar tint, etc.
 */
export const colors = {
  primary: "#0088FF",
  primaryDark: "#006FD1",
  info: "#00C0E8",
  success: "#34C759",
  warning: "#FFCC00",
  danger: "#F56F72",
  ink: "#100910",
  inkMuted: "#BEBEBE",
  surface: "#FFFFFF",
} as const;

export type ColorName = keyof typeof colors;
