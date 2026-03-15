import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import {
  createSessionRoleConflictError,
  decodeJwtPayload,
  handleSessionRoleConflict,
  hasSessionRoleConflict,
  isSessionRoleConflictError,
} from "@/lib/auth-session";
import { useAuthStore } from "@/stores/auth-store";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || "/api";

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type RefreshResponse = {
  accessToken: string;
};

const api = axios.create({
  baseURL,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/logout")
    ) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/auth/refresh")) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post<RefreshResponse>("/auth/refresh")
          .then((response) => {
            const newToken = response.data.accessToken;
            if (!newToken) {
              throw new Error("No access token returned from refresh endpoint");
            }

            const payload = decodeJwtPayload(newToken);
            if (!payload) {
              throw new Error("Invalid access token returned from refresh endpoint");
            }

            if (hasSessionRoleConflict(payload.role)) {
              handleSessionRoleConflict();
              throw createSessionRoleConflictError();
            }

            useAuthStore.getState().setAccessToken(newToken);
            return newToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      originalRequest.headers = originalRequest.headers ?? {};
      (originalRequest.headers as Record<string, string>).Authorization =
        `Bearer ${newToken}`;

       return api(originalRequest);
     } catch (refreshError) {
       if (!isSessionRoleConflictError(refreshError)) {
         useAuthStore.getState().clearAuth();
         if (typeof window !== "undefined" && window.location.pathname !== "/login") {
           window.location.href = "/login";
         }
       }
       return Promise.reject(refreshError);
     }
   },
);

export { api };
