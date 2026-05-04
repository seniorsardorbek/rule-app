import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useLogin } from "../../services/auth";
import { useT } from "../../services/i18n";
import { useThemeColors } from "../../theme/colors";

function formatUzPhone(digits: string): string {
  const d = digits.slice(0, 9);
  const parts: string[] = [];
  if (d.length > 0) parts.push(d.slice(0, 2));
  if (d.length > 2) parts.push(d.slice(2, 5));
  if (d.length > 5) parts.push(d.slice(5, 7));
  if (d.length > 7) parts.push(d.slice(7, 9));
  return parts.join(" ");
}

function stripDigits(input: string): string {
  return input.replace(/\D+/g, "").slice(0, 9);
}

const schema = z.object({
  phone_digits: z.string().length(9, "invalidPhone"),
  password: z.string().min(6, "passwordMin"),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const t = useT();
  const c = useThemeColors();
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { phone_digits: "", password: "" },
  });

  const onSubmit = (data: FormData) => {
    const phone_number = `+998${data.phone_digits}`;
    loginMutation.mutate(
      { phone_number, password: data.password },
      {
        onSuccess: () => router.replace("/(tabs)"),
        onError: (error: any) => {
          const message = error?.response?.data?.message ?? t("signInError");
          Alert.alert(t("signInBtn"), message);
        },
      },
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-page dark:bg-page-dark"
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 20,
              paddingTop: 32,
              paddingBottom: 32,
              justifyContent: "center",
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <LinearGradient
              colors={[c.primary, c.primaryDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 22,
                shadowColor: c.primary,
                shadowOffset: { width: 0, height: 14 },
                shadowOpacity: 0.32,
                shadowRadius: 26,
                elevation: 6,
              }}
            >
              <Ionicons name="car-sport" size={30} color="#fff" />
            </LinearGradient>

            <Text
              className="font-extrabold text-ink dark:text-ink-onDark"
              style={{ fontSize: 28, letterSpacing: -0.6, lineHeight: 34 }}
            >
              {t("welcomeBack")}
            </Text>
            <Text
              className="text-ink-muted dark:text-ink-mutedOnDark mt-1.5 mb-7"
              style={{ fontSize: 14 }}
            >
              {t("signInToContinue")}
            </Text>

            <Controller
              control={control}
              name="phone_digits"
              render={({ field: { onChange, value } }) => (
                <View className="mb-4">
                  <Text
                    className="font-semibold text-ink-mid dark:text-ink-midOnDark mb-2"
                    style={{ fontSize: 12.5, letterSpacing: 0.2 }}
                  >
                    {t("phoneNumberLabel")}
                  </Text>
                  <View
                    className="bg-surface dark:bg-surface-dark"
                    style={{
                      borderRadius: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      height: 54,
                      gap: 10,
                      borderWidth: 1,
                      borderColor: errors.phone_digits ? c.danger : c.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingRight: 10,
                        borderRightWidth: 1,
                        borderRightColor: c.border,
                        height: "60%",
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>🇺🇿</Text>
                      <Text
                        className="font-bold text-ink dark:text-ink-onDark"
                        style={{ fontSize: 14 }}
                      >
                        +998
                      </Text>
                    </View>
                    <TextInput
                      style={{
                        flex: 1,
                        fontSize: 15,
                        fontWeight: "600",
                        color: c.ink,
                        letterSpacing: 0.4,
                        ...(Platform.OS === "web"
                          ? ({ outlineStyle: "none" } as any)
                          : {}),
                      }}
                      placeholder="90 123 45 67"
                      placeholderTextColor={c.inkDim}
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      autoComplete="tel"
                      maxLength={13}
                      value={formatUzPhone(value)}
                      onChangeText={(text) => onChange(stripDigits(text))}
                    />
                  </View>
                  {errors.phone_digits ? (
                    <Text
                      className="mt-1.5 ml-1 font-medium"
                      style={{ fontSize: 12, color: c.danger }}
                    >
                      {t(errors.phone_digits.message as any)}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <View className="mb-2">
                  <Text
                    className="font-semibold text-ink-mid dark:text-ink-midOnDark mb-2"
                    style={{ fontSize: 12.5, letterSpacing: 0.2 }}
                  >
                    {t("passwordLabel")}
                  </Text>
                  <View
                    className="bg-surface dark:bg-surface-dark"
                    style={{
                      borderRadius: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      height: 54,
                      gap: 10,
                      borderWidth: 1,
                      borderColor: errors.password ? c.danger : c.border,
                    }}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={c.inkMid}
                    />
                    <TextInput
                      style={{
                        flex: 1,
                        fontSize: 15,
                        fontWeight: "600",
                        color: c.ink,
                        ...(Platform.OS === "web"
                          ? ({ outlineStyle: "none" } as any)
                          : {}),
                      }}
                      placeholder="••••••••"
                      placeholderTextColor={c.inkDim}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password"
                      onChangeText={onChange}
                      value={value}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={8}
                      accessibilityLabel={
                        showPassword ? t("hidePassword") : t("showPassword")
                      }
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={18}
                        color={c.inkMid}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password ? (
                    <Text
                      className="mt-1.5 ml-1 font-medium"
                      style={{ fontSize: 12, color: c.danger }}
                    >
                      {t(errors.password.message as any)}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={8}
              style={{ alignSelf: "flex-end", marginTop: 6, marginBottom: 22 }}
            >
              <Text
                className="font-bold"
                style={{ fontSize: 12.5, color: c.primary }}
              >
                {t("forgotPassword")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={loginMutation.isPending}
              activeOpacity={0.85}
              style={{ opacity: loginMutation.isPending ? 0.85 : 1 }}
            >
              <LinearGradient
                colors={[c.primary, c.primaryDeep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{
                  height: 56,
                  borderRadius: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  shadowColor: c.primary,
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.4,
                  shadowRadius: 22,
                  elevation: 6,
                }}
              >
                {loginMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: 15.5,
                      }}
                    >
                      {t("signInBtn")}
                    </Text>
                    <Ionicons name="arrow-forward" size={17} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View
              className="flex-row items-center justify-center mt-7"
              style={{ gap: 6 }}
            >
              <Text
                className="text-ink-muted dark:text-ink-mutedOnDark"
                style={{ fontSize: 13 }}
              >
                {t("noAccount")}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push("/(onboarding)")}
              >
                <Text
                  className="font-extrabold"
                  style={{ fontSize: 13, color: c.primary }}
                >
                  {t("signUpHere")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
