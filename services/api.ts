import axios from "axios";
import { storage } from "./storage";
import { router } from "expo-router";
import Constants from "expo-constants";

// In production, EXPO_PUBLIC_* env vars are baked into the bundle.
// In dev, fall back to the laptop IP from Expo's hostUri so devices on the LAN can reach it.
const hostUri = Constants.expoConfig?.hostUri;
const localIp = hostUri ? hostUri.split(":")[0] : "localhost";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${localIp}:4000/api`;
const FILE_BASE_URL =
  process.env.EXPO_PUBLIC_FILE_URL ?? `http://${localIp}:4000`;

// Helper to get full file URL (without /api prefix)
export const getFileUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${FILE_BASE_URL}/${url.replace(/^\//, "")}`;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    // Log outgoing request
    console.log(`[Network Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    const token = await storage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("[Network Request Error]", error);
    return Promise.reject(error);
  },
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log(`[Network Response] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    // Log error response
    if (error.response) {
      console.error(`[Network Error Response] ${error.response.status} ${error.config?.url} - ${JSON.stringify(error.response.data)}`);
    } else {
      console.error("[Network Error]", error.message);
    }

    if (error.response?.status === 401) {
      await storage.deleteItem("access_token");
      router.replace("/(auth)/login");
    }
    return Promise.reject(error);
  },
);

export default api;
