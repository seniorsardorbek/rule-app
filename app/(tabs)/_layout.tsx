import { Tabs } from "expo-router";
import { AnimatedTabBar } from "../../components/AnimatedTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "",
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: "Darslik",
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: "Test",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
        }}
      />
    </Tabs>
  );
}
