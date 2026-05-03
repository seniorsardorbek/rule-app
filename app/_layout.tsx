import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "../store";
import { loadThemeMode } from "../services/theme";

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    loadThemeMode();
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="quiz" />
          <Stack.Screen name="exam" />
        </Stack>
      </QueryClientProvider>
    </Provider>
  );
}
