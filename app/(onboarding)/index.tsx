import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { storage } from "../../services/storage";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { setCredentials } from "../../store/slices/authSlice";
import api from "../../services/api";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useThemeColors, type ThemeColors } from "../../theme/colors";

const TOTAL_STEPS = 8;

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
  const c = useThemeColors();

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
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value],
    );
  };

  const goToStep = (step: number) => {
    if (step === 5 && currentStep === 4) {
      setAnswers((prev) => ({ ...prev, problems: selectedProblems }));
    }
    animateTransition(step);
  };

  const goBack = () => {
    if (currentStep > 1) animateTransition(currentStep - 1);
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
        await api.patch("/users/onboarding", finalData);
        if (user) {
          dispatch(
            setCredentials({
              user: {
                ...user,
                onboarding: {
                  ...finalData,
                  completed_at: new Date().toISOString(),
                },
              },
              token,
            }),
          );
        }
        await storage.setItem("onboarding_completed", "true");
        router.replace("/(tabs)");
      } else {
        await storage.setItem("onboarding_data", JSON.stringify(finalData));
        await storage.setItem("onboarding_completed", "true");
        router.replace("/(auth)/login");
      }
    } catch {
      Alert.alert(
        "Xatolik",
        "Ma'lumotlarni saqlashda xatolik yuz berdi. Qaytadan urinib ko'ring.",
      );
    } finally {
      setSaving(false);
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-page-dark" edges={["top", "bottom"]}>
      <StatusBar barStyle={Platform.OS === "ios" ? "dark-content" : "default"} />

      {/* Top nav: back + progress + step indicator */}
      <View className="flex-row items-center gap-3 px-5 pt-3 pb-3">
        <TouchableOpacity
          onPress={goBack}
          disabled={currentStep === 1}
          className="w-10 h-10 rounded-xl bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark items-center justify-center"
          activeOpacity={0.7}
          style={{ opacity: currentStep === 1 ? 0.4 : 1 }}
        >
          <Ionicons name="chevron-back" size={18} color={c.ink} />
        </TouchableOpacity>

        <View className="flex-1">
          <View
            className="h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: c.surfaceSoft }}
          >
            <LinearGradient
              colors={[c.primary, c.primaryDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: "100%",
                width: `${progress}%`,
                borderRadius: 999,
              }}
            />
          </View>
        </View>

        <View
          className="rounded-full"
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: c.primarySoft,
          }}
        >
          <Text
            className="font-extrabold"
            style={{ fontSize: 11, color: c.primary }}
          >
            {currentStep}/{TOTAL_STEPS}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 28,
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
          {currentStep === 1 ? (
            <Step1 c={c} onSelect={(v) => selectOption("language", v, 2)} />
          ) : currentStep === 2 ? (
            <Step2 c={c} onSelect={(v) => selectOption("gender", v, 3)} />
          ) : currentStep === 3 ? (
            <Step3 c={c} onSelect={(v) => selectOption("age", v, 4)} />
          ) : currentStep === 4 ? (
            <Step4
              c={c}
              selected={selectedProblems}
              onToggle={toggleProblem}
              onNext={() => goToStep(5)}
            />
          ) : currentStep === 5 ? (
            <Step5 c={c} onNext={() => goToStep(6)} />
          ) : currentStep === 6 ? (
            <Step6 c={c} onSelect={(v) => selectOption("daily_time", v, 7)} />
          ) : currentStep === 7 ? (
            <Step7
              c={c}
              examDate={examDate}
              onChangeDate={setExamDate}
              showPicker={showDatePicker}
              setShowPicker={setShowDatePicker}
              onNext={finishDate}
            />
          ) : currentStep === 8 ? (
            <Step8
              c={c}
              days={getDaysUntilExam()}
              isAuthenticated={isAuthenticated}
              saving={saving}
              onComplete={completeOnboarding}
            />
          ) : null}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface StepProps {
  c: ThemeColors;
}

function Eyebrow({ c, children }: StepProps & { children: string }) {
  return (
    <Text
      className="font-bold mb-2"
      style={{
        fontSize: 11,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: c.primary,
      }}
    >
      {children}
    </Text>
  );
}

