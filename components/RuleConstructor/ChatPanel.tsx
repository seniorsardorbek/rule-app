import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useT } from "../../services/i18n";
import { useThemeColors } from "../../theme/colors";
import { useAppSelector } from "../../store/hooks";
import { useChat, ChatMessage } from "../../services/chat";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ChatPanel({ visible, onClose }: Props) {
  const t = useT();
  const c = useThemeColors();
  const currentQuestionId = useAppSelector(
    (s) => s.chat.currentQuestionId,
  );
  const lang = useAppSelector((s) => s.lang.lang);
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const { status, messages, inFlightId, send } = useChat({
    enabled: visible,
    lang,
  });

  useEffect(() => {
    if (visible) console.log(`[chat lang] panel opened with lang=${lang}`);
  }, [visible, lang]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages]);

  const handleSend = () => {
    const value = input.trim();
    if (!value || inFlightId) return;
    send(value, currentQuestionId);
    setInput("");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "flex-end",
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={{ flex: 1 }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <View
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: "85%",
              paddingTop: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: c.border,
                alignSelf: "center",
                marginBottom: 12,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 18,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: c.border,
              }}
            >
              <LinearGradient
                colors={[c.primary, c.primaryDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="sparkles" size={18} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text
                  className="font-extrabold text-ink dark:text-ink-onDark"
                  style={{ fontSize: 16, letterSpacing: -0.3 }}
                >
                  {t("ruleConstructor")}
                </Text>
                <Text
                  className="text-ink-muted dark:text-ink-mutedOnDark"
                  style={{ fontSize: 11.5 }}
                >
                  {status === "connecting"
                    ? t("chatConnecting")
                    : status === "connected"
                      ? t("ruleConstructorSubtitle")
                      : t("chatNotConnected")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={8}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: c.surfaceSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={18} color={c.inkMid} />
              </TouchableOpacity>
            </View>

            {currentQuestionId ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 18,
                  paddingTop: 10,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 999,
                    backgroundColor: c.primarySoft,
                  }}
                >
                  <Ionicons name="link" size={12} color={c.primary} />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: c.primary,
                    }}
                  >
                    {t("chatAttachedQuestion")}
                  </Text>
                </View>
              </View>
            ) : null}

            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => (
                <Bubble msg={item} pending={item.pending && !item.content} />
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: 12,
                flexGrow: 1,
              }}
              ListEmptyComponent={
                status === "connected" ? (
                  <View
                    style={{
                      paddingVertical: 28,
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 18,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: c.primarySoft,
                      }}
                    >
                      <Ionicons name="sparkles" size={26} color={c.primary} />
                    </View>
                    <Text
                      className="text-ink dark:text-ink-onDark font-bold text-center"
                      style={{ fontSize: 14, paddingHorizontal: 30 }}
                    >
                      {t("chatEmpty")}
                    </Text>
                    <Text
                      className="text-ink-muted dark:text-ink-mutedOnDark text-center"
                      style={{ fontSize: 11.5, paddingHorizontal: 30 }}
                    >
                      {t("chatOnlyDriving")}
                    </Text>
                  </View>
                ) : status === "connecting" ? (
                  <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <ActivityIndicator color={c.primary} />
                  </View>
                ) : null
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />

            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: c.border,
                paddingHorizontal: 14,
                paddingTop: 10,
                paddingBottom: Platform.OS === "ios" ? 28 : 14,
                gap: 10,
                flexDirection: "row",
                alignItems: "flex-end",
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: 18,
                  backgroundColor: c.surfaceSoft,
                  paddingHorizontal: 14,
                  paddingVertical: Platform.OS === "ios" ? 10 : 6,
                  borderWidth: 1,
                  borderColor: c.border,
                }}
              >
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder={t("chatPlaceholder")}
                  placeholderTextColor={c.inkDim}
                  multiline
                  style={{
                    color: c.ink,
                    fontSize: 14.5,
                    maxHeight: 96,
                    minHeight: 24,
                    ...(Platform.OS === "web"
                      ? ({ outlineStyle: "none" } as any)
                      : {}),
                  }}
                  editable={status === "connected" && !inFlightId}
                />
              </View>
              <TouchableOpacity
                onPress={handleSend}
                disabled={
                  !input.trim() || !!inFlightId || status !== "connected"
                }
                activeOpacity={0.85}
                style={{ opacity: !input.trim() || !!inFlightId ? 0.5 : 1 }}
              >
                <LinearGradient
                  colors={[c.primary, c.primaryDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {inFlightId ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="arrow-up" size={20} color="#fff" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Bubble({ msg, pending }: { msg: ChatMessage; pending?: boolean }) {
  const c = useThemeColors();
  const isUser = msg.role === "user";
  if (isUser) {
    return (
      <View style={{ alignItems: "flex-end" }}>
        <LinearGradient
          colors={[c.primary, c.primaryDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            maxWidth: "82%",
            borderRadius: 18,
            borderBottomRightRadius: 4,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 14, lineHeight: 20 }}>
            {msg.content}
          </Text>
        </LinearGradient>
      </View>
    );
  }
  return (
    <View style={{ alignItems: "flex-start" }}>
      <View
        style={{
          maxWidth: "88%",
          borderRadius: 18,
          borderBottomLeftRadius: 4,
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: c.surfaceSoft,
          borderWidth: 1,
          borderColor: c.border,
        }}
      >
        {pending ? (
          <TypingDots c={c} />
        ) : (
          <Text
            className="text-ink dark:text-ink-onDark"
            style={{ fontSize: 14, lineHeight: 20 }}
          >
            {msg.content}
          </Text>
        )}
      </View>
    </View>
  );
}

function TypingDots({ c }: { c: ReturnType<typeof useThemeColors> }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [a]);
  const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  return (
    <View style={{ flexDirection: "row", gap: 4, paddingVertical: 4 }}>
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: c.inkMid,
            opacity,
          }}
        />
      ))}
    </View>
  );
}
