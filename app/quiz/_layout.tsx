import { Stack } from "expo-router";

export default function QuizLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerTintColor: "#2563EB",
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { color: "#111827", fontWeight: "600" },
      }}
    >
      <Stack.Screen name="[id]" options={{ title: "Quiz" }} />
      <Stack.Screen
        name="results"
        options={{ title: "Results", headerBackVisible: false }}
      />
      <Stack.Screen name="mistakes" options={{ title: "Mistakes" }} />
    </Stack>
  );
}
