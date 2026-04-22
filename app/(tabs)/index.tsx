import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAppSelector } from "../../store/hooks";
import { useQuizzes, pickLang } from "../../services/quiz";
import { useT } from "../../services/i18n";
import { PerformanceWidget } from "../../components/PerformanceWidget";
import { colors } from "../../theme/colors";

export default function HomeScreen() {
  const t = useT();
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading } = useQuizzes({ limit: 4 });
  const quizzes = data?.data ?? [];

  const displayName = user?.first_name ?? "Learner";
  const initials = getInitials(user?.first_name, user?.last_name);
  const examCountdown = getExamCountdown(
    user?.onboarding?.exam_date,
    user?.onboarding?.completed_at,
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerClassName="px-5 py-4">
        {/* Greeting + avatar */}
        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-14 h-14 rounded-full bg-primary items-center justify-center">
            <Text className="text-white text-lg font-bold">{initials}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-ink" numberOfLines={1}>
              {t("hello")}, {displayName} 👋
            </Text>
            <Text className="text-ink-muted text-sm mt-0.5" numberOfLines={1}>
              {t("whatLearnToday")}
            </Text>
          </View>
        </View>

        {/* Exam countdown */}
        {examCountdown ? (
          <TouchableOpacity
            className="bg-surface rounded-2xl p-4 mb-6 border border-gray-100"
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.85}
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-primary-50 items-center justify-center">
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                </View>
                <Text className="text-ink font-semibold text-base">
                  {examCountdown.daysLeft > 0
                    ? `${examCountdown.daysLeft} ${t("daysLeft")}`
                    : t("examDayToday")}
                </Text>
              </View>
              {examCountdown.percent !== null ? (
                <Text className="text-primary font-bold text-sm">
                  {examCountdown.percent}%
                </Text>
              ) : null}
            </View>
            {examCountdown.percent !== null ? (
              <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${examCountdown.percent}%` }}
                />
              </View>
            ) : null}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="bg-surface rounded-2xl p-4 mb-6 border border-gray-100"
            onPress={() => router.push("/(onboarding)")}
            activeOpacity={0.85}
          >
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-primary-50 items-center justify-center">
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              </View>
              <Text className="text-ink font-semibold text-sm flex-1">
                {t("setExamDate")}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
            </View>
          </TouchableOpacity>
        )}

        {/* Daily performance */}
        {user?.id ? <PerformanceWidget userId={user.id} /> : null}      

        {/* Recent Quizzes */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-ink">
            {t("availableQuizzes")}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/quiz")}>
            <Text className="text-primary text-sm font-medium">{t("seeAll")}</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : quizzes.length === 0 ? (
          <View className="bg-surface rounded-2xl p-6 items-center border border-gray-100">
            <Ionicons name="document-text-outline" size={36} color={colors.inkMuted} />
            <Text className="text-ink-muted mt-2">{t("noQuizzesYet")}</Text>
          </View>
        ) : (
          <View className="gap-3">
            {quizzes.map((quiz) => (
              <TouchableOpacity
                key={quiz.id}
                className="bg-surface rounded-2xl p-4 border border-gray-100"
                onPress={() => router.push(`/quiz/${quiz.id}`)}
                activeOpacity={0.7}
              >
                <Text
                  className="text-base font-semibold text-ink mb-1"
                  numberOfLines={1}
                >
                  {pickLang(quiz.name_uz, quiz.name_oz, quiz.name_ru)}
                </Text>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="help-circle-outline" size={14} color={colors.inkMuted} />
                  <Text className="text-ink-muted text-sm">
                    {quiz.questions?.length ?? 0} {t("questions")}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getInitials(first?: string | null, last?: string | null): string {
  const a = first?.trim()?.[0] ?? "";
  const b = last?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "U";
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getExamCountdown(
  examDateRaw?: string | null,
  startedAtRaw?: string | null,
): { daysLeft: number; percent: number | null } | null {
  if (!examDateRaw) return null;
  const exam = new Date(examDateRaw);
  if (isNaN(exam.getTime())) return null;

  const now = new Date();
  const daysLeft = Math.max(
    0,
    Math.ceil((exam.getTime() - now.getTime()) / MS_PER_DAY),
  );

  if (!startedAtRaw) return { daysLeft, percent: null };
  const start = new Date(startedAtRaw);
  if (isNaN(start.getTime())) return { daysLeft, percent: null };

  const total = exam.getTime() - start.getTime();
  if (total <= 0) return { daysLeft, percent: 100 };

  const elapsed = now.getTime() - start.getTime();
  const percent = Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
  return { daysLeft, percent };
}
