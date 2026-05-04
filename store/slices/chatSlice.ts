import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatState {
  open: boolean;
  currentQuestionId: string | null;
  currentQuestionImageUrl: string | null;
}

const initialState: ChatState = {
  open: false,
  currentQuestionId: null,
  currentQuestionImageUrl: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    openChat(state) {
      state.open = true;
    },
    closeChat(state) {
      state.open = false;
    },
    setCurrentQuestion(
      state,
      action: PayloadAction<{ id: string; imageUrl?: string | null }>,
    ) {
      state.currentQuestionId = action.payload.id;
      state.currentQuestionImageUrl = action.payload.imageUrl ?? null;
    },
    clearCurrentQuestion(state) {
      state.currentQuestionId = null;
      state.currentQuestionImageUrl = null;
    },
  },
});

export const {
  openChat,
  closeChat,
  setCurrentQuestion,
  clearCurrentQuestion,
} = chatSlice.actions;
export default chatSlice.reducer;
