import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useQuizzes, pickLang, type QuizLastResult } from "../../services/quiz";
import { useT } from "../../services/i18n";
import { useThemeColors } from "../../theme/colors";
import { useState, useCallback, useMemo } from "react";

type Filter = "all" | "new" | "incomplete" | "high";

export default function QuizScreen() {
  const t = useT();
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const { data, isLoading, error, refetch } = useQuizzes({ limit: 1000 });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const allQuizzes = data?.data ?? [];
  const quizzes = useMemo(() => {
    if (filter === "all") return allQuizzes;
    if (filter === "new") return allQuizzes.filter((q) => !q.last_result);
    if (filter === "incomplete")
      return allQuizzes.filter((q) => {
        const lr = q.last_result;
        if (!lr) return true;
        return (
          lr.total_questions > 0 &&
          lr.correct_count / lr.total_questions < 0.9
        );
      });
    if (filter === "high")
      return allQuizzes.filter((q) => {
        const lr = q.last_result;
        return (
          lr &&
          lr.total_questions > 0 &&
          lr.correct_count / lr.total_questions >= 0.9
        );
      });
    return allQuizzes;
  }, [allQuizzes, filter]);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "Hammasi" },
    { key: "new", label: "Yangi" },
    { key: "incomplete", label: "Tugatilmagan" },
    { key: "high", label: "90%+" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-page-dark">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 py-4 gap-3 pb-32"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View className="mb-1 mt-1">
          <Text
            className="font-extrabold text-ink dark:text-ink-onDark"
            style={{ fontSize: 28, letterSpacing: -0.5 }}
          >
            {t("quizzes")}
          </Text>
          <Text className="text-ink-muted dark:text-ink-mutedOnDark text-[13px] mt-1">
            {t("testYourKnowledge")}
          </Text>
        </View>

        {isLoading && !refreshing ? (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-ink-muted dark:text-ink-mutedOnDark mt-3">
              {t("loadingQuizzes")}
            </Text>
          </View>
        ) : error ? (
          <View className="py-16 items-center justify-center">
            <Ionicons name="wifi-outline" size={48} color={colors.inkMuted} />
            <Text className="text-ink dark:text-ink-onDark text-lg font-semibold mt-3">
              {t("connectionError")}
            </Text>
            <Text className="text-ink-muted dark:text-ink-mutedOnDark text-center mt-1">
              {t("connectionErrorDesc")}
            </Text>
          </View>
        ) : allQuizzes.length === 0 ? (
          <View className="py-16 items-center justify-center">
            <Ionicons name="document-text-outline" size={48} color={colors.inkMuted} />
            <Text className="text-ink dark:text-ink-onDark text-lg font-semibold mt-3">
              {t("noQuizzesAvailable")}
            </Text>
            <Text className="text-ink-muted dark:text-ink-mutedOnDark text-center mt-1">
              {t("noQuizzesAvailableDesc")}
            </Text>
          </View>
        ) : (
          <>
            {/* Exam mode — primary gradient CTA */}
            <TouchableOpacity
              onPress={() => router.push("/exam")}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  padding: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  overflow: "hidden",
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 16 },
                  shadowOpacity: 0.3,
                  shadowRadius: 40,
                  elevation: 6,
                }}
              >
                <View
                  className="w-12 h-12 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.22)" }}
                >
                  <Ionicons name="timer" size={22} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-white font-extrabold"
                    style={{ fontSize: 15, letterSpacing: -0.3 }}
                  >
                    {t("examMode")}
                  </Text>
                  <Text
                    className="text-white/90 mt-1"
                    style={{ fontSize: 12, lineHeight: 16 }}
                    numberOfLines={2}
                  >
                    {t("examModeDesc")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Mistakes practice — vibrant danger gradient */}
            <TouchableOpacity
              onPress={() => router.push("/quiz/mistakes")}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.danger, colors.dangerDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  padding: 18,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  overflow: "hidden",
                  shadowColor: colors.dangerDeep,
                  shadowOffset: { width: 0, height: 16 },
                  shadowOpacity: 0.3,
                  shadowRadius: 40,
                  elevation: 6,
                }}
              >
                <View
                  className="w-12 h-12 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.22)" }}
                >
                  <Ionicons name="flame" size={22} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-white font-extrabold"
                    style={{ fontSize: 15, letterSpacing: -0.3 }}
                  >
                    {t("mistakesPractice")}
                  </Text>
                  <Text
                    className="text-white/90 mt-1"
                    style={{ fontSize: 12, lineHeight: 16 }}
                    numberOfLines={2}
                  >
                    {t("mistakesPracticeDesc")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            >
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    activeOpacity={0.8}
                    className={`rounded-full border ${
                      active
                        ? "bg-primary border-transparent"
                        : "bg-surface dark:bg-surface-dark border-edge dark:border-edge-dark"
                    }`}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      shadowColor: active ? colors.primary : "transparent",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: active ? 0.25 : 0,
                      shadowRadius: 10,
                      elevation: active ? 3 : 0,
                    }}
                  >
                    <Text
                      className={`font-semibold ${
                        active ? "text-white" : "text-ink-mid dark:text-ink-midOnDark"
                      }`}
                      style={{ fontSize: 12.5 }}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {quizzes.length === 0 ? (
              <View className="py-10 items-center justify-center">
                <Ionicons
                  name="filter-outline"
                  size={36}
                  color={colors.inkMuted}
                />
                <Text className="text-ink-muted dark:text-ink-mutedOnDark mt-2 text-sm">
                  Bu filtrga mos test yo'q
                </Text>
              </View>
            ) : null}

            {quizzes.map((quiz) => {
              const questionCount = quiz.questions?.length ?? 0;
              return (
                <QuizCard
                  key={quiz.id}
                  id={quiz.id}
                  name={pickLang(quiz.name_uz, quiz.name_oz, quiz.name_ru)}
                  description={quiz.description}
                  questionCount={questionCount}
                  lastResult={quiz.last_result ?? null}
                  questionsLabel={t("questions")}
                  notAttemptedLabel={t("notAttempted")}
                  attemptLabel={t("attempt")}
                />
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface QuizCardProps {
  id: string;
  name: string;
  description?: string;
  questionCount: number;
  lastResult: QuizLastResult | null;
  questionsLabel: string;
  notAttemptedLabel: string;
  attemptLabel: string;
}

function QuizCard({
  id,
  name,
  description,
  questionCount,
  lastResult,
  questionsLabel,
  notAttemptedLabel,
  attemptLabel,
}: QuizCardProps) {
  const colors = useThemeColors();
  const percent =
    lastResult && lastResult.total_questions > 0
      ? Math.round(
          (lastResult.correct_count / lastResult.total_questions) * 100,
        )
      : null;

  const grade =
    percent === null
      ? null
      : percent >= 80
        ? { chipBg: "bg-success-50", chipText: "text-success-600", bar: "bg-success" }
        : percent >= 60
          ? { chipBg: "bg-warning-50", chipText: "text-warning-600", bar: "bg-warning" }
          : { chipBg: "bg-danger-50", chipText: "text-danger-600", bar: "bg-danger" };

  const completed = lastResult !== null;

  return (
    <TouchableOpacity
      className="bg-surface dark:bg-surface-dark rounded-2xl p-3 border border-edge dark:border-edge-dark"
      onPress={() => router.push(`/quiz/${id}`)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{
            backgroundColor: completed
              ? colors.primarySoft
              : colors.surfaceSoft,
          }}
        >
          <Text
            className={`font-extrabold ${
              completed
                ? "text-primary"
                : "text-ink-muted dark:text-ink-mutedOnDark"
            }`}
            style={{ fontSize: 14 }}
          >
            {(name.match(/\d+/) ?? ["?"])[0]}
          </Text>
        </View>
        <View className="flex-1">
          <Text
            className="font-bold text-ink dark:text-ink-onDark"
            style={{ fontSize: 14 }}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text
            className="text-ink-muted dark:text-ink-mutedOnDark mt-0.5"
            style={{ fontSize: 11.5 }}
          >
            {completed
              ? `${lastResult.correct_count}/${lastResult.total_questions} · ${attemptLabel} #${lastResult.attempt}`
              : `${questionCount} ${questionsLabel} · ${notAttemptedLabel}`}
          </Text>
        </View>
        {completed && grade ? (
          <View className={`px-2.5 py-1 rounded-full ${grade.chipBg}`}>
            <Text
              className={`font-bold ${grade.chipText}`}
              style={{ fontSize: 11 }}
            >
              {percent}%
            </Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={colors.inkDim} />
        )}
      </View>
      {description ? (
        <Text
          className="text-ink-muted dark:text-ink-mutedOnDark mt-2"
          style={{ fontSize: 12 }}
          numberOfLines={2}
        >
          {description}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}
