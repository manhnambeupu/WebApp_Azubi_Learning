"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AiHistoryItem,
  CreateAiChatPayload,
  CreateAiChatResponse,
  GetAiHistoriesFilters,
} from "@/types";

export const ADMIN_AI_HISTORIES_QUERY_KEY = ["admin-ai-histories"] as const;
export const STUDENT_AI_HISTORY_QUERY_KEY = ["student-ai-history"] as const;

export const adminAiHistoriesQueryKey = (filters: GetAiHistoriesFilters) =>
  [
    ...ADMIN_AI_HISTORIES_QUERY_KEY,
    filters.studentName ?? "",
    filters.lessonTitle ?? "",
    filters.limit ?? 100,
  ] as const;

export const studentAiHistoryQueryKey = (lessonId: string) =>
  [...STUDENT_AI_HISTORY_QUERY_KEY, lessonId] as const;

export type StudentAiChatHistoryItem = {
  id: string;
  role: "USER" | "AI";
  content: string;
};

export async function createStudentAiChatMessage(payload: CreateAiChatPayload) {
  const response = await api.post<CreateAiChatResponse>("/ai-tutor/chat", payload);
  return response.data;
}

export function useStudentAiHistory(lessonId: string, enabled = true) {
  return useQuery({
    queryKey: studentAiHistoryQueryKey(lessonId),
    queryFn: async () => {
      const response = await api.get<StudentAiChatHistoryItem[]>(
        `/ai-tutor/history/student/${lessonId}`,
      );
      return response.data;
    },
    enabled: enabled && lessonId.length > 0,
    refetchOnWindowFocus: false,
  });
}

export async function clearStudentAiHistory(lessonId: string) {
  const response = await api.delete<{ success: true; message: string }>(
    `/ai-tutor/history/student/${lessonId}`,
  );
  return response.data;
}

export function useGetAiHistories(filters: GetAiHistoriesFilters) {
  return useQuery({
    queryKey: adminAiHistoriesQueryKey(filters),
    queryFn: async () => {
      const response = await api.get<AiHistoryItem[]>("/ai-tutor/history", {
        params: {
          studentName: filters.studentName?.trim() || undefined,
          lessonTitle: filters.lessonTitle?.trim() || undefined,
          limit: filters.limit,
        },
      });
      return response.data;
    },
  });
}

export function useDeleteAiHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (historyId: string) => {
      const response = await api.delete<{ deleted: true; id: string }>(
        `/ai-tutor/history/${historyId}`,
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_AI_HISTORIES_QUERY_KEY,
      });
    },
  });
}
