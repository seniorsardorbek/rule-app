import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { setLang, type AppLang } from "../../store/slices/langSlice";
import { logout } from "../../services/auth";
import { useT } from "../../services/i18n";

const LANG_OPTIONS: { value: AppLang; emoji: string }[] = [
  { value: "uz", emoji: "🇺🇿" },
  { value: "oz", emoji: "🇺🇿" },
  { value: "ru", emoji: "🇷🇺" },
];

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const t = useT();
  const user = useAppSelector((s) => s.auth.user);
  const currentLang = useAppSelector((s) => s.lang.lang);

  const displayName = user
    ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`
    : "User";
  const initials = user?.first_name?.[0]?.toUpperCase() ?? "U";

  const menuItems = [
    { icon: "notifications-outline", label: t("notifications") },
    { icon: "shield-checkmark-outline", label: t("privacy") },
    { icon: "help-circle-outline", label: t("helpSupport") },
    { icon: "information-circle-outline", label: t("about") },
  ];

  const handleLogout = () => {
    Alert.alert(t("signOutConfirmTitle"), t("signOutConfirmMsg"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("signOut"),
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

        <View className="px-5 mt-5 gap-4">
          {/* Language selector */}
          <View className="bg-white rounded-2xl border border-gray-100 p-4">
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="language-outline" size={20} color="#6B7280" />
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold">{t("language")}</Text>
                <Text className="text-gray-400 text-xs">{t("languageDesc")}</Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              {LANG_OPTIONS.map(({ value, emoji }) => {
                const isActive = currentLang === value;
                const label =
                  value === "uz" ? t("langUz") : value === "oz" ? t("langOz") : t("langRu");
                return (
                  <TouchableOpacity
                    key={value}
                    className={`flex-1 py-3 px-2 rounded-xl items-center border-2 ${
                      isActive
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                    onPress={() => dispatch(setLang(value))}
                    activeOpacity={0.7}
                  >
                    <Text className="text-lg mb-0.5">{emoji}</Text>
                    <Text
                      className={`text-xs font-semibold text-center ${
                        isActive ? "text-indigo-700" : "text-gray-500"
                      }`}
                      numberOfLines={2}
                    >
                      {label}
                    </Text>
                    {isActive && (
                      <View className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Menu items */}
          <View className="gap-2">
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
              className="bg-red-50 flex-row items-center px-4 py-4 rounded-xl border border-red-100 mt-1"
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text className="flex-1 text-red-500 font-medium ml-3">
                {t("signOut")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
