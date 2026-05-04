import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setCredentials } from "./authSlice";

export type AppLang = "uz" | "oz" | "ru";

interface LangState {
  lang: AppLang;
  // Once the user has actively chosen via the profile switcher we stop
  // overwriting their choice on subsequent /auth/me hydrations.
  userOverride: boolean;
}

const initialState: LangState = {
  lang: "uz",
  userOverride: false,
};

// Maps the various server-side / onboarding values to the app's AppLang.
function normalizeLang(input?: string | null): AppLang | null {
  if (!input) return null;
  const v = input.toLowerCase();
  if (v === "uz" || v === "uz_latin") return "uz";
  if (v === "oz" || v === "uz_cyrl" || v === "uz_cyrillic") return "oz";
  if (v === "ru" || v === "rus" || v === "russian") return "ru";
  return null;
}

const langSlice = createSlice({
  name: "lang",
  initialState,
  reducers: {
    setLang(state, action: PayloadAction<AppLang>) {
      state.lang = action.payload;
      state.userOverride = true;
    },
    cycleLang(state) {
      const order: AppLang[] = ["uz", "oz", "ru"];
      const current = order.indexOf(state.lang);
      state.lang = order[(current + 1) % order.length];
      state.userOverride = true;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setCredentials, (state, action) => {
      if (state.userOverride) return;
      const onboardingLang = normalizeLang(
        action.payload.user?.onboarding?.language,
      );
      const userLang = normalizeLang(action.payload.user?.lang);
      const next = onboardingLang ?? userLang;
      if (next) state.lang = next;
    });
  },
});

export const { setLang, cycleLang } = langSlice.actions;
export default langSlice.reducer;
