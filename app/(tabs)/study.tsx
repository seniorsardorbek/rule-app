import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const lessons = [
  { id: "1", title: "Introduction to Algebra", subject: "Mathematics", progress: 80, duration: "15 min" },
  { id: "2", title: "Newton's Laws of Motion", subject: "Physics", progress: 45, duration: "20 min" },
  { id: "3", title: "The French Revolution", subject: "History", progress: 0, duration: "25 min" },
  { id: "4", title: "Spanish Basics", subject: "Languages", progress: 60, duration: "10 min" },
  { id: "5", title: "Cell Biology", subject: "Biology", progress: 30, duration: "18 min" },
];

export default function StudyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 py-4">
        <Text className="text-2xl font-bold text-gray-900">Study</Text>
        <Text className="text-gray-500 mt-1">Continue where you left off</Text>
      </View>

      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 gap-3 pb-6"
        renderItem={({ item }) => (
          <TouchableOpacity className="bg-white rounded-2xl p-4 border border-gray-100">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1">
                <Text className="text-sm text-blue-600 font-medium mb-1">{item.subject}</Text>
                <Text className="text-base font-semibold text-gray-900">{item.title}</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Ionicons name="time-outline" size={13} color="#6B7280" />
                <Text className="text-gray-500 text-xs">{item.duration}</Text>
              </View>
            </View>

            <View className="mt-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-gray-400">Progress</Text>
                <Text className="text-xs text-gray-600 font-medium">{item.progress}%</Text>
              </View>
              <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <View
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${item.progress}%` }}
                />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