function Heading({ children }: { children: string }) {
  return (
    <Text
      className="font-extrabold text-ink dark:text-ink-onDark mb-2"
      style={{ fontSize: 24, letterSpacing: -0.5, lineHeight: 30 }}
    >
      {children}
    </Text>
  );
}

function Subheading({ children }: { children: string }) {
  return (
    <Text
      className="text-ink-muted dark:text-ink-mutedOnDark mb-6"
      style={{ fontSize: 13.5, lineHeight: 19 }}
    >
      {children}
    </Text>
  );
}

function Step1({
  c,
  onSelect,
}: StepProps & { onSelect: (v: string) => void }) {
  return (
    <View>
      <HeroIcon c={c} icon="car-sport" />
      <Eyebrow c={c}>Boshlaymiz</Eyebrow>
      <Heading>Pravaga birinchi urinishda topshirishga tayyormisiz?</Heading>
      <Subheading>Tilni tanlang</Subheading>
      <View className="gap-2.5">
        <OptionRow
          c={c}
          emoji="🇺🇿"
          label="O'zbekcha (lotin)"
          onPress={() => onSelect("uz")}
        />
        <OptionRow
          c={c}
          emoji="🇺🇿"
          label="Ўзбекча (кирил)"
          onPress={() => onSelect("uz_cyrl")}
        />
        <OptionRow
          c={c}
          emoji="🇷🇺"
          label="Русский"
          onPress={() => onSelect("ru")}
        />
      </View>
    </View>
  );
}

function Step2({
  c,
  onSelect,
}: StepProps & { onSelect: (v: string) => void }) {
  return (
    <View>
      <HeroIcon c={c} icon="people" />
      <Eyebrow c={c}>2-qadam</Eyebrow>
      <Heading>Jinsingizni tanlang</Heading>
      <Subheading>Shaxsiy rejani to'g'ri shakllantirish uchun</Subheading>
      <View className="flex-row gap-3">
        <GenderCard c={c} emoji="👨" label="Erkak" onPress={() => onSelect("male")} />
        <GenderCard c={c} emoji="👩" label="Ayol" onPress={() => onSelect("female")} />
      </View>
    </View>
  );
}

function Step3({
  c,
  onSelect,
}: StepProps & { onSelect: (v: string) => void }) {
  return (
    <View>
      <HeroIcon c={c} icon="calendar" />
      <Eyebrow c={c}>3-qadam</Eyebrow>
      <Heading>Yoshingiz nechida?</Heading>
      <Subheading>Eng mos darslarni tayyorlaymiz</Subheading>
      <View className="gap-2.5">
        <OptionRow c={c} label="17 — 19" onPress={() => onSelect("17-19")} />
        <OptionRow c={c} label="20 — 24" onPress={() => onSelect("20-24")} />
        <OptionRow c={c} label="25 — 30" onPress={() => onSelect("25-30")} />
        <OptionRow c={c} label="31 — 35" onPress={() => onSelect("31-35")} />
        <OptionRow c={c} label="36 va undan katta" onPress={() => onSelect("36+")} />
      </View>
    </View>
  );
}

function Step4({
  c,
  selected,
  onToggle,
  onNext,
}: StepProps & {
  selected: string[];
  onToggle: (v: string) => void;
  onNext: () => void;
}) {
  const items: { key: string; label: string; emoji: string }[] = [
    { key: "time", label: "Vaqtim juda kam", emoji: "⏱️" },
    { key: "hard", label: "Chiptalar juda murakkab", emoji: "🤯" },
    { key: "forget", label: "O'qiganimni tez unutib qo'yaman", emoji: "🧠" },
    { key: "first_time", label: "Birinchi marta topshiryapman", emoji: "🔰" },
  ];
  return (
    <View className="flex-1">
      <HeroIcon c={c} icon="alert-circle" />
      <Eyebrow c={c}>4-qadam</Eyebrow>
      <Heading>Sizga nima ko'proq muammo tug'diryapti?</Heading>
      <Subheading>Bir nechtasini tanlashingiz mumkin</Subheading>
      <View className="gap-2.5">
        {items.map((item) => (
          <CheckboxRow
            key={item.key}
            c={c}
            label={item.label}
            emoji={item.emoji}
            checked={selected.includes(item.key)}
            onPress={() => onToggle(item.key)}
          />
        ))}
      </View>
      <View className="mt-8">
        <PrimaryButton
          c={c}
          label="Keyingi"
          icon="arrow-forward"
          onPress={onNext}
          disabled={selected.length === 0}
        />
      </View>
    </View>
  );
}

