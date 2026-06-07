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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await storage.getItem("access_token");
        if (!token) {
          dispatch(setTokenLoaded());
          setChecking(false);
          return;
        }

        // Server's user.onboarding is the source of truth for the routing gate.
        const result = await verifyMeApi();
        if (result.isLoggedIn && result.user) {
          dispatch(setCredentials({ user: result.user, token }));
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

  // Authenticated student whose onboarding isn't filled yet → onboarding (first login)
  if (isAuthenticated && !user?.onboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  // Authenticated and onboarded → main app
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // B2B: no self-signup — unauthenticated users always go to login.
  return <Redirect href="/(auth)/login" />;
}
