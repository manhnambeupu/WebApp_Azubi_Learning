"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { LessonDetail, LessonFile, LessonListItem } from "@/types";

export const ADMIN_LESSONS_QUERY_KEY = ["admin-lessons"] as const;
export const adminLessonsByCategoryQueryKey = (categoryId?: string) =>
  [...ADMIN_LESSONS_QUERY_KEY, categoryId ?? "all"] as const;
export const adminLessonDetailQueryKey = (lessonId: string) =>
  ["admin-lesson", lessonId] as const;

export type LessonMutationPayload = {
  title: string;
  summary: string;
  contentMd: string;
  categoryId: string;
  imageFile?: File | null;
};

type UpdateLessonPayload = {
  lessonId: string;
  data: LessonMutationPayload;
};

const buildLessonFormData = (payload: LessonMutationPayload): FormData => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("summary", payload.summary);
  formData.append("contentMd", payload.contentMd);
  formData.append("categoryId", payload.categoryId);
  if (payload.imageFile) {
    formData.append("image", payload.imageFile);
  }
  return formData;
};

export function useGetLessons(categoryId?: string) {
  return useQuery({
    queryKey: adminLessonsByCategoryQueryKey(categoryId),
    queryFn: async () => {
      const response = await api.get<LessonListItem[]>("/admin/lessons", {
        params: categoryId ? { categoryId } : undefined,
      });
      return response.data;
    },
  });
}

export function useGetLesson(lessonId?: string) {
  return useQuery({
    queryKey: adminLessonDetailQueryKey(lessonId ?? ""),
    enabled: Boolean(lessonId),
    queryFn: async () => {
      const response = await api.get<LessonDetail>(`/admin/lessons/${lessonId}`);
      return response.data;
    },
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LessonMutationPayload) => {
      const response = await api.post<LessonListItem>(
        "/admin/lessons",
        buildLessonFormData(payload),
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_LESSONS_QUERY_KEY,
      });
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, data }: UpdateLessonPayload) => {
      const response = await api.patch<LessonListItem>(
        `/admin/lessons/${lessonId}`,
        buildLessonFormData(data),
      );
      return response.data;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_LESSONS_QUERY_KEY,
      });
      await queryClient.invalidateQueries({
        queryKey: adminLessonDetailQueryKey(variables.lessonId),
      });
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await api.delete<{ deleted: boolean; id: string }>(
        `/admin/lessons/${lessonId}`,
      );
      return response.data;
    },
    onSuccess: async (_, lessonId) => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_LESSONS_QUERY_KEY,
      });
      await queryClient.removeQueries({
        queryKey: adminLessonDetailQueryKey(lessonId),
      });
    },
  });
}

export function useUploadLessonFile(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post<LessonFile>(
        `/admin/lessons/${lessonId}/files`,
        formData,
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminLessonDetailQueryKey(lessonId),
      });
      await queryClient.invalidateQueries({
        queryKey: ADMIN_LESSONS_QUERY_KEY,
      });
    },
  });
}

export function useDeleteLessonFile(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      const response = await api.delete<{ deleted: boolean; id: string }>(
        `/admin/lessons/${lessonId}/files/${fileId}`,
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminLessonDetailQueryKey(lessonId),
      });
      await queryClient.invalidateQueries({
        queryKey: ADMIN_LESSONS_QUERY_KEY,
      });
    },
  });
}

export function useGetLessonFileDownloadUrl(lessonId: string) {
  return useMutation({
    mutationFn: async (fileId: string) => {
      const response = await api.get<{ downloadUrl: string }>(
        `/admin/lessons/${lessonId}/files/${fileId}/download`,
      );
      return response.data;
    },
  });
}