function Step5({ c, onNext }: StepProps & { onNext: () => void }) {
  const items = [
    "Kuniga atigi 15 daqiqa ajratsangiz yetarli",
    "Qiziqarli video tushuntirishlar",
    "Sun'iy intellekt xatolaringiz ustida ishlashga yordam beradi",
  ];
  return (
    <View className="flex-1">
      <HeroIcon c={c} icon="bulb" tint="success" />
      <Eyebrow c={c}>Tayyormiz</Eyebrow>
      <Heading>Bizda aynan siz uchun yechim bor</Heading>
      <Subheading>Quyidagilarni qoʻlga kiritasiz</Subheading>
      <View className="gap-2.5">
        {items.map((text) => (
          <View
            key={text}
            className="flex-row items-center bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark"
            style={{ borderRadius: 16, padding: 14, gap: 12 }}
          >
            <View
              className="w-7 h-7 rounded-lg items-center justify-center"
              style={{ backgroundColor: c.successSoft }}
            >
              <Ionicons name="checkmark" size={16} color={c.success} />
            </View>
            <Text
              className="text-ink dark:text-ink-onDark flex-1"
              style={{ fontSize: 13.5, lineHeight: 19 }}
            >
              {text}
            </Text>
          </View>
        ))}
      </View>
      <View className="mt-8">
        <PrimaryButton
          c={c}
          label="Davom etish"
          icon="arrow-forward"
          onPress={onNext}
        />
      </View>
    </View>
  );
}

function Step6({
  c,
  onSelect,
}: StepProps & { onSelect: (v: string) => void }) {
  const opts: { key: string; label: string; sub: string }[] = [
    { key: "15m", label: "15-20 daqiqa", sub: "Sekin va ishonchli" },
    { key: "30m", label: "30-45 daqiqa", sub: "O'rtacha temp" },
    { key: "1h", label: "1 soat", sub: "Tezkor" },
    { key: "2h", label: "1 soatdan ko'p", sub: "Intensiv" },
  ];
  return (
    <View>
      <HeroIcon c={c} icon="time" />
      <Eyebrow c={c}>6-qadam</Eyebrow>
      <Heading>Tayyorgarlik uchun kuniga qancha vaqt?</Heading>
      <Subheading>Reja shu rejimga moslanadi</Subheading>
      <View className="gap-2.5">
        {opts.map((o) => (
          <TwoLineRow
            key={o.key}
            c={c}
            label={o.label}
            sub={o.sub}
            onPress={() => onSelect(o.key)}
          />
        ))}
      </View>
    </View>
  );
}

function Step7({
  c,
  examDate,
  onChangeDate,
  showPicker,
  setShowPicker,
  onNext,
}: StepProps & {
  examDate: Date;
  onChangeDate: (d: Date) => void;
  showPicker: boolean;
  setShowPicker: (v: boolean) => void;
  onNext: () => void;
}) {
  const formatted = examDate.toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <View className="flex-1">
      <HeroIcon c={c} icon="flag" />
      <Eyebrow c={c}>7-qadam</Eyebrow>
      <Heading>Imtihoningiz qachon?</Heading>
      <Subheading>Taxminiy sanani tanlang — kunlik maqsad shu boʻyicha hisoblanadi</Subheading>

      {Platform.OS === "web" ? (
        <View
          className="bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark relative"
          style={{
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: c.primarySoft }}
          >
            <Ionicons name="calendar" size={18} color={c.primary} />
          </View>
          <Text
            className="text-ink dark:text-ink-onDark font-semibold flex-1"
            style={{ fontSize: 15 }}
          >
            {formatted}
          </Text>
          <Ionicons name="chevron-down" size={16} color={c.inkDim} />
          <input
            type="date"
            value={toDateInputValue(examDate)}
            min={toDateInputValue(new Date())}
            onChange={(e) => {
              const v = e.currentTarget.value;
              if (v) onChangeDate(new Date(v));
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
            }}
          />
        </View>
      ) : (
        <>
          <TouchableOpacity
            className="bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark"
            style={{
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.7}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: c.primarySoft }}
            >
              <Ionicons name="calendar" size={18} color={c.primary} />
            </View>
            <Text
              className="text-ink dark:text-ink-onDark font-semibold flex-1"
              style={{ fontSize: 15 }}
            >
              {formatted}
            </Text>
            <Ionicons name="chevron-down" size={16} color={c.inkDim} />
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={examDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date()}
              onChange={(_event, date) => {
                setShowPicker(Platform.OS === "ios");
                if (date) onChangeDate(date);
              }}
            />
          )}
        </>
      )}

      <View className="mt-8">
        <PrimaryButton
          c={c}
          label="Rejani hisoblash"
          icon="sparkles"
          onPress={onNext}
        />
      </View>
    </View>
  );
}

