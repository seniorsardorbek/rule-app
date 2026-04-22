import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTodayPerformance } from "../services/quiz";
import { useT } from "../services/i18n";

interface Props {
  userId: string;
}

export function PerformanceWidget({ userId }: Props) {
  const t = useT();
  const { data, isLoading } = useTodayPerformance(userId);

  if (isLoading || !data) {
    return (
      <View className="bg-white rounded-2xl p-5 mb-6 border border-gray-100 items-center justify-center h-32">
        <ActivityIndicator size="small" color="#6366F1" />
      </View>
    );
  }

  // No goal set → CTA to onboarding
  if (!data.goal_questions || data.goal_minutes === null) {
    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-5 mb-6 border border-gray-100"
        onPress={() => router.push("/(onboarding)")}
        activeOpacity={0.8}
      >
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-full bg-indigo-50 items-center justify-center">
            <Ionicons name="flag-outline" size={22} color="#6366F1" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900">
              {t("setDailyGoal")}
            </Text>
            <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={2}>
              {t("setDailyGoalDesc")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  }

  const percent = data.performance_percent ?? 0;
  const remaining = Math.max(0, data.goal_questions - data.today_questions);

  const { bar, text, bg, border } =
    percent >= 100
      ? {
          bar: "bg-green-500",
          text: "text-green-700",
          bg: "bg-green-50",
          border: "border-green-200",
        }
      : percent >= 60
        ? {
            bar: "bg-indigo-500",
            text: "text-indigo-700",
            bg: "bg-indigo-50",
            border: "border-indigo-200",
          }
        : {
            bar: "bg-yellow-500",
            text: "text-yellow-700",
            bg: "bg-yellow-50",
            border: "border-yellow-200",
          };

  return (
    <View className="bg-white rounded-2xl p-5 mb-6 border border-gray-100">
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1">
          <Text className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold">
            {t("todaysPerformance")}
          </Text>
          <Text className="text-xl font-bold text-gray-900 mt-1">
            {data.today_questions}
            <Text className="text-gray-400 text-base font-semibold">
              {" "}
              / {data.goal_questions}
            </Text>
            <Text className="text-gray-500 text-sm font-medium">
              {" "}
              {t("questionsLower")}
            </Text>
          </Text>
        </View>
        <View
          className={`px-3 py-1.5 rounded-xl border ${bg} ${border}`}
        >
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
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text className="text-xs text-gray-600 font-medium">
              {data.goal_minutes} {t("minShort")}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="layers-outline" size={14} color="#6B7280" />
            <Text className="text-xs text-gray-600 font-medium">
              ~{data.goal_quizzes} {t("quizzesLower")}
            </Text>
          </View>
        </View>
        {percent >= 100 ? (
          <View className="flex-row items-center gap-1">
            <Ionicons name="trophy" size={14} color="#16A34A" />
            <Text className="text-xs text-green-700 font-semibold">
              {t("goalReached")}
            </Text>
          </View>
        ) : (
          <Text className="text-xs text-gray-500 font-medium">
            {remaining} {t("toGoal")}
          </Text>
        )}
      </View>
    </View>
  );
}
