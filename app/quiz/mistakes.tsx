import { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  pickLang,
  useMistakesPractice,
  useSubmitMistakesPractice,
  type MistakesPracticeSubmitResponse,
} from "../../services/quiz";
import { useT } from "../../services/i18n";
import { getFileUrl } from "../../services/api";
import { verifyMeApi } from "../../services/auth";
import { storage } from "../../services/storage";
import { setCredentials } from "../../store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useThemeColors } from "../../theme/colors";

export default function MistakesPracticeScreen() {
  const t = useT();
  const c = useThemeColors();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const userId = user?.id ?? "";
  const { data: questions, isLoading, error, refetch } =
    useMistakesPractice(userId);
  const submit = useSubmitMistakesPractice();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [summary, setSummary] =
    useState<MistakesPracticeSubmitResponse | null>(null);

  const total = questions?.length ?? 0;
  const question = questions?.[currentIndex];
  const selectedOptionId = question ? answers[question.id] : undefined;
  const isChecked = checked.has(currentIndex);
  const isLast = currentIndex === total - 1;

  const progress = useMemo(
    () => (total === 0 ? 0 : ((currentIndex + 1) / total) * 100),
    [currentIndex, total],
  );

  const handleCloseSummary = () => {
    setSummary(null);
    router.replace("/(tabs)/quiz");
  };

  // Render the summary as a full screen as soon as submit succeeds. We do this
  // BEFORE any data-dependent branches because the submit mutation invalidates
  // the `["results"]` query prefix, which causes `useMistakesPractice` to
  // refetch — often returning an empty list (the user just corrected their
  // mistakes), which would otherwise collapse the screen into the empty state
  // and unmount the modal mid-celebration.
  if (summary) {
    return (
      <MistakesSummary summary={summary} onClose={handleCloseSummary} />
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-page dark:bg-page-dark">
        <ActivityIndicator size="large" color={c.primary} />
        <Text className="text-ink-muted dark:text-ink-mutedOnDark mt-3">
          {t("loading")}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-page dark:bg-page-dark px-6">
        <Ionicons name="alert-circle-outline" size={48} color={c.danger} />
        <Text className="text-ink dark:text-ink-onDark text-lg font-semibold mt-3">
          {t("connectionError")}
        </Text>
        <TouchableOpacity
          className="mt-4 bg-primary px-6 py-3 rounded-xl"
          onPress={() => refetch()}
        >
          <Text className="text-white font-semibold">{t("tryAgain")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!questions || total === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-page dark:bg-page-dark px-6">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: c.successSoft }}
        >
          <Ionicons name="sparkles" size={32} color={c.success} />
        </View>
        <Text className="text-ink dark:text-ink-onDark text-lg font-semibold">
          {t("noMistakesYet")}
        </Text>
        <Text className="text-ink-muted dark:text-ink-mutedOnDark text-center mt-1">
          {t("noMistakesYetDesc")}
        </Text>
        <TouchableOpacity
          className="mt-6 bg-primary px-6 py-3 rounded-xl"
          onPress={() => router.replace("/(tabs)/quiz")}
        >
          <Text className="text-white font-semibold">{t("allQuizzes")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!question) return null;

  const handleSelect = (optionId: string) => {
    if (isChecked) return;
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  };

  const handleCheck = () => {
    setChecked((prev) => new Set(prev).add(currentIndex));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) setCurrentIndex((i) => i + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleSubmit = async () => {
    if (submit.isPending) return;

    let uid = userId;
    if (!uid) {
      const token = await storage.getItem("access_token");
      if (!token) {
        Alert.alert("Error", "You are not signed in.");
        return;
      }
      try {
        const verified = await verifyMeApi();
        if (verified.isLoggedIn && verified.user) {
          dispatch(setCredentials({ user: verified.user, token }));
          uid = verified.user.id;
        }
      } catch (e) {
        console.error("[Mistakes submit] re-verify failed", e);
      }
      if (!uid) {
        Alert.alert("Error", "Session expired. Please sign in again.");
        return;
      }
    }

    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: answers[q.id] ?? null,
      }));
      const res = await submit.mutateAsync({ userId: uid, answers: payload });
      setSummary(res);
    } catch (e: any) {
      console.error(
        "[Mistakes submit] failed",
        e?.response?.data ?? e?.message ?? e,
      );
      Alert.alert(
        "Submit failed",
        e?.response?.data?.message ?? e?.message ?? "Unknown error",
      );
    }
  };

  const answeredCount = Object.keys(answers).length;
  const topic = pickLang(
    question.topic_name_uz ?? "",
    question.topic_name_oz,
    question.topic_name_ru,
  );

  const checkedSelectedCorrect =
    isChecked &&
    selectedOptionId &&
    question.options.find((o) => o.id === selectedOptionId)?.is_correct;

  return (
    <SafeAreaView
      className="flex-1 bg-page dark:bg-page-dark"
      edges={["top", "bottom"]}
    >
      {/* Top nav */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-xl bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color={c.ink} />
        </TouchableOpacity>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="flame" size={14} color={c.danger} />
          <Text
            className="font-bold text-ink dark:text-ink-onDark"
            style={{ fontSize: 14 }}
            numberOfLines={1}
          >
            {t("mistakesPractice")}
          </Text>
        </View>
        <View
          className="flex-row items-center rounded-full"
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: c.surfaceSoft,
            gap: 4,
          }}
        >
          <Ionicons name="time-outline" size={13} color={c.inkMid} />
          <Text
            className="font-bold text-ink-mid dark:text-ink-midOnDark"
            style={{ fontSize: 12 }}
          >
            {currentIndex + 1}/{total}
          </Text>
        </View>
      </View>

      {/* Progress */}
      <View className="px-5 pt-2 pb-3">
        <View className="flex-row justify-between mb-1.5">
          <Text
            className="font-semibold text-ink-muted dark:text-ink-mutedOnDark"
            style={{ fontSize: 12 }}
          >
            {currentIndex + 1} / {total}
          </Text>
          <Text className="text-primary font-semibold" style={{ fontSize: 12 }}>
            {answeredCount} {t("answered")}
          </Text>
        </View>
        <View
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: c.surfaceSoft }}
        >
          <LinearGradient
            colors={[c.primary, c.primaryDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              height: "100%",
              width: `${progress}%`,
              borderRadius: 999,
            }}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-3"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
        key={currentIndex}
      >
        {/* Topic eyebrow */}
        {topic ? (
          <Text
            className="text-primary font-bold mb-1.5"
            style={{
              fontSize: 11,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {topic}
          </Text>
        ) : null}

        {/* Question */}
        <Text
          className="font-extrabold text-ink dark:text-ink-onDark mb-4"
          style={{ fontSize: 18, letterSpacing: -0.4, lineHeight: 23 }}
        >
          {pickLang(
            question.question_uz,
            question.question_oz,
            question.question_ru,
          )}
        </Text>

        {/* Image */}
        {question.image?.url ? (
          <View
            className="rounded-2xl overflow-hidden mb-4"
            style={{ backgroundColor: c.surfaceSoft }}
          >
            <Image
              source={{ uri: getFileUrl(question.image.url) }}
              style={{ width: "100%", height: 180 }}
              resizeMode="contain"
            />
          </View>
        ) : null}

        {/* Options */}
        <View className="gap-2">
          {question.options.map((option, index) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect = option.is_correct;
            const letter = String.fromCharCode(65 + index);

            type State = "default" | "selected" | "correct" | "wrong";
            let state: State = "default";
            if (isChecked) {
              if (isCorrect) state = "correct";
              else if (isSelected) state = "wrong";
            } else if (isSelected) {
              state = "selected";
            }

            const styles = {
              default: {
                bg: c.surface,
                border: c.border,
                badgeBg: c.surfaceSoft,
                badgeText: c.inkMid,
                text: c.ink,
                glow: "transparent",
              },
              selected: {
                bg: c.primarySoft,
                border: c.primary,
                badgeBg: c.primary,
                badgeText: "#fff",
                text: c.ink,
                glow: c.primary + "33",
              },
              correct: {
                bg: c.successSoft,
                border: c.success,
                badgeBg: c.success,
                badgeText: "#fff",
                text: c.ink,
                glow: c.success + "33",
              },
              wrong: {
                bg: c.dangerSoft,
                border: c.danger,
                badgeBg: c.danger,
                badgeText: "#fff",
                text: c.ink,
                glow: c.danger + "33",
              },
            }[state];

            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => handleSelect(option.id)}
                activeOpacity={isChecked ? 1 : 0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 13,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: styles.bg,
                  borderWidth: 1.5,
                  borderColor: styles.border,
                  shadowColor: styles.glow,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: state === "default" ? 0 : 1,
                  shadowRadius: 12,
                  elevation: state === "default" ? 0 : 2,
                }}
              >
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    backgroundColor: styles.badgeBg,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Text
                    style={{
                      color: styles.badgeText,
                      fontSize: 13,
                      fontWeight: "800",
                    }}
                  >
                    {letter}
                  </Text>
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 13.5,
                    fontWeight: "500",
                    color: styles.text,
                  }}
                >
                  {pickLang(option.text_uz, option.text_oz, option.text_ru)}
                </Text>
                {state === "correct" ? (
                  <Ionicons name="checkmark" size={18} color={c.success} />
                ) : state === "wrong" ? (
                  <Ionicons name="close" size={18} color={c.danger} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Explanation */}
        {isChecked ? (
          <View
            className="mt-4 rounded-2xl flex-row"
            style={{
              backgroundColor: checkedSelectedCorrect
                ? c.successSoft
                : c.dangerSoft,
              borderWidth: 1,
              borderColor: checkedSelectedCorrect
                ? c.success + "44"
                : c.danger + "44",
              padding: 14,
              gap: 12,
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={checkedSelectedCorrect ? c.success : c.danger}
              style={{ marginTop: 2 }}
            />
            <View className="flex-1">
              <Text
                style={{
                  fontWeight: "700",
                  marginBottom: 4,
                  color: checkedSelectedCorrect ? c.success : c.danger,
                  fontSize: 13,
                }}
              >
                {checkedSelectedCorrect ? "To'g'ri!" : "Noto'g'ri javob"}
              </Text>
              <Text
                className="text-ink-mid dark:text-ink-midOnDark"
                style={{ fontSize: 12.5, lineHeight: 18 }}
              >
                {checkedSelectedCorrect
                  ? "Javobingiz to'g'ri."
                  : `${t("correctAnswer")}: ${(() => {
                      const correct = question.options.find(
                        (o) => o.is_correct,
                      );
                      return correct
                        ? pickLang(
                            correct.text_uz,
                            correct.text_oz,
                            correct.text_ru,
                          )
                        : "";
                    })()}`}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom action row */}
      <View
        className="px-5 py-4"
        style={{
          backgroundColor: c.surface,
          borderTopWidth: 1,
          borderTopColor: c.border,
        }}
      >
        <View className="flex-row gap-2.5">
          <TouchableOpacity
            onPress={handlePrev}
            disabled={currentIndex === 0}
            activeOpacity={0.7}
            style={{
              width: 90,
              height: 52,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.surface,
              alignItems: "center",
              justifyContent: "center",
              opacity: currentIndex === 0 ? 0.4 : 1,
            }}
          >
            <Text
              className="text-ink dark:text-ink-onDark font-bold"
              style={{ fontSize: 14 }}
            >
              {t("ortga")}
            </Text>
          </TouchableOpacity>

          <PrimaryAction
            isChecked={isChecked}
            checkedSelectedCorrect={!!checkedSelectedCorrect}
            isLast={isLast}
            selectedOptionId={selectedOptionId}
            isPending={submit.isPending}
            onCheck={handleCheck}
            onNext={handleNext}
            onSubmit={handleSubmit}
            label={{
              tekshirish: t("tekshirish"),
              keyingisi: t("keyingisi"),
              yakunlash: t("yakunlash"),
              baribir: t("baribir"),
            }}
          />
        </View>
      </View>

    </SafeAreaView>
  );
}

// Full-screen summary view shown after submit. Mirrors the design's results
// hero: large primary gradient card, score readout, and per-row breakdowns.
interface MistakesSummaryProps {
  summary: MistakesPracticeSubmitResponse;
  onClose: () => void;
}

function MistakesSummary({ summary, onClose }: MistakesSummaryProps) {
  const t = useT();
  const c = useThemeColors();
  const total = summary.attempted;
  const pct =
    total > 0 ? Math.round((summary.corrected / total) * 100) : 0;

  return (
    <SafeAreaView
      className="flex-1 bg-page dark:bg-page-dark"
      edges={["top", "bottom"]}
    >
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <View style={{ width: 40 }} />
        <Text
          className="font-bold text-ink dark:text-ink-onDark"
          style={{ fontSize: 14 }}
        >
          {t("mistakesResultTitle")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pb-3 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[c.primary, c.primaryDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 22,
            padding: 22,
            marginBottom: 14,
            alignItems: "center",
            overflow: "hidden",
            shadowColor: c.primary,
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.35,
            shadowRadius: 40,
            elevation: 8,
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              right: -60,
              top: -60,
              width: 200,
              height: 200,
              opacity: 0.14,
            }}
          >
            {[90, 65, 40].map((r) => (
              <View
                key={r}
                style={{
                  position: "absolute",
                  left: 100 - r,
                  top: 100 - r,
                  width: r * 2,
                  height: r * 2,
                  borderRadius: r,
                  borderWidth: 1.5,
                  borderColor: "#fff",
                }}
              />
            ))}
          </View>

          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.18)",
              marginBottom: 14,
            }}
          >
            <Ionicons name="flame" size={42} color="#fff" />
          </View>

          <Text
            style={{
              color: "#fff",
              fontWeight: "800",
              fontSize: 30,
              letterSpacing: -1,
              lineHeight: 32,
            }}
          >
            {pct}%
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 12,
              marginTop: 4,
            }}
          >
            {summary.corrected} / {total} {t("corrected").toLowerCase()}
          </Text>
        </LinearGradient>

        <View className="flex-row gap-2.5 mb-3.5">
          <SummaryStat
            value={summary.corrected}
            label={t("corrected")}
            icon="checkmark"
            iconBg={c.successSoft}
            iconColor={c.success}
          />
          <SummaryStat
            value={summary.stillWrong}
            label={t("stillWrong")}
            icon="close"
            iconBg={c.dangerSoft}
            iconColor={c.danger}
          />
        </View>

        {summary.updatedResults.length > 0 ? (
          <View
            className="bg-surface dark:bg-surface-dark rounded-2xl border border-edge dark:border-edge-dark"
            style={{ padding: 14 }}
          >
            <Text
              className="font-bold text-ink dark:text-ink-onDark mb-3"
              style={{ fontSize: 13 }}
            >
              {t("mistakesPractice")}
            </Text>
            {summary.updatedResults.slice(0, 5).map((r) => {
              const correctPct =
                r.total_questions > 0
                  ? Math.round((r.correct_count / r.total_questions) * 100)
                  : 0;
              return (
                <View
                  key={r.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 6,
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      backgroundColor: c.primarySoft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="reader" size={16} color={c.primary} />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-ink dark:text-ink-onDark font-semibold"
                      style={{ fontSize: 12.5 }}
                    >
                      {t("attempt")} #{r.attempt}
                    </Text>
                    <Text
                      className="text-ink-muted dark:text-ink-mutedOnDark"
                      style={{ fontSize: 11 }}
                    >
                      {r.correct_count}/{r.total_questions} · {correctPct}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      <View
        className="px-5 py-4"
        style={{
          backgroundColor: c.surface,
          borderTopWidth: 1,
          borderTopColor: c.border,
        }}
      >
        <TouchableOpacity onPress={onClose} activeOpacity={0.85}>
          <LinearGradient
            colors={[c.primary, c.primaryDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              height: 52,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              shadowColor: c.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 18,
              elevation: 5,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
              {t("close")}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

interface SummaryStatProps {
  value: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
}

function SummaryStat({ value, label, icon, iconBg, iconColor }: SummaryStatProps) {
  return (
    <View
      className="flex-1 bg-surface dark:bg-surface-dark rounded-2xl border border-edge dark:border-edge-dark"
      style={{ padding: 14 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View>
          <Text
            className="font-extrabold text-ink dark:text-ink-onDark"
            style={{
              fontSize: 22,
              letterSpacing: -0.5,
              lineHeight: 22,
            }}
          >
            {value}
          </Text>
          <Text
            className="text-ink-muted dark:text-ink-mutedOnDark mt-0.5"
            style={{ fontSize: 11 }}
          >
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}

interface PrimaryActionProps {
  isChecked: boolean;
  checkedSelectedCorrect: boolean;
  isLast: boolean;
  selectedOptionId: string | undefined;
  isPending: boolean;
  onCheck: () => void;
  onNext: () => void;
  onSubmit: () => void;
  label: {
    tekshirish: string;
    keyingisi: string;
    yakunlash: string;
    baribir: string;
  };
}

function PrimaryAction({
  isChecked,
  checkedSelectedCorrect,
  isLast,
  selectedOptionId,
  isPending,
  onCheck,
  onNext,
  onSubmit,
  label,
}: PrimaryActionProps) {
  const c = useThemeColors();

  let text: string;
  let onPress: () => void;
  let useSuccessGradient = false;

  if (!isChecked) {
    if (selectedOptionId) {
      text = label.tekshirish;
      onPress = onCheck;
    } else if (isLast) {
      text = label.baribir;
      onPress = onSubmit;
    } else {
      text = label.keyingisi;
      onPress = onNext;
    }
  } else {
    if (isLast) {
      text = label.yakunlash;
      onPress = onSubmit;
      useSuccessGradient = checkedSelectedCorrect;
    } else {
      text = label.keyingisi;
      onPress = onNext;
      useSuccessGradient = checkedSelectedCorrect;
    }
  }

  const gradient = useSuccessGradient
    ? [c.success, "#16A34A"]
    : [c.primary, c.primaryDeep];
  const glowColor = useSuccessGradient ? c.success : c.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isPending}
      activeOpacity={0.85}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          height: 52,
          borderRadius: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 18,
          elevation: 5,
        }}
      >
        {isPending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
              {text}
            </Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

