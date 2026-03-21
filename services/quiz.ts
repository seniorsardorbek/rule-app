import { useMutation, useQuery } from "@tanstack/react-query";
import api from "./api";
import { store } from "../store";

// Language helper — reads from lang slice
export const pickLang = (
  uz: string,
  oz?: string | null,
  ru?: string | null,
): string => {
  const lang = store.getState().lang.lang;
  if (lang === "ru" && ru) return ru;
  if (lang === "oz" && oz) return oz;
  return uz;
};

// Types
export interface QuizOption {
  id: string;
  question_id: string;
  text_uz: string;
  text_oz?: string | null;
  text_ru?: string | null;
  is_correct: boolean;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_uz: string;
  question_oz?: string | null;
  question_ru?: string | null;
  topic_name_uz?: string | null;
  topic_name_oz?: string | null;
  topic_name_ru?: string | null;
  order: number;
  image?: {
    id: string;
    url: string;
    filename: string;
  } | null;
  options: QuizOption[];
}

export interface Quiz {
  id: string;
  name_uz: string;
  name_oz?: string | null;
  name_ru?: string | null;
  description?: string;
  is_active: boolean;
  questions: QuizQuestion[];
  created_at: string;
  updated_at: string;
}

export interface QuizzesQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "name_uz" | "created_at" | "updated_at";
  order?: "ASC" | "DESC";
  search?: string;
  is_active?: boolean;
}

export interface QuizzesResponse {
  data: Quiz[];
  total: number;
  page: number;
  limit: number;
}

// Result types
export interface QuizResultAnswer {
  id: string;
  question_id: string;
  is_correct: boolean;
  question: QuizQuestion;
  selected_option: QuizOption | null;
}

export interface QuizResult {
  id: string;
  user_id: string;
  quiz_id: string;
  attempt: number;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  created_at: string;
  quiz: Quiz;
  answers: QuizResultAnswer[];
}

export interface SubmitResultRequest {
  userId: string;
  quizId: string;
  answers: { questionId: string; selectedOptionId: string | null }[];
}

// API functions
export const getQuizzesApi = async (
  params: QuizzesQueryParams = {},
): Promise<QuizzesResponse> => {
  const response = await api.get<QuizzesResponse>("/quiz", {
    params: { ...params, is_active: true },
  });
  return response.data;
};

export const getQuizByIdApi = async (id: string): Promise<Quiz> => {
  const response = await api.get<Quiz>(`/quiz/${id}`);
  return response.data;
};

export const submitResultApi = async (
  data: SubmitResultRequest,
): Promise<QuizResult> => {
  const response = await api.post<QuizResult>("/quiz/results", data);
  return response.data;
};

export const getResultApi = async (id: string): Promise<QuizResult> => {
  const response = await api.get<QuizResult>(`/quiz/results/${id}`);
  return response.data;
};

export const getUserResultsApi = async (
  userId: string,
  quizId?: string,
): Promise<QuizResult[]> => {
  const response = await api.get<QuizResult[]>(`/quiz/results/user/${userId}`, {
    params: quizId ? { quizId } : {},
  });
  return response.data;
};

export const getUserIncorrectApi = async (
  userId: string,
  quizId?: string,
): Promise<QuizResultAnswer[]> => {
  const response = await api.get<QuizResultAnswer[]>(
    `/quiz/results/user/${userId}/incorrect`,
    { params: quizId ? { quizId } : {} },
  );
  return response.data;
};

// Hooks
export const useQuizzes = (params: QuizzesQueryParams = {}) => {
  return useQuery({
    queryKey: ["quizzes", params],
    queryFn: () => getQuizzesApi(params),
  });
};

export const useQuiz = (id: string) => {
  return useQuery({
    queryKey: ["quizzes", id],
    queryFn: () => getQuizByIdApi(id),
    enabled: !!id,
  });
};

export const useResult = (id: string) => {
  return useQuery({
    queryKey: ["results", id],
    queryFn: () => getResultApi(id),
    enabled: !!id,
  });
};

export const useUserResults = (userId: string, quizId?: string) => {
  return useQuery({
    queryKey: ["results", "user", userId, quizId],
    queryFn: () => getUserResultsApi(userId, quizId),
    enabled: !!userId,
  });
};

export const useUserIncorrect = (userId: string, quizId?: string) => {
  return useQuery({
    queryKey: ["results", "user", userId, "incorrect", quizId],
    queryFn: () => getUserIncorrectApi(userId, quizId),
    enabled: !!userId,
  });
};

export const useSubmitResult = () => {
  return useMutation({ mutationFn: submitResultApi });
};
