"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SendBulkEmailPayload, SendBulkEmailResult } from "@/types";

export function useSendBulkEmail() {
  return useMutation({
    mutationFn: async (payload: SendBulkEmailPayload) => {
      const response = await api.post<SendBulkEmailResult>("/admin/emails/send-bulk", payload);
      return response.data;
    },
  });
}
