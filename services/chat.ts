import { useEffect, useReducer, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import Constants from "expo-constants";
import { storage } from "./storage";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  question_id?: string | null;
  created_at?: string;
  pending?: boolean;
}

interface State {
  status: "idle" | "connecting" | "connected" | "error" | "disconnected";
  messages: ChatMessage[];
  inFlightId: string | null;
}

type Action =
  | { type: "status"; status: State["status"] }
  | { type: "history"; messages: ChatMessage[] }
  | { type: "appendUser"; msg: ChatMessage }
  | { type: "startAssistant"; id: string }
  | { type: "chunk"; id: string; delta: string }
  | { type: "done"; id: string; full: string; created_at?: string }
  | { type: "error"; id: string | null }
  | { type: "clearLocal" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "status":
      return { ...state, status: action.status };
    case "history":
      return { ...state, messages: action.messages };
    case "appendUser":
      return { ...state, messages: [...state.messages, action.msg] };
    case "startAssistant":
      return {
        ...state,
        inFlightId: action.id,
        messages: [
          ...state.messages,
          { id: action.id, role: "assistant", content: "", pending: true },
        ],
      };
    case "chunk":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, content: m.content + action.delta } : m,
        ),
      };
    case "done":
      return {
        ...state,
        inFlightId: null,
        messages: state.messages.map((m) =>
          m.id === action.id
            ? { ...m, content: action.full, pending: false, created_at: action.created_at }
            : m,
        ),
      };
    case "error":
      return {
        ...state,
        inFlightId: null,
        messages: action.id
          ? state.messages.filter((m) => m.id !== action.id)
          : state.messages,
        status: "error",
      };
    case "clearLocal":
      return { ...state, messages: [] };
    default:
      return state;
  }
}

function deriveBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/api\/?$/, "");
  const hostUri = Constants.expoConfig?.hostUri;
  const localIp = hostUri ? hostUri.split(":")[0] : "localhost";
  return `http://${localIp}:4000`;
}

let sharedSocket: Socket | null = null;
let sharedLang: string | null = null;

async function getSocket(lang: string): Promise<Socket | null> {
  if (sharedSocket && sharedSocket.connected && sharedLang === lang) {
    return sharedSocket;
  }
  const token = await storage.getItem("access_token");
  if (!token) return null;
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }
  const base = deriveBaseUrl();
  sharedLang = lang;
  sharedSocket = io(`${base}/chat`, {
    transports: ["websocket"],
    auth: { token, lang },
    reconnection: true,
    reconnectionAttempts: 5,
  });
  return sharedSocket;
}

export function disconnectChat(): void {
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
    sharedLang = null;
  }
}

export interface UseChatOptions {
  enabled: boolean;
  lang: string;
}

export function useChat({ enabled, lang }: UseChatOptions) {
  const [state, dispatch] = useReducer(reducer, {
    status: "idle",
    messages: [],
    inFlightId: null,
  });
  const socketRef = useRef<Socket | null>(null);
  const assistantIdRef = useRef<string | null>(null);
  const tempIdCounter = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      dispatch({ type: "status", status: "connecting" });
      const sock = await getSocket(lang);
      if (cancelled || !sock) {
        dispatch({ type: "status", status: "error" });
        return;
      }
      socketRef.current = sock;

      const onConnect = () => dispatch({ type: "status", status: "connected" });
      const onDisconnect = () =>
        dispatch({ type: "status", status: "disconnected" });
      const onHistory = (rows: ChatMessage[]) =>
        dispatch({ type: "history", messages: rows ?? [] });
      const onChunk = ({ msgId, delta }: { msgId: string; delta: string }) => {
        const targetId = assistantIdRef.current ?? msgId;
        dispatch({ type: "chunk", id: targetId, delta });
      };
      const onDone = ({
        msgId,
        full,
        created_at,
      }: {
        msgId: string;
        full: string;
        created_at?: string;
      }) => {
        const targetId = assistantIdRef.current ?? msgId;
        dispatch({ type: "done", id: targetId, full, created_at });
        assistantIdRef.current = null;
      };
      const onError = () =>
        dispatch({ type: "error", id: assistantIdRef.current });

      sock.on("connect", onConnect);
      sock.on("disconnect", onDisconnect);
      sock.on("chat:history", onHistory);
      sock.on("chat:chunk", onChunk);
      sock.on("chat:done", onDone);
      sock.on("chat:error", onError);
      if (sock.connected) onConnect();

      return () => {
        sock.off("connect", onConnect);
        sock.off("disconnect", onDisconnect);
        sock.off("chat:history", onHistory);
        sock.off("chat:chunk", onChunk);
        sock.off("chat:done", onDone);
        sock.off("chat:error", onError);
      };
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, lang]);

  const send = useCallback(
    (content: string, questionId?: string | null) => {
      const sock = socketRef.current;
      if (!sock || !content.trim() || state.inFlightId) return;
      const userId = `local-${++tempIdCounter.current}-${Date.now()}`;
      const assistantId = `assistant-${tempIdCounter.current}-${Date.now()}`;
      dispatch({
        type: "appendUser",
        msg: {
          id: userId,
          role: "user",
          content,
          question_id: questionId ?? null,
        },
      });
      dispatch({ type: "startAssistant", id: assistantId });
      assistantIdRef.current = assistantId;
      sock.emit("chat:send", { content, questionId: questionId ?? undefined });
    },
    [state.inFlightId],
  );

  return { ...state, send };
}
