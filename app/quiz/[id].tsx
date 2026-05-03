import { useEffect, useState } from "react";
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
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuiz, useSubmitResult, pickLang } from "../../services/quiz";
import { useT } from "../../services/i18n";
import { getFileUrl } from "../../services/api";
import { verifyMeApi } from "../../services/auth";
import { storage } from "../../services/storage";
import { setCredentials } from "../../store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  startQuiz,
  selectAnswer,
  submitQuiz,
} from "../../store/slices/quizSlice";
import { useThemeColors } from "../../theme/colors";

export default function QuizPlayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const t = useT();
  const c = useThemeColors();
  const answers = useAppSelector((s) => s.quiz.answers);
  const user = useAppSelector((s) => s.auth.user);
  const { data: quiz, isLoading, error } = useQuiz(id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checkedIndices, setCheckedIndices] = useState<Set<number>>(new Set());
  const submitResult = useSubmitResult();

  useEffect(() => {
    if (id) {
      dispatch(startQuiz(id));
      setCurrentIndex(0);
      setCheckedIndices(new Set());
    }
  }, [id, dispatch]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-page dark:bg-page-dark">
        <ActivityIndicator size="large" color={c.primary} />
        <Text className="text-ink-muted dark:text-ink-mutedOnDark mt-3">
          {t("loadingQuiz")}
        </Text>
      </View>
    );
  }

  if (error || !quiz) {
    return (
      <View className="flex-1 items-center justify-center bg-page dark:bg-page-dark px-6">
        <Ionicons name="alert-circle-outline" size={48} color={c.danger} />
        <Text className="text-ink dark:text-ink-onDark text-lg font-semibold mt-3">
          {t("failedToLoadQuiz")}
        </Text>
        <TouchableOpacity
          className="mt-4 bg-primary px-6 py-3 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">{t("goBack")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sortedQuestions = [...quiz.questions].sort((a, b) => a.order - b.order);
  const question = sortedQuestions[currentIndex];
  const totalQuestions = sortedQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const selectedOptionId = question ? answers[question.id] : undefined;
  const isChecked = checkedIndices.has(currentIndex);
  const isLastQuestion = currentIndex === totalQuestions - 1;

  if (!question) {
    return (
      <View className="flex-1 items-center justify-center bg-page dark:bg-page-dark">
        <Text className="text-ink-muted dark:text-ink-mutedOnDark">
          {t("noQuestions")}
        </Text>
      </View>
    );
  }

  const handleSelect = (optionId: string) => {
    if (isChecked) return;
    dispatch(selectAnswer({ questionId: question.id, optionId }));
  };

  const handleCheck = () => {
    setCheckedIndices((prev) => new Set(prev).add(currentIndex));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitResult.isPending) return;

    let userId = user?.id;
    if (!userId) {
      const token = await storage.getItem("access_token");
      if (!token) {
        Alert.alert("Error", "You are not signed in.");
        return;
      }
      try {
        const verified = await verifyMeApi();
        if (verified.isLoggedIn && verified.user) {
          dispatch(setCredentials({ user: verified.user, token }));
          userId = verified.user.id;
        }
      } catch (e) {
        console.error("[Quiz submit] re-verify failed", e);
      }
      if (!userId) {
        Alert.alert("Error", "Session expired. Please sign in again.");
        return;
      }
    }

    try {
      const payload = sortedQuestions.map((q) => ({
        questionId: q.id,
        selectedOptionId: answers[q.id] ?? null,
      }));
      const result = await submitResult.mutateAsync({
        userId,
        quizId: quiz.id,
        answers: payload,
      });
      dispatch(submitQuiz(result.id));
      router.replace("/quiz/results");
    } catch (e: any) {
      console.error("[Quiz submit] failed", e?.response?.data ?? e?.message ?? e);
      Alert.alert(
        "Submit failed",
        e?.response?.data?.message ?? e?.message ?? "Unknown error",
      );
    }
  };

  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const quizName = pickLang(quiz.name_uz, quiz.name_oz, quiz.name_ru);
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
    <SafeAreaView className="flex-1 bg-page dark:bg-page-dark" edges={["top", "bottom"]}>
      {/* Top nav */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-xl bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color={c.ink} />
        </TouchableOpacity>
        <Text
          className="font-bold text-ink dark:text-ink-onDark"
          style={{ fontSize: 14 }}
          numberOfLines={1}
        >
          {quizName}
        </Text>
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
            {currentIndex + 1}/{totalQuestions}
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
            {currentIndex + 1} / {totalQuestions}
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

        {/* Question image */}
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

        {/* Explanation when checked */}
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
                      const correct = question.options.find((o) => o.is_correct);
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
          {/* Ortga (secondary) */}
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

          {/* Primary action */}
          <PrimaryAction
            isChecked={isChecked}
            checkedSelectedCorrect={!!checkedSelectedCorrect}
            isLastQuestion={isLastQuestion}
            selectedOptionId={selectedOptionId}
            isPending={submitResult.isPending}
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

interface PrimaryActionProps {
  isChecked: boolean;
  checkedSelectedCorrect: boolean;
  isLastQuestion: boolean;
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
  isLastQuestion,
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
    } else if (isLastQuestion) {
      text = label.baribir;
      onPress = onSubmit;
    } else {
      text = label.keyingisi;
      onPress = onNext;
    }
  } else {
    if (isLastQuestion) {
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
