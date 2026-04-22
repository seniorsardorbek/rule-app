import { useMutation, useQuery } from "@tanstack/react-query";
import { storage } from "./storage";
import api from "./api";
import { store } from "../store";
import { setCredentials, logout as logoutAction } from "../store/slices/authSlice";

// Types
export interface OnboardingData {
  language?: string;
  gender?: string;
  age?: string;
  problems?: string[];
  daily_time?: string;
  exam_date?: string;
  completed_at?: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: "BIGBOSS" | "ADMIN" | "CLIENT";
  lang: "UZ" | "EN" | "RU";
  address?: {
    street?: string;
    city?: string;
    country?: string;
  };
  onboarding?: OnboardingData | null;
}

export interface SignInRequest {
  phone_number: string;
  password: string;
}

export interface SignUpRequest {
  first_name: string;
  last_name?: string;
  phone_number: string;
  password: string;
  lang?: string;
  onboarding?: OnboardingData;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface VerifyResponse {
  isLoggedIn: boolean;
  user: User | null;
}

// API functions
export const signInApi = async (data: SignInRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/sign-in", data);
  console.log(response.data);
  return response.data;
};

export const signUpApi = async (data: SignUpRequest): Promise<AuthResponse> => {
  // Get onboarding data from storage if not provided
  if (!data.onboarding) {
    const onboardingRaw = await storage.getItem("onboarding_data");
    if (onboardingRaw) {
      data.onboarding = JSON.parse(onboardingRaw);
    }
  }
  const response = await api.post<AuthResponse>("/auth/sign-up", data);
  return response.data;
};

export const verifyMeApi = async (): Promise<VerifyResponse> => {
  const response = await api.get<VerifyResponse>("/auth/me");
  return response.data;
};

// Hooks
export const useLogin = () => {
  return useMutation({
    mutationFn: signInApi,
    onSuccess: async (data) => {
      await storage.setItem("access_token", data.access_token);
      store.dispatch(
        setCredentials({
          user: data.user,
          token: data.access_token,
        }),
      );
    },
  });
};

export const useSignUp = () => {
  return useMutation({
    mutationFn: signUpApi,
    onSuccess: async (data) => {
      await storage.setItem("access_token", data.access_token);
      store.dispatch(
        setCredentials({
          user: data.user,
          token: data.access_token,
        }),
      );
    },
  });
};

export const useVerifyMe = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["auth", "verify"],
    queryFn: verifyMeApi,
    retry: false,
    enabled,
  });
};

// Helpers
export const logout = async () => {
  await storage.deleteItem("access_token");
  store.dispatch(logoutAction());
};
