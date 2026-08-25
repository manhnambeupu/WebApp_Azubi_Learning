"use client";

import { useQueryClient } from "@tanstack/react-query";
import { BotMessageSquare, Loader2, SendHorizontal, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  clearStudentAiHistory,
  createStudentAiChatMessage,
  studentAiHistoryQueryKey,
  useStudentAiHistory,
} from "@/hooks/use-ai-tutor";
import { useToast } from "@/hooks/use-toast";
import { forceRefreshToken } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const STREAM_DONE_TOKEN = "[DONE]";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

type AiChatWidgetProps = {
  lessonId: string;
};

type ChatMessage = {
  id: string;
  role: "USER" | "AI";
  content: string;
};

const buildStreamUrl = (lessonId: string, chatId: string): string => {
  const normalizedBase = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  return `${normalizedBase}/ai-tutor/stream/${lessonId}?chatId=${encodeURIComponent(chatId)}`;
};

const createMessageId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function AiChatWidget({ lessonId }: AiChatWidgetProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const { data: historyData, isLoading: isLoadingHistory } = useStudentAiHistory(lessonId, isOpen);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming, isOpen]);

  useEffect(() => {
    setMessages([]);
    setDraft("");
  }, [lessonId]);

  useEffect(() => {
    if (isOpen && historyData && !isStreaming) {
      setMessages((prev) => {
        if (prev.length === 0) {
          return historyData;
        }
        if (prev.length >= historyData.length) {
          return prev;
        }
        return historyData;
      });
    }
  }, [historyData, isOpen, isStreaming]);

  const updateAiMessageChunk = (messageId: string, chunk: string) => {
    setMessages((prev) =>
      prev.map((entry) =>
        entry.id === messageId
          ? {
            ...entry,
            content: `${entry.content}${chunk}`,
          }
          : entry,
      ),
    );
  };

  const sendStreamRequest = async (url: string): Promise<Response> => {
    const sendWithToken = async (token: string | null) =>
      fetch(url, {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        cache: "no-store",
      });

    const initialToken = useAuthStore.getState().accessToken;
    let response = await sendWithToken(initialToken);
    if (response.status !== 401) {
      return response;
    }

    const refreshedToken = await forceRefreshToken();
    response = await sendWithToken(refreshedToken);
    return response;
  };

  const streamAiResponse = async (chatId: string, aiMessageId: string): Promise<void> => {
    const response = await sendStreamRequest(buildStreamUrl(lessonId, chatId));

    if (!response.ok || !response.body) {
      throw new Error(`Không thể bắt đầu stream (HTTP ${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");

      let eventBoundary = buffer.indexOf("\n\n");
      while (eventBoundary !== -1) {
        const rawEvent = buffer.slice(0, eventBoundary);
        buffer = buffer.slice(eventBoundary + 2);

        const data = rawEvent
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => (line.startsWith("data: ") ? line.slice(6) : line.slice(5)))
          .join("\n");

        if (!data) {
          eventBoundary = buffer.indexOf("\n\n");
          continue;
        }

        if (data === STREAM_DONE_TOKEN) {
          return;
        }

        updateAiMessageChunk(aiMessageId, data);
        eventBoundary = buffer.indexOf("\n\n");
      }
    }
  };

  const handleSend = async () => {
    if (isStreaming) {
      return;
    }

    const normalizedDraft = draft.trim();
    if (!normalizedDraft) {
      return;
    }

    const userMessageId = createMessageId();
    const aiMessageId = createMessageId();

    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: "USER",
        content: normalizedDraft,
      },
      {
        id: aiMessageId,
        role: "AI",
        content: "",
      },
    ]);
    setDraft("");
    setIsStreaming(true);

    try {
      const chatEntry = await createStudentAiChatMessage({
        lessonId,
        message: normalizedDraft,
      });
      await streamAiResponse(chatEntry.id, aiMessageId);
    } catch (error) {
      setMessages((prev) =>
        prev.map((entry) =>
          entry.id === aiMessageId && entry.content.trim().length === 0
            ? {
              ...entry,
              content:
                "Mình chưa thể phản hồi lúc này. Bạn thử gửi lại câu hỏi sau ít phút nhé.",
            }
            : entry,
        ),
      );
      toast({
        title: "Không thể kết nối AI Tutor",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClearHistory = async () => {
    if (isStreaming) {
      return;
    }

    try {
      await clearStudentAiHistory(lessonId);
      setMessages([]);
      setDraft("");
      queryClient.setQueryData(studentAiHistoryQueryKey(lessonId), []);
      toast({
        title: "Đã dọn dẹp lịch sử, bạn có thể bắt đầu lại!",
      });
    } catch (error) {
      toast({
        title: "Không thể xóa lịch sử trò chuyện",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Floating Toggle Button (Lingo 3D Button) */}
      <Button
        className="fixed bottom-6 right-6 z-40 h-14 rounded-2xl border-2 border-[#58cc02] border-b-4 border-b-[#46a302] bg-[#58cc02] px-5 text-sm font-extrabold text-white shadow-lg transition-all hover:bg-[#46a302] active:translate-y-0.5 active:border-b-2 cursor-pointer"
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
      >
        {isOpen ? <X className="mr-2 h-5 w-5" /> : <BotMessageSquare className="mr-2 h-5 w-5" />}
        {isOpen ? "Đóng AI Tutor" : "Hỏi AI Tutor"}
      </Button>

      {/* Floating Chat Box */}
      {isOpen ? (
        <aside className="fixed bottom-24 right-4 z-40 w-[min(420px,calc(100vw-2rem))] rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white shadow-2xl dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24] overflow-hidden">
          <header className="flex items-center justify-between border-b-2 border-[#e5e5e5] bg-[#f7f7f7] px-4 py-3 dark:border-[#2b3940] dark:bg-[#111b21]">
            <div className="space-y-0.5">
              <p className="inline-flex items-center gap-1.5 text-sm font-extrabold text-[#3c3c3c] dark:text-white">
                <Sparkles className="h-4 w-4 text-[#58cc02]" />
                Azubi AI Tutor
              </p>
              <p className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
                Gợi ý & Hướng dẫn tư duy
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                className="h-8 w-8 rounded-xl text-[#777777] hover:bg-[#ffebee] hover:text-[#ff4b4b] dark:text-slate-400"
                disabled={isStreaming}
                onClick={() => {
                  void handleClearHistory();
                }}
                size="icon"
                title="Xóa đoạn chat"
                type="button"
                variant="ghost"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Xóa đoạn chat</span>
              </Button>
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin text-[#58cc02]" /> : null}
            </div>
          </header>

          <div className="max-h-[50vh] space-y-3 overflow-y-auto p-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8 text-xs font-bold text-[#777777] dark:text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-[#58cc02]" />
              </div>
            ) : !hasMessages ? (
              <div className="rounded-2xl border-2 border-dashed border-[#58cc02]/30 bg-[#e8f5e1]/50 p-4 text-xs font-bold text-[#46a302] dark:bg-[#58cc02]/10 dark:text-[#58cc02]">
                Hãy đặt câu hỏi về bài học, mình sẽ gợi ý từng bước để bạn nắm vững kiến thức!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  className={cn(
                    "max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed font-bold",
                    message.role === "USER"
                      ? "ml-auto border-2 border-[#58cc02] border-b-4 border-b-[#46a302] bg-[#58cc02] text-white"
                      : "mr-auto border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-[#f7f7f7] text-[#3c3c3c] dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#18252d] dark:text-white",
                  )}
                  key={message.id}
                >
                  {message.role === "AI" ? (
                    <div className="prose prose-xs max-w-none break-words dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content ||
                          (isStreaming
                            ? "AI đang suy nghĩ câu trả lời... ⏳"
                            : "")}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="space-y-2 border-t-2 border-[#e5e5e5] p-3 dark:border-[#2b3940]">
            <div className="flex items-end gap-2">
              <Textarea
                className="min-h-[64px] resize-none rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-xs font-bold text-[#3c3c3c] placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white"
                disabled={isStreaming}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Nhập câu hỏi của bạn..."
                value={draft}
              />
              <Button
                className="h-10 w-10 rounded-xl border-b-4 border-[#46a302] bg-[#58cc02] text-white hover:bg-[#46a302] active:translate-y-0.5 active:border-b-2 disabled:opacity-50"
                disabled={isStreaming || draft.trim().length === 0}
                onClick={() => {
                  void handleSend();
                }}
                size="icon"
                type="button"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizontal className="h-4 w-4" />
                )}
                <span className="sr-only">Gửi câu hỏi</span>
              </Button>
            </div>
            <p className="text-[10px] font-bold text-[#a0a0a0] dark:text-slate-500">
              Lưu ý: Nội dung trao đổi được lưu trữ 90 ngày nhằm hỗ trợ học tập.
            </p>
          </div>
        </aside>
      ) : null}
    </>
  );
}
