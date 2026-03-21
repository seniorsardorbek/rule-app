import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface QuizState {
  currentQuizId: string | null;
  answers: Record<string, string>; // questionId -> selectedOptionId
  submitted: boolean;
  resultId: string | null;
}

const initialState: QuizState = {
  currentQuizId: null,
  answers: {},
  submitted: false,
  resultId: null,
};

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    startQuiz(state, action: PayloadAction<string>) {
      state.currentQuizId = action.payload;
      state.answers = {};
      state.submitted = false;
      state.resultId = null;
    },
    selectAnswer(
      state,
      action: PayloadAction<{ questionId: string; optionId: string }>,
    ) {
      state.answers[action.payload.questionId] = action.payload.optionId;
    },
    submitQuiz(state, action: PayloadAction<string>) {
      state.submitted = true;
      state.resultId = action.payload;
    },
    resetQuiz(state) {
      state.currentQuizId = null;
      state.answers = {};
      state.submitted = false;
      state.resultId = null;
    },
  },
});

export const { startQuiz, selectAnswer, submitQuiz, resetQuiz } =
  quizSlice.actions;
export default quizSlice.reducer;
