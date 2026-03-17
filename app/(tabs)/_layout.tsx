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
          title: "Asosiy",
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: "Testlar",
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: "O'qish",
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
