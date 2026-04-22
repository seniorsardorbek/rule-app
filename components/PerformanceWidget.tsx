import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTodayPerformance } from "../services/quiz";
import { useT } from "../services/i18n";
import { colors } from "../theme/colors";

interface Props {
  userId: string;
}

export function PerformanceWidget({ userId }: Props) {
  const t = useT();
  const { data, isLoading } = useTodayPerformance(userId);

  if (isLoading || !data) {
    return (
      <View className="bg-surface rounded-2xl p-5 mb-6 border border-gray-100 items-center justify-center h-32">
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  // No exam date set → CTA to onboarding
  if (!data.goal_questions || data.days_until_exam === null) {
    return (
      <TouchableOpacity
        className="bg-surface rounded-2xl p-5 mb-6 border border-gray-100"
        onPress={() => router.push("/(onboarding)")}
        activeOpacity={0.8}
      >
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-full bg-primary-50 items-center justify-center">
            <Ionicons name="flag-outline" size={22} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-ink">
              {t("setDailyGoal")}
            </Text>
            <Text className="text-ink-muted text-xs mt-0.5" numberOfLines={2}>
              {t("setDailyGoalDesc")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
        </View>
      </TouchableOpacity>
    );
  }

  const percent = data.performance_percent ?? 0;
  const remaining = Math.max(0, data.goal_questions - data.today_questions);

  const { bar, text, bg, border } =
    percent >= 100
      ? {
          bar: "bg-success",
          text: "text-success-600",
          bg: "bg-success-50",
          border: "border-success-500/30",
        }
      : percent >= 60
        ? {
            bar: "bg-primary",
            text: "text-primary-600",
            bg: "bg-primary-50",
            border: "border-primary-500/30",
          }
        : {
            bar: "bg-warning",
            text: "text-warning-600",
            bg: "bg-warning-50",
            border: "border-warning-500/30",
          };

  return (
    <View className="bg-surface rounded-2xl p-5 mb-6 border border-gray-100">
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1">
          <Text className="text-[11px] uppercase tracking-wide text-ink-muted font-semibold">
            {t("todaysPerformance")}
          </Text>
          <Text className="text-xl font-bold text-ink mt-1">
            {data.today_questions}
            <Text className="text-ink-muted text-base font-semibold">
              {" "}
              / {data.goal_questions}
            </Text>
            <Text className="text-ink-muted text-sm font-medium">
              {" "}
              {t("questionsLower")}
            </Text>
          </Text>
        </View>
        <View className={`px-3 py-1.5 rounded-xl border ${bg} ${border}`}>
          <Text className={`text-lg font-bold ${text}`}>{percent}%</Text>
        </View>
      </View>

      {/* Bar */}
      <View className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <View
          className={`h-full rounded-full ${bar}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </View>

      {/* Meta row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="calendar-outline" size={14} color={colors.inkMuted} />
            <Text className="text-xs text-ink-muted font-medium">
              {data.days_until_exam} {t("daysLeft")}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="layers-outline" size={14} color={colors.inkMuted} />
            <Text className="text-xs text-ink-muted font-medium">
              ~{data.goal_quizzes} {t("quizzesLower")}
            </Text>
          </View>
        </View>
        {percent >= 100 ? (
          <View className="flex-row items-center gap-1">
            <Ionicons name="trophy" size={14} color={colors.success} />
            <Text className="text-xs text-success-600 font-semibold">
              {t("goalReached")}
            </Text>
          </View>
        ) : (
          <Text className="text-xs text-ink-muted font-medium">
            {remaining} {t("toGoal")}
          </Text>
        )}
      </View>
    </View>
  );
}
