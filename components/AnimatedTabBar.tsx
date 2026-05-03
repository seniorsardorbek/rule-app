import { View, Text, Pressable, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColors } from "../theme/colors";

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: "home", inactive: "home-outline" },
  study: { active: "school", inactive: "school-outline" },
  quiz: { active: "reader", inactive: "reader-outline" },
  profile: { active: "person", inactive: "person-outline" },
};

export function AnimatedTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const c = useThemeColors();

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View
        style={[
          styles.bar,
          {
            backgroundColor: c.surface,
            borderColor: c.border,
            shadowColor: c.ink,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : (options.title ?? route.name);
          const icons = TAB_ICONS[route.name] ?? {
            active: "ellipse",
            inactive: "ellipse-outline",
          };
          const iconName = focused ? icons.active : icons.inactive;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: "tabLongPress", target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              android_ripple={{ borderless: true }}
            >
              {focused ? (
                <LinearGradient
                  colors={[c.primary, c.primaryDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.activePill,
                    { shadowColor: c.primary },
                  ]}
                >
                  <Ionicons name={iconName} size={18} color="#fff" />
                  <Text style={styles.activeLabel} numberOfLines={1}>
                    {label}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.inactiveCircle}>
                  <Ionicons name={iconName} size={22} color={c.inkMuted} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const BAR_HEIGHT = 64;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 18,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    width: "100%",
    height: BAR_HEIGHT,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 40,
    elevation: 8,
  },
  tab: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    gap: 7,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
  },
  activeLabel: {
    color: "#fff",
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  inactiveCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
});
