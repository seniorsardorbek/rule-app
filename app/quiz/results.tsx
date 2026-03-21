import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { resetQuiz } from "../../store/slices/quizSlice";
import { useResult, pickLang } from "../../services/quiz";
import { useT } from "../../services/i18n";
import { getFileUrl } from "../../services/api";

export default function QuizResultsScreen() {
  const dispatch = useAppDispatch();
  const t = useT();
  const { currentQuizId, resultId } = useAppSelector((s) => s.quiz);
  const { data: result, isLoading, isPending } = useResult(resultId ?? "");
  const [currentIndex, setCurrentIndex] = useState(0);

  if (isLoading || (isPending && !!resultId)) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-500 mt-3">{t("loadingResults")}</Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">{t("noResults")}</Text>
        <TouchableOpacity
          className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
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

  const { correct_count, incorrect_count, total_questions, answers = [] } = result;
  const percentage =
    total_questions > 0 ? Math.round((correct_count / total_questions) * 100) : 0;

  const gradeColor =
    percentage >= 80
      ? { text: "text-green-600", light: "bg-green-50", border: "border-green-200" }
      : percentage >= 60
        ? { text: "text-yellow-600", light: "bg-yellow-50", border: "border-yellow-200" }
        : { text: "text-red-600", light: "bg-red-50", border: "border-red-200" };

  const gradeLabel =
    percentage >= 80 ? t("excellent") : percentage >= 60 ? t("goodJob") : t("keepTrying");

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

  const answer = answers[currentIndex];
  const question = answer?.question;
  const options = question?.options ?? [];
  const correctOption = options.find((o) => o.is_correct);

  const questionText = question
    ? pickLang(question.question_uz, question.question_oz, question.question_ru)
    : "";

  const selectedText = answer?.selected_option
    ? pickLang(
        answer.selected_option.text_uz,
        answer.selected_option.text_oz,
        answer.selected_option.text_ru,
      )
    : t("notAnswered");

  const correctText = correctOption
    ? pickLang(correctOption.text_uz, correctOption.text_oz, correctOption.text_ru)
    : "";

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      {/* Score summary header */}
      <View className="px-5 pt-4 pb-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-4">
          <View
            className={`w-16 h-16 rounded-2xl items-center justify-center ${gradeColor.light} border ${gradeColor.border}`}
          >
            <Text className={`text-2xl font-bold ${gradeColor.text}`}>
              {percentage}%
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">{gradeLabel}</Text>
            <Text className="text-sm text-gray-500">
              {correct_count}/{total_questions}{" "}
              {result.attempt > 1 ? `• ${t("attempt")} #${result.attempt}` : ""}
            </Text>
          </View>
          <View className="gap-1">
            <View className="flex-row items-center gap-1.5">
              <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center">
                <Ionicons name="checkmark" size={12} color="#16A34A" />
              </View>
              <Text className="text-sm font-semibold text-gray-700">{correct_count}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-6 h-6 rounded-full bg-red-100 items-center justify-center">
                <Ionicons name="close" size={12} color="#EF4444" />
              </View>
              <Text className="text-sm font-semibold text-gray-700">{incorrect_count}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Progress bar */}
      <View className="px-5 pt-3 pb-2">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-sm text-gray-500">
            {currentIndex + 1} / {answers.length}
          </Text>
          {answer && (
            <View
              className={`px-2 py-0.5 rounded-full ${
                answer.is_correct ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  answer.is_correct ? "text-green-700" : "text-red-700"
                }`}
              >
                {answer.is_correct ? t("correct") : t("wrong")}
              </Text>
            </View>
          )}
        </View>
        <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-indigo-500 rounded-full"
            style={{ width: `${((currentIndex + 1) / answers.length) * 100}%` }}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
        key={currentIndex}
      >
        {answer && question ? (
          <>
            {/* Question text */}
            <Text className="text-lg font-bold text-gray-900 mb-4">
              {questionText}
            </Text>

            {/* Question image */}
            {question.image?.url && (
              <Image
                source={{ uri: getFileUrl(question.image.url) }}
                className="w-full h-44 rounded-xl mb-4"
                resizeMode="contain"
              />
            )}

            {/* Options — revealed */}
            <View className="gap-3">
              {options.map((option, idx) => {
                const isSelected = answer.selected_option?.id === option.id;
                const isCorrect = option.is_correct;
                const letter = String.fromCharCode(65 + idx);
                const optionText = pickLang(option.text_uz, option.text_oz, option.text_ru);

                let borderClass = "border-gray-200";
                let bgClass = "bg-white";
                let textClass = "text-gray-800";
                let circleClass = "bg-gray-100";
                let circleTextClass = "text-gray-600";

                if (isCorrect) {
                  borderClass = "border-green-400";
                  bgClass = "bg-green-50";
                  textClass = "text-green-800";
                  circleClass = "bg-green-500";
                  circleTextClass = "text-white";
                } else if (isSelected) {
                  borderClass = "border-red-400";
                  bgClass = "bg-red-50";
                  textClass = "text-red-800";
                  circleClass = "bg-red-500";
                  circleTextClass = "text-white";
                }

                return (
                  <View
                    key={option.id}
                    className={`flex-row items-center p-4 rounded-2xl border-2 ${borderClass} ${bgClass}`}
                  >
                    <View
                      className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${circleClass}`}
                    >
                      <Text className={`font-bold text-sm ${circleTextClass}`}>
                        {letter}
                      </Text>
                    </View>
                    <Text className={`flex-1 text-base font-medium ${textClass}`}>
                      {optionText}
                    </Text>
                    {isCorrect && (
                      <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                    )}
                    {isSelected && !isCorrect && (
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    )}
                  </View>
                );
              })}
            </View>

            {/* Wrong answer summary */}
            {!answer.is_correct && (
              <View className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 gap-2">
                <View>
                  <Text className="text-xs text-red-500 font-semibold mb-0.5">
                    {t("yourAnswer")}
                  </Text>
                  <Text className="text-sm text-red-700">{selectedText}</Text>
                </View>
                <View className="h-px bg-amber-200" />
                <View>
                  <Text className="text-xs text-green-600 font-semibold mb-0.5">
                    {t("correctAnswer")}
                  </Text>
                  <Text className="text-sm text-green-700">{correctText}</Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <View className="flex-1 items-center justify-center py-12">
            <Text className="text-gray-400">{t("noResults")}</Text>
          </View>
        )}
      </ScrollView>

      {/* Navigation + action buttons */}
      <View className="px-5 py-4 bg-white border-t border-gray-100 gap-3">
        {/* Prev / Next */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            className={`flex-1 py-3 rounded-xl items-center border ${
              currentIndex === 0 ? "border-gray-200 bg-gray-50" : "border-gray-300 bg-white"
            }`}
            onPress={() => setCurrentIndex((i) => i - 1)}
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

          <TouchableOpacity
            className={`flex-1 py-3 rounded-xl items-center border ${
              currentIndex === answers.length - 1
                ? "border-gray-200 bg-gray-50"
                : "border-indigo-300 bg-indigo-50"
            }`}
            onPress={() => setCurrentIndex((i) => i + 1)}
            disabled={currentIndex === answers.length - 1}
          >
            <Text
              className={`font-semibold ${
                currentIndex === answers.length - 1
                  ? "text-gray-300"
                  : "text-indigo-700"
              }`}
            >
              {t("keyingisi")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* All quizzes / Try again */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 py-3.5 rounded-xl items-center border border-gray-300"
            onPress={handleBackToQuizzes}
          >
            <Text className="text-gray-700 font-semibold">{t("allQuizzes")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-3.5 rounded-xl items-center bg-blue-600"
            onPress={handleTryAgain}
          >
            <Text className="text-white font-semibold">{t("tryAgain")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
