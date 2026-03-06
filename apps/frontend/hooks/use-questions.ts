"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminLessonDetailQueryKey } from "@/hooks/use-lessons";
import { api } from "@/lib/api";
import type {
  CreateQuestionPayload,
  QuestionDetail,
  UpdateQuestionPayload,
} from "@/types";

export const adminLessonQuestionsQueryKey = (lessonId: string) =>
  ["admin-lesson-questions", lessonId] as const;

type UpdateQuestionMutationPayload = {
  questionId: string;
  data: UpdateQuestionPayload;
};

export function useGetQuestions(lessonId: string) {
  return useQuery({
    queryKey: adminLessonQuestionsQueryKey(lessonId),
    enabled: Boolean(lessonId),
    queryFn: async () => {
      const response = await api.get<QuestionDetail[]>(
        `/admin/lessons/${lessonId}/questions`,
      );
      return response.data;
    },
  });
}

export function useCreateQuestion(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateQuestionPayload) => {
      const response = await api.post<QuestionDetail>(
        `/admin/lessons/${lessonId}/questions`,
        payload,
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminLessonQuestionsQueryKey(lessonId),
      });
      await queryClient.invalidateQueries({
        queryKey: adminLessonDetailQueryKey(lessonId),
      });
    },
  });
}

export function useUpdateQuestion(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questionId, data }: UpdateQuestionMutationPayload) => {
      const response = await api.patch<QuestionDetail>(
        `/admin/lessons/${lessonId}/questions/${questionId}`,
        data,
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminLessonQuestionsQueryKey(lessonId),
      });
      await queryClient.invalidateQueries({
        queryKey: adminLessonDetailQueryKey(lessonId),
      });
    },
  });
}

export function useDeleteQuestion(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionId: string) => {
      const response = await api.delete<{ deleted: true; id: string }>(
        `/admin/lessons/${lessonId}/questions/${questionId}`,
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminLessonQuestionsQueryKey(lessonId),
      });
      await queryClient.invalidateQueries({
        queryKey: adminLessonDetailQueryKey(lessonId),
      });
    },
  });
}

export function useReorderQuestions(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (questionIds: string[]) => {
      const response = await api.patch<QuestionDetail[]>(
        `/admin/lessons/${lessonId}/questions/reorder`,
        { questionIds },
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminLessonQuestionsQueryKey(lessonId),
      });
      await queryClient.invalidateQueries({
        queryKey: adminLessonDetailQueryKey(lessonId),
      });
    },
  });
}
