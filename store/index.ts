import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import quizReducer from "./slices/quizSlice";
import langReducer from "./slices/langSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    quiz: quizReducer,
    lang: langReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
