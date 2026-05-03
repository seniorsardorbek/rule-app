import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useQuizzes,
  pickLang,
  type QuizQuestion,
} from "../../services/quiz";
import { useT } from "../../services/i18n";
import { getFileUrl } from "../../services/api";
import { useThemeColors, type ThemeColors } from "../../theme/colors";

const PASS_THRESHOLD = 0.9;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Alert.alert on web doesn't render buttons or fire onPress callbacks. Branch
// on platform: window.confirm on web, Alert.alert on native.
function confirmDestructive(
  title: string,
  message: string,
  cancelLabel: string,
  confirmLabel: string,
  onConfirm: () => void,
) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: cancelLabel, style: "cancel" },
    { text: confirmLabel, style: "destructive", onPress: onConfirm },
  ]);
}

function notify(message: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.alert(message);
    return;
  }
  Alert.alert(message);
}

export default function ExamPlayScreen() {
  const { count: countParam } = useLocalSearchParams<{ count?: string }>();
  const t = useT();
  const c = useThemeColors();
  const requestedCount = Math.max(1, parseInt(countParam ?? "20", 10) || 20);

  const { data, isLoading, error } = useQuizzes({ limit: 1000 });

  // Build the exam set once when quizzes load. Memo ensures we don't reshuffle
  // on every render (which would cause currentIndex to point at a different
  // question each tick).
  const questions = useMemo<QuizQuestion[]>(() => {
    if (!data?.data?.length) return [];
    const all: QuizQuestion[] = [];
    for (const q of data.data) {
      if (q.questions?.length) all.push(...q.questions);
    }
    return shuffle(all).slice(0, requestedCount);
  }, [data, requestedCount]);

  const total = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(requestedCount * 60);
  const finishedRef = useRef(false);

  // Timer — drains while the exam is in progress, auto-finishes on zero.
  useEffect(() => {
    if (isLoading || total === 0 || finished) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          if (!finishedRef.current) {
            finishedRef.current = true;
            setFinished(true);
            setTimeout(() => {
              notify(t("timeUpTitle"));
            }, 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isLoading, total, finished, t]);

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

  if (error || total === 0) {
    return (
      <SafeAreaView className="flex-1 bg-page dark:bg-page-dark items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={48} color={c.danger} />
        <Text className="text-ink dark:text-ink-onDark text-lg font-semibold mt-3 text-center">
          {t("examNoQuestions")}
        </Text>
        <TouchableOpacity
          className="mt-4 bg-primary px-6 py-3 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">{t("goBack")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (finished) {
    return <ExamResult questions={questions} answers={answers} c={c} t={t} />;
  }

  const question = questions[currentIndex];
  const selectedOptionId = question ? answers[question.id] : undefined;
  const isLast = currentIndex === total - 1;
  const progress = ((currentIndex + 1) / total) * 100;
  const answeredCount = Object.keys(answers).length;
  const topic = pickLang(
    question.topic_name_uz ?? "",
    question.topic_name_oz,
    question.topic_name_ru,
  );

  const lowTime = timeLeft <= 30;

  const handleSelect = (optionId: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) setCurrentIndex((i) => i + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const submitNow = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(true);
  };

  const handleFinish = () => {
    confirmDestructive(
      t("confirmFinishTitle"),
      t("confirmFinishMsg"),
      t("cancel"),
      t("finishExam"),
      submitNow,
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-page-dark" edges={["top", "bottom"]}>
      {/* Top nav with timer */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <TouchableOpacity
          onPress={() =>
            confirmDestructive(
              t("confirmFinishTitle"),
              t("confirmFinishMsg"),
              t("cancel"),
              t("goBack"),
              () => router.back(),
            )
          }
          className="w-10 h-10 rounded-xl bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color={c.ink} />
        </TouchableOpacity>
        <View
          className="flex-row items-center rounded-full"
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: lowTime ? c.dangerSoft : c.primarySoft,
            gap: 6,
          }}
        >
          <Ionicons
            name="time-outline"
            size={13}
            color={lowTime ? c.danger : c.primary}
          />
          <Text
            className="font-extrabold"
            style={{
              fontSize: 13,
              color: lowTime ? c.danger : c.primary,
              fontVariant: ["tabular-nums"],
            }}
          >
            {formatTime(timeLeft)}
          </Text>
        </View>
        <View
          className="rounded-full"
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: c.surfaceSoft,
          }}
        >
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
      >
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

        <View className="gap-2">
          {question.options.map((option, index) => {
            const isSelected = selectedOptionId === option.id;
            const letter = String.fromCharCode(65 + index);

            const styles = isSelected
              ? {
                  bg: c.primarySoft,
                  border: c.primary,
                  badgeBg: c.primary,
                  badgeText: "#fff",
                  glow: c.primary + "33",
                }
              : {
                  bg: c.surface,
                  border: c.border,
                  badgeBg: c.surfaceSoft,
                  badgeText: c.inkMid,
                  glow: "transparent",
                };

            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => handleSelect(option.id)}
                activeOpacity={0.7}
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
                  shadowOpacity: isSelected ? 1 : 0,
                  shadowRadius: 12,
                  elevation: isSelected ? 2 : 0,
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
                    color: c.ink,
                  }}
                >
                  {pickLang(option.text_uz, option.text_oz, option.text_ru)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
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

          <TouchableOpacity
            onPress={isLast ? handleFinish : handleNext}
            activeOpacity={0.85}
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={
                isLast ? [c.success, "#16A34A"] : [c.primary, c.primaryDeep]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                height: 52,
                borderRadius: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                shadowColor: isLast ? c.success : c.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 18,
                elevation: 5,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                {isLast ? t("finishExam") : t("keyingisi")}
              </Text>
              <Ionicons
                name={isLast ? "checkmark" : "arrow-forward"}
                size={16}
                color="#fff"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

interface ExamResultProps {
  questions: QuizQuestion[];
  answers: Record<string, string>;
  c: ThemeColors;
  t: ReturnType<typeof useT>;
}

function ExamResult({ questions, answers, c, t }: ExamResultProps) {
  const total = questions.length;
  let correct = 0;
  for (const q of questions) {
    const sel = answers[q.id];
    if (!sel) continue;
    const opt = q.options.find((o) => o.id === sel);
    if (opt?.is_correct) correct += 1;
  }
  const wrong = total - correct;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = correct / Math.max(1, total) >= PASS_THRESHOLD;

  const heroColors = passed
    ? ([c.success, "#16A34A"] as const)
    : ([c.danger, c.dangerDeep] as const);

  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-page-dark" edges={["top", "bottom"]}>
      {/* Top nav */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <TouchableOpacity
          onPress={() => router.replace("/exam")}
          className="w-10 h-10 rounded-xl bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color={c.ink} />
        </TouchableOpacity>
        <Text
          className="font-bold text-ink dark:text-ink-onDark"
          style={{ fontSize: 14 }}
        >
          {t("examResultTitle")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 py-4 gap-4 pb-12"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={heroColors as unknown as readonly [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 24,
            alignItems: "center",
            overflow: "hidden",
            shadowColor: heroColors[0],
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.3,
            shadowRadius: 32,
            elevation: 6,
          }}
        >
          <View
            className="w-16 h-16 rounded-3xl items-center justify-center mb-3"
            style={{ backgroundColor: "rgba(255,255,255,0.22)" }}
          >
            <Ionicons
              name={passed ? "trophy" : "alert-circle"}
              size={32}
              color="#fff"
            />
          </View>
          <Text
            className="text-white font-extrabold"
            style={{ fontSize: 38, letterSpacing: -1 }}
          >
            {percent}%
          </Text>
          <Text
            className="text-white/95 font-bold mt-1"
            style={{ fontSize: 16 }}
          >
            {passed ? t("examPassed") : t("examFailed")}
          </Text>
          <Text
            className="text-white/80 mt-1"
            style={{ fontSize: 12 }}
          >
            {t("examPassThreshold")}
          </Text>
        </LinearGradient>

        {/* Stats */}
        <View className="flex-row gap-3">
          <StatCell
            label={t("correct")}
            value={correct}
            color={c.success}
            bg={c.successSoft}
            icon="checkmark-circle"
          />
          <StatCell
            label={t("wrong")}
            value={wrong}
            color={c.danger}
            bg={c.dangerSoft}
            icon="close-circle"
          />
        </View>

        {/* Actions */}
        <View className="flex-row gap-2.5 mt-2">
          <TouchableOpacity
            onPress={() => router.replace("/exam")}
            activeOpacity={0.7}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              className="text-ink dark:text-ink-onDark font-bold"
              style={{ fontSize: 14 }}
            >
              {t("backToExamSelect")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace(`/exam/play?count=${total}`)}
            activeOpacity={0.85}
            style={{ flex: 1 }}
          >
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
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                {t("tryNewExam")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface StatCellProps {
  label: string;
  value: number;
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
}

function StatCell({ label, value, color, bg, icon }: StatCellProps) {
  return (
    <View
      className="flex-1 bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark"
      style={{ borderRadius: 18, padding: 14 }}
    >
      <View
        className="w-9 h-9 rounded-xl items-center justify-center mb-2"
        style={{ backgroundColor: bg }}
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text
        className="font-extrabold text-ink dark:text-ink-onDark"
        style={{ fontSize: 22, letterSpacing: -0.4 }}
      >
        {value}
      </Text>
      <Text
        className="text-ink-muted dark:text-ink-mutedOnDark mt-0.5"
        style={{ fontSize: 12 }}
      >
        {label}
      </Text>
    </View>
  );
}
