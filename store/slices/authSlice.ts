import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  tokenLoaded: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  tokenLoaded: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.tokenLoaded = true;
    },
    setTokenLoaded(state) {
      state.tokenLoaded = true;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, setTokenLoaded, logout } = authSlice.actions;
export default authSlice.reducer;
