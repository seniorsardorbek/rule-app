import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAppSelector } from "../../store/hooks";
import { logout } from "../../services/auth";

const menuItems = [
  { icon: "notifications-outline", label: "Notifications" },
  { icon: "shield-checkmark-outline", label: "Privacy" },
  { icon: "help-circle-outline", label: "Help & Support" },
  { icon: "information-circle-outline", label: "About" },
];

export default function ProfileScreen() {
  const user = useAppSelector((s) => s.auth.user);

  const displayName = user
    ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`
    : "User";
  const initials = user?.first_name?.[0]?.toUpperCase() ?? "U";

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white px-5 pt-6 pb-8 items-center border-b border-gray-100">
          <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-3">
            <Text className="text-3xl font-bold text-blue-600">{initials}</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">{displayName}</Text>
          <Text className="text-gray-500 text-sm mt-1">
            {user?.phone_number ?? ""}
          </Text>

          {user?.role && (
            <View className="bg-blue-50 px-3 py-1 rounded-full mt-2">
              <Text className="text-blue-600 text-xs font-medium">
                {user.role}
              </Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View className="px-5 mt-5 gap-2">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              className="bg-white flex-row items-center px-4 py-4 rounded-xl border border-gray-100"
            >
              <Ionicons name={item.icon as any} size={20} color="#6B7280" />
              <Text className="flex-1 text-gray-800 font-medium ml-3">
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            className="bg-red-50 flex-row items-center px-4 py-4 rounded-xl border border-red-100 mt-2"
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="flex-1 text-red-500 font-medium ml-3">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
