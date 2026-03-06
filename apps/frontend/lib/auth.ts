"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { User, UserRole } from "@/types";

type LoginResponse = {
  accessToken: string;
  user: User;
};

type RefreshResponse = {
  accessToken: string;
};

const roleRedirectPath = (role: UserRole): string =>
  role === "ADMIN" ? "/admin/dashboard" : "/student/lessons";

export function useAuth() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, setAuth, clearAuth, setAccessToken } =
    useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      setAuth(response.data.user, response.data.accessToken);
      router.replace(roleRedirectPath(response.data.user.role));

      return response.data;
    },
    [router, setAuth],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAuth();
      router.replace("/login");
    }
  }, [clearAuth, router]);

  const refreshToken = useCallback(async () => {
    const response = await api.post<RefreshResponse>("/auth/refresh");
    setAccessToken(response.data.accessToken);
    return response.data.accessToken;
  }, [setAccessToken]);

  const getMe = useCallback(async () => {
    const response = await api.get<User>("/auth/me");
    const currentToken = useAuthStore.getState().accessToken;

    if (currentToken) {
      setAuth(response.data, currentToken);
    } else {
      useAuthStore.setState((state) => ({
        ...state,
        user: response.data,
        isAuthenticated: true,
      }));
    }

    return response.data;
  }, [setAuth]);

  return {
    user,
    accessToken,
    isAuthenticated,
    login,
    logout,
    refreshToken,
    getMe,
  };
}
