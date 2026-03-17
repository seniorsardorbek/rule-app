import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAppSelector } from "../../store/hooks";
import { useQuizzes } from "../../services/quiz";

export default function HomeScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading } = useQuizzes({ limit: 4 });
  const quizzes = data?.data ?? [];

  const displayName = user?.first_name ?? "Learner";

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerClassName="px-5 py-4">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">
            Hello, {displayName} 👋
          </Text>
          <Text className="text-gray-500 mt-1">What will you learn today?</Text>
        </View>

        {/* Daily Challenge Banner */}
        <TouchableOpacity
          className="bg-blue-600 rounded-2xl p-5 mb-6"
          onPress={() => router.push("/(tabs)/quiz")}
          activeOpacity={0.85}
        >
          <Text className="text-white text-lg font-bold mb-1">
            Daily Challenge
          </Text>
          <Text className="text-blue-100 text-sm mb-4">
            Complete today's quiz and test your skills
          </Text>
          <View className="bg-white rounded-xl py-2 px-4 self-start">
            <Text className="text-blue-600 font-semibold text-sm">
              Start Now
            </Text>
          </View>
        </TouchableOpacity>

        {/* Recent Quizzes */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-gray-900">
            Available Quizzes
          </Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/quiz")}>
            <Text className="text-blue-600 text-sm font-medium">See All</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="small" color="#2563EB" />
          </View>
        ) : quizzes.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 items-center border border-gray-100">
            <Ionicons
              name="document-text-outline"
              size={36}
              color="#9CA3AF"
            />
            <Text className="text-gray-500 mt-2">No quizzes available yet</Text>
          </View>
        ) : (
          <View className="gap-3">
            {quizzes.map((quiz) => (
              <TouchableOpacity
                key={quiz.id}
                className="bg-white rounded-2xl p-4 border border-gray-100"
                onPress={() => router.push(`/quiz/${quiz.id}`)}
                activeOpacity={0.7}
              >
                <Text
                  className="text-base font-semibold text-gray-900 mb-1"
                  numberOfLines={1}
                >
                  {quiz.title}
                </Text>
                <View className="flex-row items-center gap-3">
                  <View className="flex-row items-center gap-1">
                    <Ionicons
                      name="help-circle-outline"
                      size={14}
                      color="#6B7280"
                    />
                    <Text className="text-gray-500 text-sm">
                      {quiz.questions?.length ?? 0} questions
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
