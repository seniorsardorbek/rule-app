import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAppSelector } from "../../store/hooks";
import { useQuizzes, pickLang } from "../../services/quiz";
import { useT } from "../../services/i18n";
import { PerformanceWidget } from "../../components/PerformanceWidget";
import { useThemeColors } from "../../theme/colors";

export default function HomeScreen() {
  const t = useT();
  const colors = useThemeColors();
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
    <SafeAreaView className="flex-1 bg-page dark:bg-page-dark">
      <ScrollView className="flex-1" contentContainerClassName="px-5 py-4 pb-32">
        {/* Greeting + avatar + bell */}
        <View className="flex-row items-center gap-3 mb-5 mt-2">
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <Text
              className="text-white font-extrabold"
              style={{ fontSize: 18, letterSpacing: -0.4 }}
            >
              {initials}
            </Text>
          </View>
          <View className="flex-1">
            <Text
              className="font-extrabold text-ink dark:text-ink-onDark"
              style={{ fontSize: 20, letterSpacing: -0.4 }}
              numberOfLines={1}
            >
              {t("hello")}, {displayName}
            </Text>
            <Text
              className="text-ink-muted dark:text-ink-mutedOnDark text-[13px] mt-0.5"
              numberOfLines={1}
            >
              {t("whatLearnToday")}
            </Text>
          </View>
          <View className="w-10 h-10 rounded-xl bg-surface dark:bg-surface-dark items-center justify-center border border-edge dark:border-edge-dark">
            <Ionicons name="notifications-outline" size={18} color={colors.inkMid} />
          </View>
        </View>

        {/* Exam countdown */}
        {examCountdown ? (
          <TouchableOpacity
            className="bg-surface dark:bg-surface-dark rounded-2xl p-4 mb-3 border border-edge dark:border-edge-dark"
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.85}
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.primarySoft }}
                >
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                </View>
                <Text className="text-ink dark:text-ink-onDark font-semibold text-base">
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
              <View
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: colors.surfaceSoft }}
              >
                <View
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${examCountdown.percent}%` }}
                />
              </View>
            ) : null}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="bg-surface dark:bg-surface-dark rounded-2xl p-4 mb-3 border border-edge dark:border-edge-dark"
            onPress={() => router.push("/(onboarding)")}
            activeOpacity={0.85}
          >
            <View className="flex-row items-center gap-2">
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primarySoft }}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              </View>
              <Text className="text-ink dark:text-ink-onDark font-semibold text-sm flex-1">
                {t("setExamDate")}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
            </View>
          </TouchableOpacity>
        )}

        {/* Daily performance */}
        {user?.id ? <PerformanceWidget userId={user.id} /> : null}

        {/* Quick actions: Exam mode + Mistakes practice */}
        <View className="gap-3 mt-3 mb-1">
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
        </View>

        {/* Recent Quizzes */}
        <View className="flex-row items-center justify-between mb-3 mt-1">
          <Text
            className="font-extrabold text-ink dark:text-ink-onDark"
            style={{ fontSize: 16, letterSpacing: -0.3 }}
          >
            {t("availableQuizzes")}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/quiz")}>
            <Text className="text-primary text-xs font-bold">{t("seeAll")}</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : quizzes.length === 0 ? (
          <View className="bg-surface dark:bg-surface-dark rounded-2xl p-6 items-center border border-edge dark:border-edge-dark">
            <Ionicons name="document-text-outline" size={36} color={colors.inkMuted} />
            <Text className="text-ink-muted dark:text-ink-mutedOnDark mt-2">
              {t("noQuizzesYet")}
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {quizzes.map((quiz) => {
              const name = pickLang(quiz.name_uz, quiz.name_oz, quiz.name_ru);
              const num = (name.match(/\d+/) ?? ["?"])[0];
              const last = quiz.last_result;
              const percent =
                last && last.total_questions > 0
                  ? Math.round((last.correct_count / last.total_questions) * 100)
                  : null;
              const completed = last !== null && last !== undefined;
              return (
                <TouchableOpacity
                  key={quiz.id}
                  className="bg-surface dark:bg-surface-dark rounded-2xl p-3 border border-edge dark:border-edge-dark"
                  onPress={() => router.push(`/quiz/${quiz.id}`)}
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
                        {num}
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
                          ? `${last!.correct_count}/${last!.total_questions} · ${percent}%`
                          : `${quiz.questions?.length ?? 0} ${t("questions")}`}
                      </Text>
                    </View>
                    {completed && percent !== null ? (
                      <View
                        className={`px-2.5 py-1 rounded-full ${
                          percent >= 80
                            ? "bg-success-50"
                            : percent >= 60
                              ? "bg-warning-50"
                              : "bg-danger-50"
                        }`}
                      >
                        <Text
                          className={`font-bold ${
                            percent >= 80
                              ? "text-success-600"
                              : percent >= 60
                                ? "text-warning-600"
                                : "text-danger-600"
                          }`}
                          style={{ fontSize: 11 }}
                        >
                          {percent}%
                        </Text>
                      </View>
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.inkDim}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
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
