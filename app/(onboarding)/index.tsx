import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { storage } from "../../services/storage";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { setCredentials } from "../../store/slices/authSlice";
import api from "../../services/api";
import DateTimePicker from "@react-native-community/datetimepicker";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TOTAL_STEPS = 8;

// YYYY-MM-DD formatter using local time — <input type="date"> expects this
// exact shape; .toISOString() would shift across timezones.
function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface OnboardingAnswers {
  language?: string;
  gender?: string;
  age?: string;
  problems?: string[];
  daily_time?: string;
  exam_date?: string;
}

export default function OnboardingScreen() {
  const { isAuthenticated, user, token } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = (nextStep: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(nextStep);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
      ]).start();
    });
  };

  const selectOption = (key: string, value: string, nextStep: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    animateTransition(nextStep);
  };

  const toggleProblem = (value: string) => {
    setSelectedProblems((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  };

  const goToStep = (step: number) => {
    if (step === 5 && currentStep === 4) {
      setAnswers((prev) => ({ ...prev, problems: selectedProblems }));
    }
    animateTransition(step);
  };

  const finishDate = () => {
    setAnswers((prev) => ({ ...prev, exam_date: examDate.toISOString() }));
    animateTransition(8);
  };

  const getDaysUntilExam = () => {
    const today = new Date();
    const diff = Math.abs(examDate.getTime() - today.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const completeOnboarding = async () => {
    const finalData = {
      ...answers,
      problems: selectedProblems,
      exam_date: examDate.toISOString(),
    };

    setSaving(true);
    try {
      if (isAuthenticated && token) {
        // User is already logged in — save via API
        const response = await api.patch("/users/onboarding", finalData);
        // Update Redux store with the new onboarding data
        if (user) {
          dispatch(
            setCredentials({
              user: { ...user, onboarding: { ...finalData, completed_at: new Date().toISOString() } },
              token,
            })
          );
        }
        await storage.setItem("onboarding_completed", "true");
        router.replace("/(tabs)");
      } else {
        // User is not logged in — save locally, go to login
        await storage.setItem("onboarding_data", JSON.stringify(finalData));
        await storage.setItem("onboarding_completed", "true");
        router.replace("/(auth)/login");
      }
    } catch (error) {
      Alert.alert("Xatolik", "Ma'lumotlarni saqlashda xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setSaving(false);
    }
  };

  const renderDots = () => {
    const dotCount = 6;
    const dotIndex = Math.min(Math.floor((currentStep - 1) / 1.3), dotCount - 1);
    return (
      <View className="flex-row justify-center items-center gap-2 mt-6 mb-4">
        {Array.from({ length: dotCount }).map((_, i) => (
          <View
            key={i}
            style={{
              width: i === dotIndex ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                i === dotIndex ? "#A855F7" : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </View>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View className="flex-1">
            <View className="w-16 h-16 rounded-2xl bg-purple-500/20 items-center justify-center self-center mb-6">
              <Text className="text-3xl">🚗</Text>
            </View>
            <Text className="text-white text-2xl font-bold text-center mb-2 leading-8">
              Pravaga birinchi urinishda topshirishga tayyormisiz?
            </Text>
            <Text className="text-white/50 text-base text-center mb-6">
              Tilni tanlang
            </Text>
            <View className="gap-3">
              <OptionButton
                emoji="🇺🇿"
                label="O'zbekcha (lotin)"
                onPress={() => selectOption("language", "uz", 2)}
              />
              <OptionButton
                emoji="🇺🇿"
                label="Ўзбекча (кирил)"
                onPress={() => selectOption("language", "uz_cyrl", 2)}
              />
              <OptionButton
                emoji="🇷🇺"
                label="Русский"
                onPress={() => selectOption("language", "ru", 2)}
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold text-center mb-2">
              Jinsingizni tanlang
            </Text>
            <Text className="text-white/50 text-base text-center mb-8">
              Shaxsiy rejani to'g'ri shakllantirish uchun
            </Text>
            <View className="flex-row gap-4">
              <GenderCard
                emoji="👨"
                label="Erkak"
                onPress={() => selectOption("gender", "male", 3)}
              />
              <GenderCard
                emoji="👩"
                label="Ayol"
                onPress={() => selectOption("gender", "female", 3)}
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold text-center mb-6">
              Yoshingiz nechida?
            </Text>
            <View className="gap-3">
              <OptionButton label="17 - 19" onPress={() => selectOption("age", "17-19", 4)} />
              <OptionButton label="20 - 24" onPress={() => selectOption("age", "20-24", 4)} />
              <OptionButton label="25 - 30" onPress={() => selectOption("age", "25-30", 4)} />
              <OptionButton label="31 - 35" onPress={() => selectOption("age", "31-35", 4)} />
              <OptionButton
                label="36 va undan katta"
                onPress={() => selectOption("age", "36+", 4)}
              />
            </View>
          </View>
        );

      case 4:
        return (
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold text-center mb-2">
              Sizga nima ko'proq muammo tug'diryapti?
            </Text>
            <Text className="text-white/50 text-base text-center mb-6">
              Bir nechtasini tanlashingiz mumkin
            </Text>
            <View className="gap-3">
              <CheckboxButton
                label="Vaqtim juda kam ⏱️"
                checked={selectedProblems.includes("time")}
                onPress={() => toggleProblem("time")}
              />
              <CheckboxButton
                label="Chiptalar juda murakkab 🤯"
                checked={selectedProblems.includes("hard")}
                onPress={() => toggleProblem("hard")}
              />
              <CheckboxButton
                label="O'qiganimni tez unutib qo'yaman 🧠"
                checked={selectedProblems.includes("forget")}
                onPress={() => toggleProblem("forget")}
              />
              <CheckboxButton
                label="Birinchi marta topshiryapman 🔰"
                checked={selectedProblems.includes("first_time")}
                onPress={() => toggleProblem("first_time")}
              />
            </View>
            <View className="mt-auto">
              <PrimaryButton label="Keyingi →" onPress={() => goToStep(5)} />
            </View>
          </View>
        );

      case 5:
        return (
          <View className="flex-1 items-center">
            <View
              className="w-16 h-16 rounded-2xl bg-purple-500/20 items-center justify-center mb-6"
              style={{
                shadowColor: "#A855F7",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 15,
              }}
            >
              <Text className="text-3xl">💡</Text>
            </View>
            <Text className="text-white text-2xl font-bold text-center mb-6">
              Bizda aynan siz uchun yechim bor
            </Text>
            <View className="gap-2 w-full">
              <InfoItem text="Kuniga atigi 15 daqiqa ajratsangiz yetarli" />
              <InfoItem text="Qiziqarli video tushuntirishlar" />
              <InfoItem text="Sun'iy intellekt xatolaringiz ustida ishlashga yordam beradi" />
            </View>
            <View className="mt-auto w-full">
              <PrimaryButton label="Davom etish" onPress={() => goToStep(6)} />
            </View>
          </View>
        );

      case 6:
        return (
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold text-center mb-6">
              Tayyorgarlik uchun kuniga qancha vaqt ajrata olasiz?
            </Text>
            <View className="gap-3">
              <OptionButton
                label="15-20 daqiqa (Sekin va ishonchli)"
                onPress={() => selectOption("daily_time", "15m", 7)}
              />
              <OptionButton
                label="30-45 daqiqa (O'rtacha temp)"
                onPress={() => selectOption("daily_time", "30m", 7)}
              />
              <OptionButton
                label="1 soat (Tezkor)"
                onPress={() => selectOption("daily_time", "1h", 7)}
              />
              <OptionButton
                label="1 soatdan ko'p (Intensiv)"
                onPress={() => selectOption("daily_time", "2h", 7)}
              />
            </View>
          </View>
        );

      case 7:
        return (
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold text-center mb-2">
              Imtihoningiz qachon?
            </Text>
            <Text className="text-white/50 text-base text-center mb-8">
              Taxminiy sanani tanlang
            </Text>
            {Platform.OS === "web" ? (
              <View className="bg-white/5 border border-white/20 rounded-2xl p-4 mb-4 relative">
                <Text className="text-white text-base text-center font-medium">
                  📅 {examDate.toLocaleDateString("uz-UZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
                {/* Transparent native date input overlaid on the pill —
                    @react-native-community/datetimepicker doesn't work on web. */}
                <input
                  type="date"
                  value={toDateInputValue(examDate)}
                  min={toDateInputValue(new Date())}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    if (v) setExamDate(new Date(v));
                  }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    width: "100%",
                    height: "100%",
                    cursor: "pointer",
                    border: "none",
                    background: "transparent",
                    colorScheme: "dark",
                  }}
                />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  className="bg-white/5 border border-white/20 rounded-2xl p-4 mb-4"
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text className="text-white text-base text-center font-medium">
                    📅 {examDate.toLocaleDateString("uz-UZ", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={examDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    minimumDate={new Date()}
                    themeVariant="dark"
                    onChange={(_event, date) => {
                      setShowDatePicker(Platform.OS === "ios");
                      if (date) setExamDate(date);
                    }}
                  />
                )}
              </>
            )}
            <View className="mt-auto">
              <PrimaryButton label="Rejani hisoblash ⚙️" onPress={finishDate} />
            </View>
          </View>
        );

      case 8:
        return (
          <View className="flex-1 items-center">
            <Text className="text-white text-2xl font-bold text-center mb-6">
              🎯 Shaxsiy rejangiz tayyor!
            </Text>
            <View className="bg-white/5 border border-white/10 rounded-3xl p-6 w-full">
              <View className="flex-row justify-between mb-3">
                <Text className="text-white/60">📅 Imtihongacha:</Text>
                <Text className="text-white font-bold">{getDaysUntilExam()} kun</Text>
              </View>
              <View className="h-px bg-white/10 my-4" />
              <Text className="text-purple-400 text-xs font-bold tracking-widest mb-3">
                KUNLIK REJA
              </Text>
              <View className="flex-row justify-between mb-3">
                <Text className="text-white">📝 Testlar:</Text>
                <Text className="text-white font-bold">kuniga ~30 ta</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-white">🎬 Videolar:</Text>
                <Text className="text-white font-bold">kuniga ~2 ta</Text>
              </View>
            </View>
            <View className="mt-auto w-full">
              <TouchableOpacity
                className="rounded-2xl py-4 items-center overflow-hidden"
                onPress={completeOnboarding}
                activeOpacity={0.8}
                disabled={saving}
              >
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                  }}
                />
                <Text className="text-white text-base font-semibold">
                  {saving
                    ? "⏳ Saqlanmoqda..."
                    : isAuthenticated
                    ? "🚀 Boshlash"
                    : "🚀 Ro'yxatdan o'tish va Boshlash"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: "#020617" }}>
      <StatusBar barStyle="light-content" />
      {/* Background gradient orbs */}
      <View
        style={{
          position: "absolute",
          top: -50,
          left: -50,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: "rgba(168, 85, 247, 0.15)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: "rgba(59, 130, 246, 0.1)",
        }}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: Platform.OS === "ios" ? 70 : 50,
          paddingBottom: 30,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          className="flex-1"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {renderStep()}
        </Animated.View>
        {renderDots()}
      </ScrollView>
    </View>
  );
}

// --- Reusable Sub-Components ---

function OptionButton({
  label,
  emoji,
  onPress,
}: {
  label: string;
  emoji?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex-row items-center"
      onPress={onPress}
      activeOpacity={0.7}
    >
      {emoji && <Text className="text-xl mr-3">{emoji}</Text>}
      <Text className="text-white text-base font-medium">{label}</Text>
    </TouchableOpacity>
  );
}

function GenderCard({
  emoji,
  label,
  onPress,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="flex-1 bg-white/5 border border-white/10 rounded-3xl py-6 items-center"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text className="text-5xl mb-3">{emoji}</Text>
      <Text className="text-white text-base font-medium">{label}</Text>
    </TouchableOpacity>
  );
}

function CheckboxButton({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className={`rounded-2xl px-5 py-4 border ${
        checked
          ? "bg-purple-500/20 border-purple-500"
          : "bg-white/5 border-white/10"
      }`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text className="text-white text-base font-medium">{label}</Text>
    </TouchableOpacity>
  );
}

function InfoItem({ text }: { text: string }) {
  return (
    <View className="bg-white/5 rounded-2xl p-4 flex-row items-center">
      <View className="w-6 h-6 rounded-full bg-emerald-500 items-center justify-center mr-3">
        <Text className="text-white text-xs font-bold">✓</Text>
      </View>
      <Text className="text-white text-sm flex-1">{text}</Text>
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="rounded-2xl py-4 items-center overflow-hidden"
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={["#A855F7", "#6366F1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
      />
      <Text className="text-white text-base font-semibold">{label}</Text>
    </TouchableOpacity>
  );
}
