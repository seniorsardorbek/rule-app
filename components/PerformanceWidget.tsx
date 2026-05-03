import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTodayPerformance } from "../services/quiz";
import { useT } from "../services/i18n";
import { useThemeColors } from "../theme/colors";

interface Props {
  userId: string;
}

export function PerformanceWidget({ userId }: Props) {
  const t = useT();
  const c = useThemeColors();
  const { data, isLoading } = useTodayPerformance(userId);

  if (isLoading || !data) {
    return (
      <View className="bg-surface dark:bg-surface-dark rounded-3xl p-5 mb-3 border border-edge dark:border-edge-dark items-center justify-center h-40">
        <ActivityIndicator size="small" color={c.primary} />
      </View>
    );
  }

  if (!data.goal_questions || data.days_until_exam === null) {
    return (
      <TouchableOpacity
        className="bg-surface dark:bg-surface-dark rounded-3xl p-5 mb-3 border border-edge dark:border-edge-dark"
        onPress={() => router.push("/(onboarding)")}
        activeOpacity={0.85}
      >
        <View className="flex-row items-center gap-3">
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: c.primarySoft }}
          >
            <Ionicons name="flag-outline" size={22} color={c.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-ink dark:text-ink-onDark">
              {t("setDailyGoal")}
            </Text>
            <Text
              className="text-ink-muted dark:text-ink-mutedOnDark text-xs mt-0.5"
              numberOfLines={2}
            >
              {t("setDailyGoalDesc")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.inkMuted} />
        </View>
      </TouchableOpacity>
    );
  }

  const percent = data.performance_percent ?? 0;
  const remaining = Math.max(0, data.goal_questions - data.today_questions);

  return (
    <LinearGradient
      colors={[c.primary, c.primaryDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 22,
        padding: 20,
        marginBottom: 12,
        overflow: "hidden",
        shadowColor: c.primary,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.35,
        shadowRadius: 40,
        elevation: 8,
      }}
    >
      {/* Decorative concentric arcs */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          right: -40,
          top: -30,
          width: 160,
          height: 160,
          opacity: 0.18,
        }}
      >
        {[70, 50, 30].map((r) => (
          <View
            key={r}
            style={{
              position: "absolute",
              left: 80 - r,
              top: 80 - r,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              borderWidth: 1.5,
              borderColor: "#fff",
            }}
          />
        ))}
      </View>

      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text
            className="text-white/85 text-[11px] font-semibold"
            style={{ letterSpacing: 1, textTransform: "uppercase" }}
          >
            {t("todaysPerformance")}
          </Text>
          <View className="flex-row items-end mt-2">
            <Text
              className="text-white font-extrabold"
              style={{ fontSize: 44, letterSpacing: -2, lineHeight: 44 }}
            >
              {percent}
            </Text>
            <Text
              className="text-white/70 font-extrabold ml-0.5 mb-1"
              style={{ fontSize: 24 }}
            >
              %
            </Text>
          </View>
          <Text className="text-white/85 text-[13px] mt-1.5">
            {data.today_questions} / {data.goal_questions} {t("questionsLower")}
          </Text>
        </View>

        {percent >= 100 ? (
          <View className="flex-row items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full">
            <Ionicons name="trophy" size={12} color="#fff" />
            <Text className="text-white text-[11px] font-bold">
              {t("goalReached")}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-1 bg-white/20 px-3 py-1.5 rounded-full">
            <Ionicons name="trending-up" size={12} color="#fff" />
            <Text
              className="text-white text-[11px] font-bold"
              style={{ letterSpacing: 0.4 }}
            >
              {percent}%
            </Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View
        className="mt-4 h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, percent)}%`,
            backgroundColor: "#fff",
          }}
        />
      </View>

      {/* Stats row */}
      <View className="flex-row justify-between mt-4">
        <Stat label={t("daysLeft")} value={`${data.days_until_exam}`} />
        <Stat label={t("questionsLower")} value={`${data.goal_questions}`} />
        <Stat
          label={remaining > 0 ? t("toGoal") : t("goalReached")}
          value={remaining > 0 ? `${remaining}` : "✓"}
        />
      </View>
    </LinearGradient>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text
        className="text-white font-extrabold"
        style={{ fontSize: 18, letterSpacing: -0.5, lineHeight: 20 }}
      >
        {value}
      </Text>
      <Text className="text-white/80 mt-0.5" style={{ fontSize: 10.5 }}>
        {label}
      </Text>
    </View>
  );
}
