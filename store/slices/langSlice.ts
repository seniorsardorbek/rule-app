import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type AppLang = "uz" | "oz" | "ru";

interface LangState {
  lang: AppLang;
}

const initialState: LangState = {
  lang: "uz",
};

const langSlice = createSlice({
  name: "lang",
  initialState,
  reducers: {
    setLang(state, action: PayloadAction<AppLang>) {
      state.lang = action.payload;
    },
    cycleLang(state) {
      const order: AppLang[] = ["uz", "oz", "ru"];
      const current = order.indexOf(state.lang);
      state.lang = order[(current + 1) % order.length];
    },
  },
});

export const { setLang, cycleLang } = langSlice.actions;
export default langSlice.reducer;
