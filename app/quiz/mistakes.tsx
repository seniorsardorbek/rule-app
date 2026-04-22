import { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  pickLang,
  useMistakesPractice,
  useSubmitMistakesPractice,
  type MistakesPracticeSubmitResponse,
} from "../../services/quiz";
import { useT } from "../../services/i18n";
import { getFileUrl } from "../../services/api";
import { verifyMeApi } from "../../services/auth";
import { storage } from "../../services/storage";
import { setCredentials } from "../../store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

export default function MistakesPracticeScreen() {
  const t = useT();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const userId = user?.id ?? "";
  const { data: questions, isLoading, error, refetch } =
    useMistakesPractice(userId);
  const submit = useSubmitMistakesPractice();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [summary, setSummary] =
    useState<MistakesPracticeSubmitResponse | null>(null);

  const total = questions?.length ?? 0;
  const question = questions?.[currentIndex];
  const selectedOptionId = question ? answers[question.id] : undefined;
  const isChecked = checked.has(currentIndex);
  const isLast = currentIndex === total - 1;

  const progress = useMemo(
    () => (total === 0 ? 0 : ((currentIndex + 1) / total) * 100),
    [currentIndex, total],
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-500 mt-3">{t("loading")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-gray-900 text-lg font-semibold mt-3">
          {t("connectionError")}
        </Text>
        <TouchableOpacity
          className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
          onPress={() => refetch()}
        >
          <Text className="text-white font-semibold">{t("tryAgain")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!questions || total === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center mb-4">
          <Ionicons name="sparkles" size={32} color="#16A34A" />
        </View>
        <Text className="text-gray-900 text-lg font-semibold">
          {t("noMistakesYet")}
        </Text>
        <Text className="text-gray-500 text-center mt-1">
          {t("noMistakesYetDesc")}
        </Text>
        <TouchableOpacity
          className="mt-6 bg-blue-600 px-6 py-3 rounded-xl"
          onPress={() => router.replace("/(tabs)/quiz")}
        >
          <Text className="text-white font-semibold">{t("allQuizzes")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!question) return null;

  const handleSelect = (optionId: string) => {
    if (isChecked) return;
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  };

  const handleCheck = () => {
    setChecked((prev) => new Set(prev).add(currentIndex));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) setCurrentIndex((i) => i + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleSubmit = async () => {
    if (submit.isPending) return;

    let uid = userId;
    if (!uid) {
      const token = await storage.getItem("access_token");
      if (!token) {
        Alert.alert("Error", "You are not signed in.");
        return;
      }
      try {
        const verified = await verifyMeApi();
        if (verified.isLoggedIn && verified.user) {
          dispatch(setCredentials({ user: verified.user, token }));
          uid = verified.user.id;
        }
      } catch (e) {
        console.error("[Mistakes submit] re-verify failed", e);
      }
      if (!uid) {
        Alert.alert("Error", "Session expired. Please sign in again.");
        return;
      }
    }

    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: answers[q.id] ?? null,
      }));
      const res = await submit.mutateAsync({ userId: uid, answers: payload });
      setSummary(res);
    } catch (e: any) {
      console.error(
        "[Mistakes submit] failed",
        e?.response?.data ?? e?.message ?? e,
      );
      Alert.alert(
        "Submit failed",
        e?.response?.data?.message ?? e?.message ?? "Unknown error",
      );
    }
  };

  const handleCloseSummary = () => {
    setSummary(null);
    router.replace("/(tabs)/quiz");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      {/* Header: count badge + progress */}
      <View className="px-5 pt-3">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <Ionicons name="flash" size={16} color="#6366F1" />
            <Text className="text-sm font-semibold text-indigo-600">
              {total} {t("mistakesCount")}
            </Text>
          </View>
          <Text className="text-sm text-gray-500">
            {currentIndex + 1} / {total}
          </Text>
        </View>
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-indigo-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-5"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
        key={currentIndex}
      >
        <Text className="text-xl font-bold text-gray-900 mb-4">
          {pickLang(
            question.question_uz,
            question.question_oz,
            question.question_ru,
          )}
        </Text>

        {question.image?.url ? (
          <Image
            source={{ uri: getFileUrl(question.image.url) }}
            className="w-full h-48 rounded-xl mb-4"
            resizeMode="contain"
          />
        ) : null}

        <View className="gap-3">
          {question.options.map((option, index) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect = option.is_correct;
            const letter = String.fromCharCode(65 + index);

            let borderClass = "border-gray-200";
            let bgClass = "bg-white";
            let textClass = "text-gray-800";
            let circleClass = "bg-gray-100";
            let circleTextClass = "text-gray-600";
            let trailing: React.ReactNode = null;

            if (isChecked) {
              if (isCorrect) {
                borderClass = "border-green-400";
                bgClass = "bg-green-50";
                textClass = "text-green-800";
                circleClass = "bg-green-500";
                circleTextClass = "text-white";
                trailing = (
                  <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
                );
              } else if (isSelected) {
                borderClass = "border-red-400";
                bgClass = "bg-red-50";
                textClass = "text-red-800";
                circleClass = "bg-red-500";
                circleTextClass = "text-white";
                trailing = (
                  <Ionicons name="close-circle" size={22} color="#EF4444" />
                );
              }
            } else if (isSelected) {
              borderClass = "border-indigo-500";
              bgClass = "bg-indigo-50";
              textClass = "text-indigo-700";
              circleClass = "bg-indigo-500";
              circleTextClass = "text-white";
              trailing = (
                <Ionicons name="checkmark-circle" size={22} color="#6366F1" />
              );
            }

            return (
              <TouchableOpacity
                key={option.id}
                className={`flex-row items-center p-4 rounded-2xl border-2 ${borderClass} ${bgClass}`}
                onPress={() => handleSelect(option.id)}
                activeOpacity={isChecked ? 1 : 0.7}
              >
                <View
                  className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${circleClass}`}
                >
                  <Text className={`font-bold text-sm ${circleTextClass}`}>
                    {letter}
                  </Text>
                </View>
                <Text className={`flex-1 text-base font-medium ${textClass}`}>
                  {pickLang(option.text_uz, option.text_oz, option.text_ru)}
                </Text>
                {trailing}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Nav */}
      <View className="px-5 py-4 bg-white border-t border-gray-100">
        <View className="flex-row gap-3">
          <TouchableOpacity
            className={`flex-1 py-3.5 rounded-xl items-center border ${
              currentIndex === 0
                ? "border-gray-200 bg-gray-50"
                : "border-gray-300 bg-white"
            }`}
            onPress={handlePrev}
            disabled={currentIndex === 0}
          >
            <Text
              className={`font-semibold ${
                currentIndex === 0 ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {t("ortga")}
            </Text>
          </TouchableOpacity>

          {!isChecked && selectedOptionId ? (
            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl items-center bg-indigo-600"
              onPress={handleCheck}
            >
              <Text className="text-white font-semibold">
                {t("tekshirish")}
              </Text>
            </TouchableOpacity>
          ) : isLast ? (
            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl items-center bg-green-600"
              onPress={handleSubmit}
              disabled={submit.isPending}
            >
              {submit.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold">
                  {t("yakunlash")}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className={`flex-1 py-3.5 rounded-xl items-center ${
                selectedOptionId || isChecked ? "bg-blue-600" : "bg-gray-300"
              }`}
              onPress={handleNext}
              disabled={!selectedOptionId && !isChecked}
            >
              <Text className="text-white font-semibold">
                {t("keyingisi")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Summary modal */}
      <Modal visible={!!summary} animationType="fade" transparent>
        <View className="flex-1 bg-black/50 items-center justify-center px-8">
          <View className="bg-white rounded-3xl w-full p-6">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-indigo-50 items-center justify-center mb-3">
                <Ionicons name="flash" size={28} color="#6366F1" />
              </View>
              <Text className="text-lg font-bold text-gray-900">
                {t("mistakesResultTitle")}
              </Text>
            </View>

            {summary ? (
              <View className="gap-2 mb-5">
                <SummaryRow
                  icon="checkmark-circle"
                  iconColor="#16A34A"
                  label={t("corrected")}
                  value={summary.corrected}
                  tone="green"
                />
                <SummaryRow
                  icon="close-circle"
                  iconColor="#EF4444"
                  label={t("stillWrong")}
                  value={summary.stillWrong}
                  tone="red"
                />
              </View>
            ) : null}

            <TouchableOpacity
              className="py-3.5 rounded-xl items-center bg-indigo-600"
              onPress={handleCloseSummary}
            >
              <Text className="text-white font-semibold">{t("close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryRow({
  icon,
  iconColor,
  label,
  value,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: number;
  tone: "green" | "red";
}) {
  const bg = tone === "green" ? "bg-green-50" : "bg-red-50";
  const text = tone === "green" ? "text-green-700" : "text-red-700";
  return (
    <View className={`flex-row items-center justify-between px-4 py-3 rounded-xl ${bg}`}>
      <View className="flex-row items-center gap-2">
        <Ionicons name={icon} size={18} color={iconColor} />
        <Text className={`font-semibold ${text}`}>{label}</Text>
      </View>
      <Text className={`font-bold text-base ${text}`}>{value}</Text>
    </View>
  );
}
