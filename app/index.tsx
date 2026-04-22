import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { storage } from "../services/storage";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCredentials, setTokenLoaded } from "../store/slices/authSlice";
import { verifyMeApi } from "../services/auth";

export default function Index() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, tokenLoaded, user } = useAppSelector((s) => s.auth);
  const [checking, setChecking] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check local onboarding status
        const onboardingCompleted = await storage.getItem("onboarding_completed");
        setOnboardingDone(onboardingCompleted === "true");

        const token = await storage.getItem("access_token");
        if (!token) {
          dispatch(setTokenLoaded());
          setChecking(false);
          return;
        }

        const result = await verifyMeApi();
        if (result.isLoggedIn && result.user) {
          dispatch(setCredentials({ user: result.user, token }));
          // If user has onboarding data on server, mark it locally too
          if (result.user.onboarding) {
            await storage.setItem("onboarding_completed", "true");
            setOnboardingDone(true);
          }
        } else {
          await storage.deleteItem("access_token");
          dispatch(setTokenLoaded());
        }
      } catch {
        await storage.deleteItem("access_token");
        dispatch(setTokenLoaded());
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [dispatch]);

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // If authenticated but no onboarding data → show onboarding
  if (isAuthenticated && !user?.onboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  // If authenticated and has onboarding → go to main app
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // Not authenticated: check if onboarding was done locally (pre-registration)
  if (!onboardingDone) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
