import { View, Text, Pressable, StyleSheet } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

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
  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.bar}>
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
                <View style={styles.activePill} pointerEvents="none" />
              ) : null}
              <Ionicons
                name={iconName}
                size={24}
                color={focused ? colors.primary : colors.inkMuted}
              />
              <Text
                style={[
                  styles.label,
                  { color: focused ? colors.primary : colors.inkMuted },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const BAR_HEIGHT = 78;
const PILL_HEIGHT = 56;
const PILL_WIDTH = 80;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    width: "92%",
    maxWidth: 400,
    height: BAR_HEIGHT,
    borderRadius: 34,
    backgroundColor: colors.surface,
    alignItems: "center",
    paddingHorizontal: 8,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  tab: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activePill: {
    position: "absolute",
    top: (BAR_HEIGHT - PILL_HEIGHT) / 2,
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: 36,
    backgroundColor: colors.surface,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 3,
  },
});
