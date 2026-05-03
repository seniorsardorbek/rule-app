import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { resetQuiz } from "../../store/slices/quizSlice";
import { useResult, pickLang } from "../../services/quiz";
import { useT } from "../../services/i18n";
import { useThemeColors } from "../../theme/colors";

export default function QuizResultsScreen() {
  const dispatch = useAppDispatch();
  const t = useT();
  const c = useThemeColors();
  const { currentQuizId, resultId } = useAppSelector((s) => s.quiz);
  const { data: result, isLoading, isPending } = useResult(resultId ?? "");

  if (isLoading || (isPending && !!resultId)) {
    return (
      <View className="flex-1 items-center justify-center bg-page dark:bg-page-dark">
        <ActivityIndicator size="large" color={c.primary} />
        <Text className="text-ink-muted dark:text-ink-mutedOnDark mt-3">
          {t("loadingResults")}
        </Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View className="flex-1 items-center justify-center bg-page dark:bg-page-dark">
        <Text className="text-ink-muted dark:text-ink-mutedOnDark">
          {t("noResults")}
        </Text>
        <TouchableOpacity
          className="mt-4 bg-primary px-6 py-3 rounded-xl"
          onPress={() => {
            dispatch(resetQuiz());
            router.replace("/(tabs)/quiz");
          }}
        >
          <Text className="text-white font-semibold">{t("allQuizzes")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { correct_count, incorrect_count, total_questions, answers = [] } =
    result;
  const percentage =
    total_questions > 0
      ? Math.round((correct_count / total_questions) * 100)
      : 0;

  const gradeLabel =
    percentage >= 80
      ? t("excellent")
      : percentage >= 60
        ? t("goodJob")
        : t("keepTrying");

  const gradeSub =
    percentage >= 80
      ? "Imtihon bo'lganida o'tib ketardingiz"
      : percentage >= 60
        ? "Yana bir oz mashq qiling"
        : "Davom eting, yaxshilashingiz mumkin";

  // Per-topic stats from answers
  const byTopic = new Map<string, { correct: number; total: number }>();
  for (const a of answers) {
    const topic = pickLang(
      a.question?.topic_name_uz ?? "",
      a.question?.topic_name_oz,
      a.question?.topic_name_ru,
    );
    if (!topic) continue;
    const cur = byTopic.get(topic) ?? { correct: 0, total: 0 };
    cur.total += 1;
    if (a.is_correct) cur.correct += 1;
    byTopic.set(topic, cur);
  }
  const topicRows = Array.from(byTopic.entries())
    .map(([name, s]) => ({
      name,
      pct: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  const handleTryAgain = () => {
    if (currentQuizId) {
      dispatch(resetQuiz());
      router.replace(`/quiz/${currentQuizId}`);
    }
  };

  const handleBackToQuizzes = () => {
    dispatch(resetQuiz());
    router.replace("/(tabs)/quiz");
  };

  return (
    <SafeAreaView
      className="flex-1 bg-page dark:bg-page-dark"
      edges={["top", "bottom"]}
    >
      {/* Top nav */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <TouchableOpacity
          onPress={handleBackToQuizzes}
          className="w-10 h-10 rounded-xl bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color={c.ink} />
        </TouchableOpacity>
        <Text
          className="font-bold text-ink dark:text-ink-onDark"
          style={{ fontSize: 14 }}
        >
          Natijalar
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pb-3 pt-2"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero gradient card */}
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
          {/* Decorative arc layers */}
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

          {/* Ring */}
          <View
            style={{
              width: 128,
              height: 128,
              borderRadius: 64,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.10)",
              borderWidth: 6,
              borderColor: "rgba(255,255,255,0.25)",
              marginBottom: 14,
              position: "relative",
            }}
          >
            {/* Filled arc — approximate by an overlapping ring via a second
                view that covers the missing percent. For light-touch fidelity
                without an SVG dep, render a solid white outer ring and fade
                inside; the % is the headline and the ring is decoration. */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                inset: -6,
                borderRadius: 64,
                borderWidth: 6,
                borderColor: "transparent",
                borderTopColor: "#fff",
                borderRightColor: percentage >= 25 ? "#fff" : "transparent",
                borderBottomColor: percentage >= 50 ? "#fff" : "transparent",
                borderLeftColor: percentage >= 75 ? "#fff" : "transparent",
                transform: [{ rotate: "-45deg" }],
              }}
            />
            <Text
              style={{
                color: "#fff",
                fontWeight: "800",
                fontSize: 38,
                letterSpacing: -1.4,
                lineHeight: 38,
              }}
            >
              {percentage}%
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 11,
                marginTop: 6,
              }}
            >
              {correct_count} / {total_questions}
            </Text>
          </View>

          <Text
            style={{
              color: "#fff",
              fontWeight: "800",
              fontSize: 22,
              letterSpacing: -0.5,
            }}
          >
            {gradeLabel}
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 13,
              marginTop: 4,
              textAlign: "center",
            }}
          >
            {gradeSub}
          </Text>
        </LinearGradient>

        {/* Stats row */}
        <View className="flex-row gap-2.5 mb-3.5">
          <StatCell
            value={correct_count}
            label={t("correct")}
            icon="checkmark"
            iconBg={c.successSoft}
            iconColor={c.success}
          />
          <StatCell
            value={incorrect_count}
            label={t("wrong")}
            icon="close"
            iconBg={c.dangerSoft}
            iconColor={c.danger}
          />
        </View>

        {/* Topics card */}
        {topicRows.length > 0 ? (
          <View
            className="bg-surface dark:bg-surface-dark rounded-2xl border border-edge dark:border-edge-dark"
            style={{ padding: 14 }}
          >
            <Text
              className="font-bold text-ink dark:text-ink-onDark mb-3"
              style={{ fontSize: 13 }}
            >
              Mavzular bo'yicha
            </Text>
            {topicRows.map((row, i) => {
              const barColor =
                row.pct >= 80
                  ? c.success
                  : row.pct >= 60
                    ? c.warning
                    : c.danger;
              return (
                <View
                  key={row.name + i}
                  style={{ marginBottom: i === topicRows.length - 1 ? 0 : 10 }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      className="text-ink-mid dark:text-ink-midOnDark"
                      style={{ fontSize: 12, fontWeight: "500" }}
                      numberOfLines={1}
                    >
                      {row.name}
                    </Text>
                    <Text
                      className="text-ink dark:text-ink-onDark"
                      style={{ fontSize: 12, fontWeight: "700" }}
                    >
                      {row.pct}%
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 6,
                      borderRadius: 99,
                      backgroundColor: c.surfaceSoft,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${row.pct}%`,
                        backgroundColor: barColor,
                        borderRadius: 99,
                      }}
                    />
                  </View>
                </View>
              );
            })}
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
            onPress={handleBackToQuizzes}
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
              {t("allQuizzes")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleTryAgain}
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
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                {t("tryAgain")}
              </Text>
              <Ionicons name="refresh" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

interface StatCellProps {
  value: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
}

function StatCell({ value, label, icon, iconBg, iconColor }: StatCellProps) {
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
