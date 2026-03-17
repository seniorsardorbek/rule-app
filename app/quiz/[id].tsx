import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuiz } from "../../services/quiz";
import { getFileUrl } from "../../services/api";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { startQuiz, selectAnswer, submitQuiz } from "../../store/slices/quizSlice";

export default function QuizPlayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const answers = useAppSelector((s) => s.quiz.answers);
  const { data: quiz, isLoading, error } = useQuiz(id);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (id) {
      dispatch(startQuiz(id));
    }
  }, [id, dispatch]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-500 mt-3">Loading quiz...</Text>
      </View>
    );
  }

  if (error || !quiz) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-gray-900 text-lg font-semibold mt-3">
          Failed to load quiz
        </Text>
        <TouchableOpacity
          className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sortedQuestions = [...quiz.questions].sort(
    (a, b) => a.order - b.order,
  );
  const question = sortedQuestions[currentIndex];
  const totalQuestions = sortedQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const selectedOptionId = question ? answers[question.id] : undefined;

  if (!question) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">No questions in this quiz</Text>
      </View>
    );
  }

  const handleSelect = (optionId: string) => {
    dispatch(selectAnswer({ questionId: question.id, optionId }));
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

  const handleSubmit = () => {
    dispatch(submitQuiz());
    router.replace("/quiz/results");
  };

  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      {/* Progress bar */}
      <View className="px-5 pt-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm text-gray-500">
            Question {currentIndex + 1} of {totalQuestions}
          </Text>
          <Text className="text-sm text-blue-600 font-medium">
            {answeredCount}/{totalQuestions} answered
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
          {question.question}
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
            const letter = String.fromCharCode(65 + index); // A, B, C, D...

            return (
              <TouchableOpacity
                key={option.id}
                className={`flex-row items-center p-4 rounded-2xl border-2 ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
                onPress={() => handleSelect(option.id)}
                activeOpacity={0.7}
              >
                <View
                  className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${
                    isSelected ? "bg-blue-500" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`font-bold text-sm ${
                      isSelected ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {letter}
                  </Text>
                </View>
                <Text
                  className={`flex-1 text-base ${
                    isSelected
                      ? "text-blue-700 font-medium"
                      : "text-gray-800"
                  }`}
                >
                  {option.text}
                </Text>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="#3B82F6"
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Navigation buttons */}
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
              Previous
            </Text>
          </TouchableOpacity>

          {currentIndex === totalQuestions - 1 ? (
            <TouchableOpacity
              className={`flex-1 py-3.5 rounded-xl items-center ${
                answeredCount === totalQuestions
                  ? "bg-green-600"
                  : "bg-blue-600"
              }`}
              onPress={handleSubmit}
            >
              <Text className="text-white font-semibold">
                {answeredCount === totalQuestions ? "Submit" : "Submit Anyway"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="flex-1 py-3.5 rounded-xl items-center bg-blue-600"
              onPress={handleNext}
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
