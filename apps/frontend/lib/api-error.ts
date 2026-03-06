import { AxiosError } from "axios";

type ApiErrorData = {
  message?: string | string[];
};

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage = "Có lỗi xảy ra. Vui lòng thử lại.",
): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorData | undefined;
    if (typeof data?.message === "string" && data.message.trim().length > 0) {
      return data.message;
    }

    if (Array.isArray(data?.message) && data.message.length > 0) {
      return data.message.join(", ");
    }
  }

  return fallbackMessage;
};
