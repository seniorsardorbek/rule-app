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
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useLogin } from "../../services/auth";

const schema = z.object({
  phone_number: z.string().min(9, "Enter a valid phone number"),
  password: z.string().min(6, "Min 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const loginMutation = useLogin();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone_number: "",
      password: "",
    },
  });

  const onSubmit = (data: FormData) => {
    console.log(data)
    loginMutation.mutate(data, {
      onSuccess: () => {
        router.replace("/(tabs)");
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.message || "Login failed. Please try again.";
        Alert.alert("Error", message);
      },
    });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 justify-center px-8">
          <View className="mb-10">
            <Text className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
              Welcome back
            </Text>
            <Text className="text-lg text-slate-500 font-medium">
              Sign in to your account
            </Text>
          </View>

          <Controller
            control={control}
            name="phone_number"
            render={({ field: { onChange, value } }) => (
              <View className="mb-5">
                <Text className="text-sm font-semibold text-slate-700 mb-2 ml-1">
                  Phone Number
                </Text>
                <View className="bg-white rounded-2xl px-5 py-4 shadow-sm shadow-slate-200/50 border border-slate-100">
                  <TextInput
                    className="text-base text-slate-900 font-medium"
                    placeholder="+998 90 123 45 67"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    onChangeText={onChange}
                    value={value}
                  />
                </View>
                {errors.phone_number && (
                  <Text className="text-red-500 text-sm mt-2 ml-1 font-medium:">
                    {errors.phone_number.message}
                  </Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <View className="mb-8">
                <Text className="text-sm font-semibold text-slate-700 mb-2 ml-1">
                  Password
                </Text>
                <View className="bg-white rounded-2xl px-5 py-4 shadow-sm shadow-slate-200/50 border border-slate-100">
                  <TextInput
                    className="text-base text-slate-900 font-medium"
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    onChangeText={onChange}
                    value={value}
                  />
                </View>
                {errors.password && (
                  <Text className="text-red-500 text-sm mt-2 ml-1 font-medium">
                    {errors.password.message}
                  </Text>
                )}
              </View>
            )}
          />

          <TouchableOpacity
            className={`rounded-2xl py-4 items-center shadow-md shadow-indigo-600/30 ${loginMutation.isPending ? "bg-indigo-400" : "bg-indigo-600"}`}
            onPress={handleSubmit(onSubmit)}
            disabled={loginMutation.isPending}
            activeOpacity={0.8}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-lg font-bold tracking-wide">Sign In</Text>
            )}
          </TouchableOpacity>

        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
