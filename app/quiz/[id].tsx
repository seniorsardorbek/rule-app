import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuiz, useSubmitResult, pickLang } from "../../services/quiz";
import { useT } from "../../services/i18n";
import { getFileUrl } from "../../services/api";
import { verifyMeApi } from "../../services/auth";
import { storage } from "../../services/storage";
import { setCredentials } from "../../store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  startQuiz,
  selectAnswer,
  submitQuiz,
} from "../../store/slices/quizSlice";

export default function QuizPlayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const t = useT();
  const answers = useAppSelector((s) => s.quiz.answers);
  const user = useAppSelector((s) => s.auth.user);
  const { data: quiz, isLoading, error } = useQuiz(id);
  const [currentIndex, setCurrentIndex] = useState(0);
  // tracks which question indices have been "checked"
  const [checkedIndices, setCheckedIndices] = useState<Set<number>>(new Set());
  const submitResult = useSubmitResult();

  useEffect(() => {
    if (id) {
      dispatch(startQuiz(id));
      setCurrentIndex(0);
      setCheckedIndices(new Set());
    }
  }, [id, dispatch]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-500 mt-3">{t("loadingQuiz")}</Text>
      </View>
    );
  }

  if (error || !quiz) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-gray-900 text-lg font-semibold mt-3">
          {t("failedToLoadQuiz")}
        </Text>
        <TouchableOpacity
          className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">{t("goBack")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sortedQuestions = [...quiz.questions].sort((a, b) => a.order - b.order);
  const question = sortedQuestions[currentIndex];
  const totalQuestions = sortedQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const selectedOptionId = question ? answers[question.id] : undefined;
  const isChecked = checkedIndices.has(currentIndex);
  const isLastQuestion = currentIndex === totalQuestions - 1;

  if (!question) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">{t("noQuestions")}</Text>
      </View>
    );
  }

  const handleSelect = (optionId: string) => {
    if (isChecked) return; // locked after checking
    dispatch(selectAnswer({ questionId: question.id, optionId }));
  };

  const handleCheck = () => {
    setCheckedIndices((prev) => new Set(prev).add(currentIndex));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitResult.isPending) return;

    // Redux `user` can be lost (dev fast-refresh, cold app resume) while the
    // access token in storage is still valid. Re-hydrate before giving up.
    let userId = user?.id;
    if (!userId) {
      const token = await storage.getItem("access_token");
      if (!token) {
        Alert.alert("Error", "You are not signed in.");
        return;
      }
      try {
        const verified = await verifyMeApi();
        if (verified.isLoggedIn && verified.user) {
          dispatch(setCredentials({ user: verified.user, token }));
          userId = verified.user.id;
        }
      } catch (e) {
        console.error("[Quiz submit] re-verify failed", e);
      }
      if (!userId) {
        Alert.alert("Error", "Session expired. Please sign in again.");
        return;
      }
    }

    try {
      const payload = sortedQuestions.map((q) => ({
        questionId: q.id,
        selectedOptionId: answers[q.id] ?? null,
      }));
      const result = await submitResult.mutateAsync({
        userId,
        quizId: quiz.id,
        answers: payload,
      });
      dispatch(submitQuiz(result.id));
      router.replace("/quiz/results");
    } catch (e: any) {
      console.error("[Quiz submit] failed", e?.response?.data ?? e?.message ?? e);
      Alert.alert(
        "Submit failed",
        e?.response?.data?.message ?? e?.message ?? "Unknown error",
      );
    }
  };

  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      {/* Progress bar */}
      <View className="px-5 pt-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm text-gray-500">
            {currentIndex + 1} / {totalQuestions}
          </Text>
          <Text className="text-sm text-blue-600 font-medium">
            {answeredCount}/{totalQuestions} {t("answered")}
          </Text>
        </View>
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-5"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Question */}
        <Text className="text-xl font-bold text-gray-900 mb-4">
          {pickLang(question.question_uz, question.question_oz, question.question_ru)}
        </Text>

        {/* Question image */}
        {question.image?.url && (
          <Image
            source={{ uri: getFileUrl(question.image.url) }}
            className="w-full h-48 rounded-xl mb-4"
            resizeMode="contain"
          />
        )}

        {/* Options */}
        <View className="gap-3">
          {question.options.map((option, index) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect = option.is_correct;
            const letter = String.fromCharCode(65 + index);

            // Determine style based on checked state
            let borderClass = "border-gray-200";
            let bgClass = "bg-white";
            let textClass = "text-gray-800";
            let circleClass = "bg-gray-100";
            let circleTextClass = "text-gray-600";
            let trailingIcon: React.ReactNode = null;

            if (isChecked) {
              if (isCorrect) {
                borderClass = "border-green-400";
                bgClass = "bg-green-50";
                textClass = "text-green-800";
                circleClass = "bg-green-500";
                circleTextClass = "text-white";
                trailingIcon = (
                  <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
                );
              } else if (isSelected) {
                borderClass = "border-red-400";
                bgClass = "bg-red-50";
                textClass = "text-red-800";
                circleClass = "bg-red-500";
                circleTextClass = "text-white";
                trailingIcon = (
                  <Ionicons name="close-circle" size={22} color="#EF4444" />
                );
              }
            } else if (isSelected) {
              borderClass = "border-blue-500";
              bgClass = "bg-blue-50";
              textClass = "text-blue-700";
              circleClass = "bg-blue-500";
              circleTextClass = "text-white";
              trailingIcon = (
                <Ionicons name="checkmark-circle" size={22} color="#3B82F6" />
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
                {trailingIcon}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Correct answer hint shown after check */}
        {isChecked && selectedOptionId && !question.options.find((o) => o.id === selectedOptionId)?.is_correct && (
          <View className="mt-4 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex-row items-start gap-2">
            <Ionicons name="bulb-outline" size={18} color="#16A34A" style={{ marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-xs font-semibold text-green-700 mb-1">
                {t("correctAnswer")}
              </Text>
              <Text className="text-sm text-green-800">
                {(() => {
                  const correct = question.options.find((o) => o.is_correct);
                  return correct
                    ? pickLang(correct.text_uz, correct.text_oz, correct.text_ru)
                    : "";
                })()}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation buttons */}
      <View className="px-5 py-4 bg-white border-t border-gray-100">
        <View className="flex-row gap-3">
          {/* Prev */}
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

          {/* Right button: Tekshirish → Keyingisi/Yakunlash */}
          {!isChecked ? (
            // Not checked yet
            selectedOptionId ? (
              // Answer selected → show Tekshirish
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center bg-indigo-600"
                onPress={handleCheck}
              >
                <Text className="text-white font-semibold">
                  {t("tekshirish")}
                </Text>
              </TouchableOpacity>
            ) : (
              // No answer yet → show disabled Next or Submit
              isLastQuestion ? (
                <TouchableOpacity
                  className="flex-1 py-3.5 rounded-xl items-center bg-gray-400"
                  onPress={handleSubmit}
                  disabled={submitResult.isPending}
                >
                  {submitResult.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold">
                      {t("baribir")}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="flex-1 py-3.5 rounded-xl items-center bg-blue-600"
                  onPress={handleNext}
                >
                  <Text className="text-white font-semibold">
                    {t("keyingisi")}
                  </Text>
                </TouchableOpacity>
              )
            )
          ) : (
            // Checked — show Next or Submit
            isLastQuestion ? (
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center bg-green-600"
                onPress={handleSubmit}
                disabled={submitResult.isPending}
              >
                {submitResult.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">
                    {t("yakunlash")}
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl items-center bg-blue-600"
                onPress={handleNext}
              >
                <Text className="text-white font-semibold">
                  {t("keyingisi")}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