function Step8({
  c,
  days,
  isAuthenticated,
  saving,
  onComplete,
}: StepProps & {
  days: number;
  isAuthenticated: boolean;
  saving: boolean;
  onComplete: () => void;
}) {
  const dailyQuestions = Math.max(10, Math.round(720 / Math.max(1, days)));
  const dailyQuizzes = Math.max(1, Math.round(dailyQuestions / 20));
  return (
    <View className="flex-1">
      {/* Hero summary card */}
      <LinearGradient
        colors={[c.primary, c.primaryDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24,
          padding: 22,
          overflow: "hidden",
          shadowColor: c.primary,
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.3,
          shadowRadius: 32,
          elevation: 6,
        }}
      >
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center mb-3"
          style={{ backgroundColor: "rgba(255,255,255,0.22)" }}
        >
          <Ionicons name="trophy" size={22} color="#fff" />
        </View>
        <Text
          className="text-white font-extrabold"
          style={{ fontSize: 22, letterSpacing: -0.4 }}
        >
          Shaxsiy rejangiz tayyor!
        </Text>
        <Text
          className="text-white/90 mt-1.5"
          style={{ fontSize: 13, lineHeight: 18 }}
        >
          Imtihongacha {days} kun. Reja kuniga moslashadi.
        </Text>
      </LinearGradient>

      {/* Plan stats */}
      <View
        className="bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark mt-4"
        style={{ borderRadius: 20, padding: 18 }}
      >
        <Text
          className="font-bold mb-3"
          style={{
            fontSize: 11,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: c.primary,
          }}
        >
          Kunlik reja
        </Text>
        <PlanRow
          c={c}
          icon="document-text"
          label="Savollar"
          value={`~${dailyQuestions} ta / kun`}
        />
        <View
          style={{
            height: 1,
            backgroundColor: c.border,
            marginVertical: 12,
          }}
        />
        <PlanRow
          c={c}
          icon="reader"
          label="Testlar"
          value={`~${dailyQuizzes} ta / kun`}
        />
        <View
          style={{
            height: 1,
            backgroundColor: c.border,
            marginVertical: 12,
          }}
        />
        <PlanRow
          c={c}
          icon="calendar"
          label="Imtihongacha"
          value={`${days} kun`}
        />
      </View>

      <View className="mt-8">
        <PrimaryButton
          c={c}
          label={
            saving
              ? "Saqlanmoqda..."
              : isAuthenticated
                ? "Boshlash"
                : "Roʻyxatdan oʻtish va boshlash"
          }
          icon={saving ? undefined : "rocket"}
          onPress={onComplete}
          disabled={saving}
          loading={saving}
        />
      </View>
    </View>
  );
}

// ──────── Reusable bits ────────

function HeroIcon({
  c,
  icon,
  tint = "primary",
}: StepProps & {
  icon: keyof typeof Ionicons.glyphMap;
  tint?: "primary" | "success";
}) {
  const colors =
    tint === "success"
      ? ([c.success, "#16A34A"] as const)
      : ([c.primary, c.primaryDeep] as const);
  const glow = tint === "success" ? c.success : c.primary;
  return (
    <LinearGradient
      colors={colors as unknown as readonly [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: 56,
        height: 56,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        shadowColor: glow,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 5,
      }}
    >
      <Ionicons name={icon} size={26} color="#fff" />
    </LinearGradient>
  );
}

