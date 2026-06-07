import { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useT } from "../../services/i18n";
import { useThemeColors } from "../../theme/colors";
import { useVideos, pickLang, QuizQuestion } from "../../services/quiz";

export default function StudyScreen() {
  const t = useT();
  const c = useThemeColors();
  const { data: videos, isLoading } = useVideos();

  const groups = useMemo(() => {
    const map = new Map<string, QuizQuestion[]>();
    (videos ?? []).forEach((q) => {
      const topic =
        pickLang(q.topic_name_uz ?? "", q.topic_name_oz, q.topic_name_ru) ||
        t("videosByTopic");
      const list = map.get(topic) ?? [];
      list.push(q);
      map.set(topic, list);
    });
    return Array.from(map.entries());
  }, [videos, t]);

  return (
    <SafeAreaView className="flex-1 bg-page dark:bg-page-dark">
      <ScrollView contentContainerClassName="px-5 py-4">
        <Text className="text-2xl font-bold text-ink dark:text-white">
          {t("studyTitle")}
        </Text>
        <Text className="text-ink-muted mt-1" style={{ fontSize: 13 }}>
          {t("studySubtitle")}
        </Text>

        {isLoading ? (
          <View className="py-10 items-center">
            <ActivityIndicator color={c.primary} />
          </View>
        ) : groups.length === 0 ? (
          <View className="bg-surface rounded-2xl p-6 items-center border border-gray-100 mt-6">
            <Ionicons name="videocam-outline" size={36} color={c.inkMuted} />
            <Text className="text-ink-muted mt-2">{t("noVideos")}</Text>
          </View>
        ) : (
          groups.map(([topic, items]) => (
            <View key={topic} className="mt-6">
              <Text className="text-[11px] uppercase tracking-wide font-semibold text-ink-muted mb-2">
                {topic}
              </Text>
              <View style={{ gap: 10 }}>
                {items.map((q) => (
                  <TouchableOpacity
                    key={q.id}
                    activeOpacity={0.85}
                    onPress={() => Linking.openURL(q.video_url as string)}
                    className="flex-row items-center bg-surface rounded-2xl p-3 border border-gray-100"
                  >
                    <View
                      className="w-16 h-12 rounded-xl overflow-hidden items-center justify-center mr-3"
                      style={{ backgroundColor: c.primarySoft }}
                    >
                      {q.video_thumbnail_url ? (
                        <Image
                          source={{ uri: q.video_thumbnail_url }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons name="play-circle" size={26} color={c.primary} />
                      )}
                    </View>
                    <Text
                      className="flex-1 text-base font-semibold text-ink dark:text-white"
                      numberOfLines={2}
                    >
                      {pickLang(q.question_uz, q.question_oz, q.question_ru)}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={c.inkMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
