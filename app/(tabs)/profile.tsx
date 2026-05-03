import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { setLang, type AppLang } from "../../store/slices/langSlice";
import { logout } from "../../services/auth";
import { setThemeMode } from "../../services/theme";
import { useT } from "../../services/i18n";
import { useThemeColors } from "../../theme/colors";

const LANG_OPTIONS: { value: AppLang; primary: string; secondary: string }[] = [
  { value: "uz", primary: "O'zbek", secondary: "Lotin" },
  { value: "oz", primary: "Ўзбек", secondary: "Кирилл" },
  { value: "ru", primary: "Русский", secondary: "RU" },
];

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const t = useT();
  const colors = useThemeColors();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const user = useAppSelector((s) => s.auth.user);
  const currentLang = useAppSelector((s) => s.lang.lang);

  const displayName = user
    ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`
    : "User";
  const initials = getInitials(user?.first_name, user?.last_name);

  const menuItems: { icon: keyof typeof Ionicons.glyphMap; label: string; trailing?: string }[] = [
    { icon: "notifications-outline", label: t("notifications"), trailing: "Yoqilgan" },
    { icon: "shield-checkmark-outline", label: t("privacy") },
    { icon: "help-circle-outline", label: t("helpSupport") },
    { icon: "information-circle-outline", label: t("about"), trailing: "v2.4" },
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
    <SafeAreaView className="flex-1 bg-page dark:bg-page-dark">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 py-4 pb-32"
      >
        {/* Hero avatar */}
        <View className="items-center mt-2 mb-5">
          <LinearGradient
            colors={[colors.primary, colors.primaryDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 88,
              height: 88,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.35,
              shadowRadius: 32,
              elevation: 8,
            }}
          >
            <Text
              className="text-white font-extrabold"
              style={{ fontSize: 30, letterSpacing: -0.5 }}
            >
              {initials}
            </Text>
          </LinearGradient>
          <Text
            className="font-extrabold text-ink dark:text-ink-onDark"
            style={{ fontSize: 20, letterSpacing: -0.4 }}
          >
            {displayName}
          </Text>
          <Text className="text-ink-muted dark:text-ink-mutedOnDark text-[13px] mt-0.5">
            {user?.phone_number ?? ""}
          </Text>
          {user?.role ? (
            <View
              className="flex-row items-center mt-2.5 rounded-full"
              style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                gap: 6,
                backgroundColor: colors.primarySoft,
              }}
            >
              <Ionicons name="flash" size={12} color={colors.primary} />
              <Text
                className="text-primary font-bold"
                style={{ fontSize: 11, letterSpacing: 0.4 }}
              >
                {user.role}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Stats row */}
        <View className="flex-row gap-2 mb-4">
          <StatCard value="342" label={t("correct")} />
          <StatCard value="78%" label="Aniqlik" />
          <StatCard value="12" label="Streak" />
        </View>

        {/* Theme toggle */}
        <View
          className="bg-surface dark:bg-surface-dark rounded-2xl border border-edge dark:border-edge-dark p-4 mb-3 flex-row items-center"
          style={{ gap: 12 }}
        >
          <View
            className="w-9 h-9 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.surfaceSoft }}
          >
            <Ionicons
              name={isDark ? "moon" : "sunny"}
              size={16}
              color={colors.inkMid}
            />
          </View>
          <View className="flex-1">
            <Text
              className="font-bold text-ink dark:text-ink-onDark"
              style={{ fontSize: 13.5 }}
            >
              {isDark ? "Tungi rejim" : "Kunduzgi rejim"}
            </Text>
            <Text
              className="text-ink-muted dark:text-ink-mutedOnDark"
              style={{ fontSize: 11 }}
            >
              {isDark ? "Tungi mavzu yoqilgan" : "Tungi mavzuni yoqing"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setThemeMode(isDark ? "light" : "dark")}
            activeOpacity={0.8}
            className="rounded-full"
            style={{
              width: 50,
              height: 28,
              padding: 2,
              backgroundColor: isDark ? colors.primary : colors.surfaceSoft,
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                backgroundColor: "#fff",
                alignSelf: isDark ? "flex-end" : "flex-start",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 2,
              }}
            />
          </TouchableOpacity>
        </View>

        {/* Language selector */}
        <View className="bg-surface dark:bg-surface-dark rounded-2xl border border-edge dark:border-edge-dark p-4 mb-3">
          <View className="flex-row items-center gap-2.5 mb-3">
            <Ionicons name="globe-outline" size={18} color={colors.primary} />
            <View className="flex-1">
              <Text
                className="font-bold text-ink dark:text-ink-onDark"
                style={{ fontSize: 13.5 }}
              >
                {t("language")}
              </Text>
              <Text
                className="text-ink-muted dark:text-ink-mutedOnDark"
                style={{ fontSize: 11 }}
              >
                {t("languageDesc")}
              </Text>
            </View>
          </View>
          <View className="flex-row gap-1.5">
            {LANG_OPTIONS.map(({ value, primary, secondary }) => {
              const isActive = currentLang === value;
              return (
                <TouchableOpacity
                  key={value}
                  className="flex-1 items-center rounded-xl border"
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 6,
                    backgroundColor: isActive ? colors.primarySoft : "transparent",
                    borderColor: isActive ? colors.primary : colors.border,
                  }}
                  onPress={() => dispatch(setLang(value))}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`font-bold ${
                      isActive ? "text-primary" : "text-ink dark:text-ink-onDark"
                    }`}
                    style={{ fontSize: 12 }}
                    numberOfLines={1}
                  >
                    {primary}
                  </Text>
                  <Text
                    className="text-ink-muted dark:text-ink-mutedOnDark mt-0.5"
                    style={{ fontSize: 10 }}
                  >
                    {secondary}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Settings rows */}
        <View className="gap-1.5">
          {menuItems.map((item) => (
            <View
              key={item.label}
              className="flex-row items-center bg-surface dark:bg-surface-dark rounded-2xl border border-edge dark:border-edge-dark"
              style={{ paddingHorizontal: 14, paddingVertical: 12, gap: 12 }}
            >
              <View
                className="w-9 h-9 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.surfaceSoft }}
              >
                <Ionicons name={item.icon} size={16} color={colors.inkMid} />
              </View>
              <Text
                className="flex-1 font-semibold text-ink dark:text-ink-onDark"
                style={{ fontSize: 13.5 }}
              >
                {item.label}
              </Text>
              {item.trailing ? (
                <Text
                  className="text-ink-muted dark:text-ink-mutedOnDark"
                  style={{ fontSize: 12 }}
                >
                  {item.trailing}
                </Text>
              ) : null}
              <Ionicons name="chevron-forward" size={14} color={colors.inkDim} />
            </View>
          ))}
        </View>

        <TouchableOpacity
          className="mt-3.5 bg-danger-50 border rounded-2xl flex-row items-center justify-center"
          style={{
            paddingVertical: 14,
            paddingHorizontal: 16,
            gap: 8,
            borderColor: "rgba(245,111,114,0.25)",
          }}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={16} color={colors.danger} />
          <Text
            className="text-danger font-bold"
            style={{ fontSize: 14 }}
          >
            {t("signOut")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View
      className="flex-1 bg-surface dark:bg-surface-dark rounded-2xl border border-edge dark:border-edge-dark items-center"
      style={{ paddingVertical: 14 }}
    >
      <Text
        className="font-extrabold text-ink dark:text-ink-onDark"
        style={{ fontSize: 20, letterSpacing: -0.5, lineHeight: 22 }}
      >
        {value}
      </Text>
      <Text
        className="text-ink-muted dark:text-ink-mutedOnDark mt-1"
        style={{ fontSize: 11 }}
      >
        {label}
      </Text>
    </View>
  );
}

function getInitials(first?: string | null, last?: string | null): string {
  const a = first?.trim()?.[0] ?? "";
  const b = last?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "U";
}