function OptionRow({
  c,
  label,
  emoji,
  onPress,
}: StepProps & { label: string; emoji?: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark"
      style={{
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {emoji ? (
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      ) : (
        <View
          className="w-7 h-7 rounded-lg items-center justify-center"
          style={{ backgroundColor: c.primarySoft }}
        >
          <Ionicons name="ellipse" size={8} color={c.primary} />
        </View>
      )}
      <Text
        className="text-ink dark:text-ink-onDark flex-1"
        style={{ fontSize: 14.5, fontWeight: "600" }}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={c.inkDim} />
    </TouchableOpacity>
  );
}

function TwoLineRow({
  c,
  label,
  sub,
  onPress,
}: StepProps & { label: string; sub: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark"
      style={{
        borderRadius: 16,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View className="flex-1">
        <Text
          className="text-ink dark:text-ink-onDark font-bold"
          style={{ fontSize: 14.5 }}
        >
          {label}
        </Text>
        <Text
          className="text-ink-muted dark:text-ink-mutedOnDark mt-0.5"
          style={{ fontSize: 12 }}
        >
          {sub}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={c.inkDim} />
    </TouchableOpacity>
  );
}

function GenderCard({
  c,
  emoji,
  label,
  onPress,
}: StepProps & { emoji: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-1 bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark"
      style={{
        borderRadius: 22,
        paddingVertical: 28,
        alignItems: "center",
      }}
    >
      <View
        className="w-16 h-16 rounded-2xl items-center justify-center mb-3"
        style={{ backgroundColor: c.primarySoft }}
      >
        <Text style={{ fontSize: 32 }}>{emoji}</Text>
      </View>
      <Text
        className="text-ink dark:text-ink-onDark font-bold"
        style={{ fontSize: 14.5 }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function CheckboxRow({
  c,
  label,
  emoji,
  checked,
  onPress,
}: StepProps & {
  label: string;
  emoji: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        borderRadius: 16,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: checked ? c.primarySoft : c.surface,
        borderWidth: 1.5,
        borderColor: checked ? c.primary : c.border,
        shadowColor: checked ? c.primary : "transparent",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: checked ? 0.18 : 0,
        shadowRadius: 12,
        elevation: checked ? 2 : 0,
      }}
    >
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text
        className="text-ink dark:text-ink-onDark flex-1"
        style={{ fontSize: 14, fontWeight: "600" }}
      >
        {label}
      </Text>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          backgroundColor: checked ? c.primary : "transparent",
          borderWidth: 1.5,
          borderColor: checked ? c.primary : c.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
      </View>
    </TouchableOpacity>
  );
}

function PrimaryButton({
  c,
  label,
  icon,
  onPress,
  disabled,
  loading,
}: StepProps & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={{ opacity: disabled && !loading ? 0.5 : 1 }}
    >
      <LinearGradient
        colors={[c.primary, c.primaryDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          height: 54,
          borderRadius: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          shadowColor: c.primary,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 6,
        }}
      >
        {loading ? <ActivityIndicator size="small" color="#fff" /> : null}
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
          {label}
        </Text>
        {icon && !loading ? (
          <Ionicons name={icon} size={16} color="#fff" />
        ) : null}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function PlanRow({
  c,
  icon,
  label,
  value,
}: StepProps & {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center" style={{ gap: 12 }}>
      <View
        className="w-9 h-9 rounded-xl items-center justify-center"
        style={{ backgroundColor: c.primarySoft }}
      >
        <Ionicons name={icon} size={16} color={c.primary} />
      </View>
      <Text
        className="text-ink-mid dark:text-ink-midOnDark flex-1"
        style={{ fontSize: 13.5 }}
      >
        {label}
      </Text>
      <Text
        className="text-ink dark:text-ink-onDark font-extrabold"
        style={{ fontSize: 14 }}
      >
        {value}
      </Text>
    </View>
  );
}
