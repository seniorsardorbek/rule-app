import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useT } from "../../services/i18n";
import { useThemeColors, type ThemeColors } from "../../theme/colors";

interface ExamOption {
  count: 10 | 20 | 50;
  labelKey: "examShortLabel" | "examStandardLabel" | "examMarathonLabel";
  descKey: "examShortDesc" | "examStandardDesc" | "examMarathonDesc";
  icon: keyof typeof Ionicons.glyphMap;
  accent: "success" | "primary" | "warning";
}

const OPTIONS: ExamOption[] = [
  {
    count: 10,
    labelKey: "examShortLabel",
    descKey: "examShortDesc",
    icon: "flash",
    accent: "success",
  },
  {
    count: 20,
    labelKey: "examStandardLabel",
    descKey: "examStandardDesc",
    icon: "ribbon",
    accent: "primary",
  },
  {
    count: 50,
    labelKey: "examMarathonLabel",
    descKey: "examMarathonDesc",
    icon: "trophy",
    accent: "warning",
  },
];

export default function ExamSelectScreen() {
  const t = useT();
  const c = useThemeColors();

  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-page-dark" edges={["top", "bottom"]}>
      {/* Top nav */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-xl bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={18} color={c.ink} />
        </TouchableOpacity>
        <Text
          className="font-bold text-ink dark:text-ink-onDark"
          style={{ fontSize: 14 }}
        >
          {t("exam")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 py-4 gap-4 pb-12"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
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
            <Ionicons name="timer" size={22} color="#fff" />
          </View>
          <Text
            className="text-white font-extrabold"
            style={{ fontSize: 22, letterSpacing: -0.4 }}
          >
            {t("examMode")}
          </Text>
          <Text
            className="text-white/90 mt-1.5"
            style={{ fontSize: 13, lineHeight: 18 }}
          >
            {t("examModeDesc")}
          </Text>
          <View
            className="flex-row items-center mt-3 self-start rounded-full"
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              paddingHorizontal: 10,
              paddingVertical: 5,
              gap: 6,
            }}
          >
            <Ionicons name="time-outline" size={12} color="#fff" />
            <Text className="text-white font-semibold" style={{ fontSize: 11 }}>
              {t("examOneMinPerQuestion")}
            </Text>
          </View>
        </LinearGradient>

        {/* Eyebrow */}
        <Text
          className="text-ink-muted dark:text-ink-mutedOnDark font-semibold mt-2"
          style={{
            fontSize: 11,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {t("selectExamLength")}
        </Text>

        {/* Grid blocks */}
        <View className="gap-3">
          {OPTIONS.map((opt) => (
            <ExamBlock
              key={opt.count}
              opt={opt}
              c={c}
              questionsLabel={t("questionsCount")}
              minutesLabel={t("minutes")}
              label={t(opt.labelKey)}
              desc={t(opt.descKey)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface ExamBlockProps {
  opt: ExamOption;
  c: ThemeColors;
  questionsLabel: string;
  minutesLabel: string;
  label: string;
  desc: string;
}

function ExamBlock({
  opt,
  c,
  questionsLabel,
  minutesLabel,
  label,
  desc,
}: ExamBlockProps) {
  const accentColor =
    opt.accent === "primary"
      ? c.primary
      : opt.accent === "success"
        ? c.success
        : opt.accent === "warning"
          ? c.warning
          : c.primary;
  const accentSoft =
    opt.accent === "primary"
      ? c.primarySoft
      : opt.accent === "success"
        ? c.successSoft
        : c.warningSoft;
  const accentDeep =
    opt.accent === "primary" ? c.primaryDeep : accentColor;

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: "/exam/play", params: { count: opt.count } })
      }
      activeOpacity={0.85}
    >
      <View
        className="bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark"
        style={{
          borderRadius: 20,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
      >
        <LinearGradient
          colors={[accentColor, accentDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          <Ionicons name={opt.icon} size={22} color="#fff" />
        </LinearGradient>

        <View className="flex-1">
          <View className="flex-row items-baseline gap-1.5">
            <Text
              className="font-extrabold text-ink dark:text-ink-onDark"
              style={{ fontSize: 22, letterSpacing: -0.4 }}
            >
              {opt.count}
            </Text>
            <Text
              className="text-ink-mid dark:text-ink-midOnDark font-semibold"
              style={{ fontSize: 12 }}
            >
              {questionsLabel}
            </Text>
          </View>
          <Text
            className="font-bold text-ink dark:text-ink-onDark"
            style={{ fontSize: 13.5, marginTop: 1 }}
          >
            {label}
          </Text>
          <Text
            className="text-ink-muted dark:text-ink-mutedOnDark"
            style={{ fontSize: 11.5, marginTop: 2 }}
          >
            {desc}
          </Text>
        </View>

        <View className="items-end gap-2">
          <View
            className="rounded-full flex-row items-center"
            style={{
              backgroundColor: accentSoft,
              paddingHorizontal: 9,
              paddingVertical: 4,
              gap: 4,
            }}
          >
            <Ionicons name="time-outline" size={11} color={accentColor} />
            <Text
              className="font-bold"
              style={{ fontSize: 11, color: accentColor }}
            >
              {opt.count} {minutesLabel}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={c.inkDim} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
