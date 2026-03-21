import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuizzes, pickLang } from "../../services/quiz";
import { useT } from "../../services/i18n";
import { useState, useCallback } from "react";

export default function QuizScreen() {
  const t = useT();
  const [refreshing, setRefreshing] = useState(false);
  const { data, isLoading, error, refetch } = useQuizzes();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const quizzes = data?.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4">
        <Text className="text-2xl font-bold text-gray-900">{t("quizzes")}</Text>
        <Text className="text-gray-500 mt-1">{t("testYourKnowledge")}</Text>
      </View>

      {isLoading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-gray-500 mt-3">{t("loadingQuizzes")}</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="wifi-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-900 text-lg font-semibold mt-3">
            {t("connectionError")}
          </Text>
          <Text className="text-gray-500 text-center mt-1">
            {t("connectionErrorDesc")}
          </Text>
        </View>
      ) : quizzes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-900 text-lg font-semibold mt-3">
            {t("noQuizzesAvailable")}
          </Text>
          <Text className="text-gray-500 text-center mt-1">
            {t("noQuizzesAvailableDesc")}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="gap-3 pb-6"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2563EB"
            />
          }
        >
          {quizzes.map((quiz) => {
            const questionCount = quiz.questions?.length ?? 0;
            return (
              <TouchableOpacity
                key={quiz.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                onPress={() => router.push(`/quiz/${quiz.id}`)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text
                    className="text-base font-semibold text-gray-900 flex-1 mr-2"
                    numberOfLines={1}
                  >
                    {pickLang(quiz.name_uz, quiz.name_oz, quiz.name_ru)}
                  </Text>
                  <View className="bg-blue-50 px-2.5 py-1 rounded-full">
                    <Text className="text-blue-600 text-xs font-medium">
                      {questionCount} {t("questions")}
                    </Text>
                  </View>
                </View>

                {quiz.description && (
                  <Text className="text-gray-500 text-sm mb-2" numberOfLines={2}>
                    {quiz.description}
                  </Text>
                )}

                <View className="flex-row items-center gap-1 mt-1">
                  <Ionicons name="help-circle-outline" size={14} color="#6B7280" />
                  <Text className="text-gray-400 text-xs">
                    {questionCount} {t("questions")}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
