import { colorScheme } from "nativewind";
import { Platform } from "react-native";
import { storage } from "./storage";

const KEY = "theme_mode";

export type ThemeMode = "light" | "dark";

// On web, Tailwind's `darkMode: "class"` compiles every `dark:` utility behind
// a `.dark` selector. NativeWind's `colorScheme.set` updates its observable
// (re-rendering hooks like `useColorScheme`) but does not toggle that class on
// the document, so the CSS never matches. Apply it manually.
function applyWebClass(mode: ThemeMode): void {
  if (Platform.OS !== "web") return;
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (mode === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export async function loadThemeMode(): Promise<void> {
  const stored = await storage.getItem(KEY);
  const mode: ThemeMode = stored === "dark" ? "dark" : "light";
  colorScheme.set(mode);
  applyWebClass(mode);
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  colorScheme.set(mode);
  applyWebClass(mode);
  await storage.setItem(KEY, mode);
}
