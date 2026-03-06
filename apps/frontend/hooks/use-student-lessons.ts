"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { StudentLessonDetail, StudentLessonListItem } from "@/types";

export const STUDENT_LESSONS_QUERY_KEY = ["student-lessons"] as const;
export const studentLessonDetailQueryKey = (lessonId: string) =>
  ["student-lesson-detail", lessonId] as const;

export function useGetStudentLessons() {
  return useQuery({
    queryKey: STUDENT_LESSONS_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<StudentLessonListItem[]>("/student/lessons");
      return response.data;
    },
  });
}

export function useGetStudentLessonDetail(lessonId?: string) {
  return useQuery({
    queryKey: studentLessonDetailQueryKey(lessonId ?? ""),
    enabled: Boolean(lessonId),
    queryFn: async () => {
      const response = await api.get<StudentLessonDetail>(`/student/lessons/${lessonId}`);
      return response.data;
    },
  });
}
