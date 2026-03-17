import { useQuery } from "@tanstack/react-query";
import api from "./api";

// Types
export interface QuizOption {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
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
  title: string;
  description?: string;
  is_active: boolean;
  questions: QuizQuestion[];
  created_at: string;
  updated_at: string;
}

export interface QuizzesQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "title" | "created_at" | "updated_at";
  order?: "ASC" | "DESC";
  search?: string;
  is_active?: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface QuizzesResponse {
  data: Quiz[];
  meta: PaginationMeta;
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
