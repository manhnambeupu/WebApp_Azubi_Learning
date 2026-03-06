import { create } from "zustand";
import type { User } from "@/types";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setAccessToken: (token: string | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, token) =>
    set({
      user,
      accessToken: token,
      isAuthenticated: true,
    }),
  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    }),
  setAccessToken: (token) =>
    set((state) => ({
      ...state,
      accessToken: token,
      isAuthenticated: Boolean(token),
    })),
}));
