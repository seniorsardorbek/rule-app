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
import { router } from "expo-router";
import { useQuizzes, pickLang, type QuizLastResult } from "../../services/quiz";
import { useT } from "../../services/i18n";
import { useState, useCallback } from "react";

export default function QuizScreen() {
  const t = useT();
  const [refreshing, setRefreshing] = useState(false);
  const { data, isLoading, error, refetch } = useQuizzes({ limit: 1000 });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const quizzes = data?.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4">
        <Text className="text-2xl font-bold text-gray-900">{t("quizzes")}</Text>
        <Text className="text-gray-500 mt-1">{t("testYourKnowledge")}</Text>
      </View>

      {isLoading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-gray-500 mt-3">{t("loadingQuizzes")}</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="wifi-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-900 text-lg font-semibold mt-3">
            {t("connectionError")}
          </Text>
          <Text className="text-gray-500 text-center mt-1">
            {t("connectionErrorDesc")}
          </Text>
        </View>
      ) : quizzes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-900 text-lg font-semibold mt-3">
            {t("noQuizzesAvailable")}
          </Text>
          <Text className="text-gray-500 text-center mt-1">
            {t("noQuizzesAvailableDesc")}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="gap-3 pb-32"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2563EB"
            />
          }
        >
          {/* Mistakes practice entry */}
          <TouchableOpacity
            className="rounded-2xl p-4 bg-indigo-600 shadow-sm"
            onPress={() => router.push("/quiz/mistakes")}
            activeOpacity={0.85}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-11 h-11 rounded-2xl bg-white/20 items-center justify-center">
                <Ionicons name="flash" size={22} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">
                  {t("mistakesPractice")}
                </Text>
                <Text className="text-indigo-100 text-xs mt-0.5" numberOfLines={2}>
                  {t("mistakesPracticeDesc")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#E0E7FF" />
            </View>
          </TouchableOpacity>

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
                lastAttemptLabel={t("lastAttempt")}
                notAttemptedLabel={t("notAttempted")}
                attemptLabel={t("attempt")}
              />
            );
          })}
        </ScrollView>
      )}
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
  lastAttemptLabel: string;
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
  lastAttemptLabel,
  notAttemptedLabel,
  attemptLabel,
}: QuizCardProps) {
  const percent =
    lastResult && lastResult.total_questions > 0
      ? Math.round(
          (lastResult.correct_count / lastResult.total_questions) * 100,
        )
      : null;

  const grade =
    percent === null
      ? { text: "text-gray-500", bg: "bg-gray-100", bar: "bg-gray-300" }
      : percent >= 80
        ? { text: "text-green-700", bg: "bg-green-50", bar: "bg-green-500" }
        : percent >= 60
          ? { text: "text-yellow-700", bg: "bg-yellow-50", bar: "bg-yellow-500" }
          : { text: "text-red-700", bg: "bg-red-50", bar: "bg-red-500" };

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
      onPress={() => router.push(`/quiz/${id}`)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text
          className="text-base font-semibold text-gray-900 flex-1 mr-2"
          numberOfLines={1}
        >
          {name}
        </Text>
        <View className="bg-blue-50 px-2.5 py-1 rounded-full">
          <Text className="text-blue-600 text-xs font-medium">
            {questionCount} {questionsLabel}
          </Text>
        </View>
      </View>

      {description ? (
        <Text className="text-gray-500 text-sm mb-2" numberOfLines={2}>
          {description}
        </Text>
      ) : null}

      {lastResult ? (
        <View className="mt-2 border-t border-gray-100 pt-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
              {lastAttemptLabel}
              {lastResult.attempt > 1 ? ` • #${lastResult.attempt}` : ""}
            </Text>
            <Text className={`text-sm font-bold ${grade.text}`}>
              {percent}%
            </Text>
          </View>

          <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
            <View
              className={`h-full rounded-full ${grade.bar}`}
              style={{ width: `${percent ?? 0}%` }}
            />
          </View>

          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <View className="w-5 h-5 rounded-full bg-green-100 items-center justify-center">
                <Ionicons name="checkmark" size={11} color="#16A34A" />
              </View>
              <Text className="text-xs font-semibold text-gray-700">
                {lastResult.correct_count}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="w-5 h-5 rounded-full bg-red-100 items-center justify-center">
                <Ionicons name="close" size={11} color="#EF4444" />
              </View>
              <Text className="text-xs font-semibold text-gray-700">
                {lastResult.incorrect_count}
              </Text>
            </View>
            <Text className="text-xs text-gray-400">
              / {lastResult.total_questions}
            </Text>
          </View>
        </View>
      ) : (
        <View className="flex-row items-center gap-1.5 mt-1">
          <Ionicons name="time-outline" size={14} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs">{notAttemptedLabel}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
