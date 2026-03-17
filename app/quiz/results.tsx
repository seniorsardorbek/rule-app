import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { resetQuiz } from "../../store/slices/quizSlice";
import { useQuiz } from "../../services/quiz";

export default function QuizResultsScreen() {
  const dispatch = useAppDispatch();
  const { currentQuizId, answers } = useAppSelector((s) => s.quiz);
  const { data: quiz } = useQuiz(currentQuizId || "");

  if (!quiz) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">No results available</Text>
        <TouchableOpacity
          className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
          onPress={() => {
            dispatch(resetQuiz());
            router.replace("/(tabs)/quiz");
          }}
        >
          <Text className="text-white font-semibold">Back to Quizzes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sortedQuestions = [...quiz.questions].sort(
    (a, b) => a.order - b.order,
  );
  const totalQuestions = sortedQuestions.length;

  let correctCount = 0;
  const questionResults = sortedQuestions.map((q) => {
    const selectedOptionId = answers[q.id];
    const correctOption = q.options.find((o) => o.is_correct);
    const selectedOption = q.options.find((o) => o.id === selectedOptionId);
    const isCorrect = selectedOptionId === correctOption?.id;

    if (isCorrect) correctCount++;

    return {
      question: q.question,
      isCorrect,
      isAnswered: !!selectedOptionId,
      selectedText: selectedOption?.text || "Not answered",
      correctText: correctOption?.text || "",
    };
  });

  const percentage = totalQuestions > 0
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0;

  const getGradeColor = () => {
    if (percentage >= 80) return { bg: "bg-green-500", text: "text-green-600", light: "bg-green-50" };
    if (percentage >= 60) return { bg: "bg-yellow-500", text: "text-yellow-600", light: "bg-yellow-50" };
    return { bg: "bg-red-500", text: "text-red-600", light: "bg-red-50" };
  };

  const grade = getGradeColor();

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
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 py-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Score Card */}
        <View className="bg-white rounded-3xl p-6 items-center shadow-sm border border-gray-100 mb-6">
          <View
            className={`w-28 h-28 rounded-full items-center justify-center ${grade.light} mb-4`}
          >
            <Text className={`text-4xl font-bold ${grade.text}`}>
              {percentage}%
            </Text>
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-1">
            {percentage >= 80
              ? "Excellent! 🎉"
              : percentage >= 60
                ? "Good job! 👍"
                : "Keep trying! 💪"}
          </Text>

          <Text className="text-gray-500 text-center">
            You scored {correctCount} out of {totalQuestions} questions correctly
          </Text>

          <View className="flex-row gap-6 mt-5">
            <View className="items-center">
              <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mb-1">
                <Ionicons name="checkmark" size={20} color="#16A34A" />
              </View>
              <Text className="text-lg font-bold text-gray-900">
                {correctCount}
              </Text>
              <Text className="text-xs text-gray-500">Correct</Text>
            </View>
            <View className="items-center">
              <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mb-1">
                <Ionicons name="close" size={20} color="#EF4444" />
              </View>
              <Text className="text-lg font-bold text-gray-900">
                {totalQuestions - correctCount}
              </Text>
              <Text className="text-xs text-gray-500">Wrong</Text>
            </View>
          </View>
        </View>

        {/* Question Breakdown */}
        <Text className="text-lg font-bold text-gray-900 mb-3">
          Question Breakdown
        </Text>

        <View className="gap-3 mb-6">
          {questionResults.map((result, index) => (
            <View
              key={index}
              className={`bg-white rounded-2xl p-4 border ${
                result.isCorrect ? "border-green-200" : "border-red-200"
              }`}
            >
              <View className="flex-row items-start gap-3">
                <View
                  className={`w-7 h-7 rounded-full items-center justify-center mt-0.5 ${
                    result.isCorrect ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <Ionicons
                    name={result.isCorrect ? "checkmark" : "close"}
                    size={16}
                    color={result.isCorrect ? "#16A34A" : "#EF4444"}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900 mb-2">
                    {index + 1}. {result.question}
                  </Text>

                  {!result.isCorrect && (
                    <View className="mb-1">
                      <Text className="text-xs text-red-500">
                        Your answer: {result.selectedText}
                      </Text>
                    </View>
                  )}

                  <Text className="text-xs text-green-600">
                    {result.isCorrect ? "Your answer" : "Correct answer"}:{" "}
                    {result.isCorrect ? result.selectedText : result.correctText}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View className="px-5 py-4 bg-white border-t border-gray-100">
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 py-3.5 rounded-xl items-center border border-gray-300"
            onPress={handleBackToQuizzes}
          >
            <Text className="text-gray-700 font-semibold">All Quizzes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-3.5 rounded-xl items-center bg-blue-600"
            onPress={handleTryAgain}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
