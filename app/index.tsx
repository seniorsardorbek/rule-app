import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { storage } from "../services/storage";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCredentials, setTokenLoaded } from "../store/slices/authSlice";
import { verifyMeApi } from "../services/auth";

export default function Index() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, tokenLoaded } = useAppSelector((s) => s.auth);
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

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
