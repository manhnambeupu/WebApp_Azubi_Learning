"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Category } from "@/types";

export const ADMIN_CATEGORIES_QUERY_KEY = ["admin-categories"] as const;

export function useGetCategories() {
  return useQuery({
    queryKey: ADMIN_CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<Category[]>("/admin/categories");
      return response.data;
    },
  });
}
