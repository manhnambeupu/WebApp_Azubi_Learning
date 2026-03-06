"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Student } from "@/types";

export const ADMIN_STUDENTS_QUERY_KEY = ["admin-students"] as const;

export type CreateStudentPayload = {
  email: string;
  fullName: string;
  password: string;
};

export function useGetStudents() {
  return useQuery({
    queryKey: ADMIN_STUDENTS_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<Student[]>("/admin/students");
      return response.data;
    },
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateStudentPayload) => {
      const response = await api.post<Student>("/admin/students", payload);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_STUDENTS_QUERY_KEY,
      });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentId: string) => {
      const response = await api.delete<{ deleted: true; id: string }>(
        `/admin/students/${studentId}`,
      );
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_STUDENTS_QUERY_KEY,
      });
    },
  });
}
