"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  STUDENT_LESSONS_QUERY_KEY,
  studentLessonDetailQueryKey,
} from "@/hooks/use-student-lessons";
import { api } from "@/lib/api";
import type {
  AttemptHistoryItem,
  QuizResult,
  SubmitQuizPayload,
} from "@/types";

export const studentAttemptHistoryQueryKey = (lessonId: string) =>
  ["student-attempt-history", lessonId] as const;
export const studentAttemptDetailQueryKey = (lessonId: string, attemptId: string) =>
  ["student-attempt-detail", lessonId, attemptId] as const;
export const studentLatestAttemptQueryKey = (lessonId: string) =>
  ["student-latest-attempt", lessonId] as const;

export function useSubmitQuiz(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitQuizPayload) => {
      const response = await api.post<QuizResult>(
        `/student/lessons/${lessonId}/attempts`,
        payload,
      );
      return response.data;
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: STUDENT_LESSONS_QUERY_KEY,
      });
      await queryClient.invalidateQueries({
        queryKey: studentLessonDetailQueryKey(lessonId),
      });
      await queryClient.invalidateQueries({
        queryKey: studentAttemptHistoryQueryKey(lessonId),
      });
      await queryClient.invalidateQueries({
        queryKey: studentLatestAttemptQueryKey(lessonId),
      });
      queryClient.setQueryData(
        studentAttemptDetailQueryKey(lessonId, result.attemptId),
        result,
      );
      queryClient.setQueryData(studentLatestAttemptQueryKey(lessonId), result);
    },
  });
}

export function useGetAttemptHistory(lessonId: string) {
  return useQuery({
    queryKey: studentAttemptHistoryQueryKey(lessonId),
    enabled: Boolean(lessonId),
    queryFn: async () => {
      const response = await api.get<AttemptHistoryItem[]>(
        `/student/lessons/${lessonId}/attempts`,
      );
      return response.data;
    },
  });
}

export function useGetAttemptDetail(lessonId: string, attemptId?: string) {
  return useQuery({
    queryKey: studentAttemptDetailQueryKey(lessonId, attemptId ?? ""),
    enabled: Boolean(lessonId && attemptId),
    queryFn: async () => {
      const response = await api.get<QuizResult>(
        `/student/lessons/${lessonId}/attempts/${attemptId}`,
      );
      return response.data;
    },
  });
}

export function useGetLatestAttempt(lessonId: string) {
  return useQuery({
    queryKey: studentLatestAttemptQueryKey(lessonId),
    enabled: Boolean(lessonId),
    queryFn: async () => {
      const response = await api.get<QuizResult | null>(
        `/student/lessons/${lessonId}/attempts/latest`,
      );
      return response.data;
    },
  });
}
