import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useT } from "../../services/i18n";
import { useThemeColors } from "../../theme/colors";
import { logout } from "../../services/auth";

export default function SubscriptionExpiredScreen() {
  const t = useT();
  const c = useThemeColors();

  const onLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-page-dark">
      <View className="flex-1 items-center justify-center px-8">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-6"
          style={{ backgroundColor: c.warningSoft }}
        >
          <Ionicons name="lock-closed" size={36} color={c.warning} />
        </View>
        <Text className="text-2xl font-bold text-ink dark:text-white text-center">
          {t("subscriptionExpiredTitle")}
        </Text>
        <Text className="text-ink-muted text-center mt-3" style={{ fontSize: 15 }}>
          {t("subscriptionExpiredDesc")}
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onLogout}
          className="mt-8 rounded-2xl px-8 py-4"
          style={{ backgroundColor: c.primary }}
        >
          <Text className="text-white font-bold" style={{ fontSize: 15 }}>
            {t("subExpiredLogout")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
