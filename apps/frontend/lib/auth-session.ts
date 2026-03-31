import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types";

type JwtPayload = {
  userId: string;
  role: UserRole;
};

const SESSION_CONFLICT_TOAST_KEY = "azubi-session-conflict";
const SESSION_CONFLICT_ERROR_MESSAGE = "Session role changed after refresh";

export const SESSION_CONFLICT_TOAST_MESSAGE =
  "Phiên đăng nhập đã thay đổi do đăng nhập từ tab khác. Vui lòng đăng nhập lại.";

const normalizeBase64Url = (value: string): string =>
  value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

export function decodeJwtPayload(token: string): JwtPayload | null {
  const [, payloadSegment] = token.split(".");
  if (!payloadSegment || typeof window === "undefined") {
    return null;
  }

  try {
    const decodedPayload = window.atob(normalizeBase64Url(payloadSegment));
    const parsedPayload = JSON.parse(decodedPayload) as Partial<JwtPayload>;

    if (
      typeof parsedPayload.userId !== "string" ||
      (parsedPayload.role !== "ADMIN" && parsedPayload.role !== "STUDENT")
    ) {
      return null;
    }

    return {
      userId: parsedPayload.userId,
      role: parsedPayload.role,
    };
  } catch {
    return null;
  }
}

export function hasSessionRoleConflict(nextRole: UserRole): boolean {
  const currentRole = useAuthStore.getState().user?.role;
  return currentRole !== undefined && currentRole !== nextRole;
}

export function consumeSessionConflictToast(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const message = window.sessionStorage.getItem(SESSION_CONFLICT_TOAST_KEY);
    if (!message) {
      return null;
    }

    window.sessionStorage.removeItem(SESSION_CONFLICT_TOAST_KEY);
    return message;
  } catch (error) {
    // Safari có thể throw SecurityError nếu bị chặn Cookie (Private browsing mode)
    // Nếu throw mà không catch, nó sẽ làm crash React (Hydration / App Error)
    return null;
  }
}

export function handleSessionRoleConflict(): void {
  useAuthStore.getState().clearAuth();

  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname === "/login") {
    toast({
      title: SESSION_CONFLICT_TOAST_MESSAGE,
      variant: "destructive",
    });
    return;
  }

  try {
    window.sessionStorage.setItem(
      SESSION_CONFLICT_TOAST_KEY,
      SESSION_CONFLICT_TOAST_MESSAGE,
    );
  } catch (error) {
    // Bỏ qua lỗi Safari Strict Mode
  }
  window.location.replace("/login");
}

export function createSessionRoleConflictError(): Error {
  return new Error(SESSION_CONFLICT_ERROR_MESSAGE);
}

export function isSessionRoleConflictError(error: unknown): boolean {
  return (
    error instanceof Error && error.message === SESSION_CONFLICT_ERROR_MESSAGE
  );
}
