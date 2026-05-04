import { usePathname } from "expo-router";
import { useState } from "react";
import { useAppSelector } from "../../store/hooks";
import { FloatingButton } from "./FloatingButton";
import { ChatPanel } from "./ChatPanel";

const ALLOW_PATHS = (path: string): boolean => {
  if (path === "/" || path === "" || path === "/(tabs)") return true;
  if (path.startsWith("/quiz/") && !path.endsWith("/results")) return true;
  if (path === "/quiz") return false;
  if (path === "/exam/play") return true;
  return false;
};

export function RuleConstructor() {
  const pathname = usePathname();
  const isAuthed = useAppSelector((s) => s.auth.isAuthenticated);
  const [open, setOpen] = useState(false);

  if (!isAuthed) return null;
  if (!ALLOW_PATHS(pathname || "")) return null;

  return (
    <>
      <FloatingButton onPress={() => setOpen(true)} />
      <ChatPanel visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
