import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface QuizState {
  currentQuizId: string | null;
  answers: Record<string, string>; // questionId -> selectedOptionId
  submitted: boolean;
}

const initialState: QuizState = {
  currentQuizId: null,
  answers: {},
  submitted: false,
};

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    startQuiz(state, action: PayloadAction<string>) {
      state.currentQuizId = action.payload;
      state.answers = {};
      state.submitted = false;
    },
    selectAnswer(
      state,
      action: PayloadAction<{ questionId: string; optionId: string }>,
    ) {
      state.answers[action.payload.questionId] = action.payload.optionId;
    },
    submitQuiz(state) {
      state.submitted = true;
    },
    resetQuiz(state) {
      state.currentQuizId = null;
      state.answers = {};
      state.submitted = false;
    },
  },
});

export const { startQuiz, selectAnswer, submitQuiz, resetQuiz } =
  quizSlice.actions;
export default quizSlice.reducer;
