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
      <Button
        className="fixed bottom-6 right-6 z-40 h-12 rounded-full border border-primary/20 bg-gradient-to-r from-primary to-amber-600 px-4 text-slate-950 shadow-glow-soft transition-all duration-300 hover:brightness-110 hover:shadow-glow-strong"
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
      >
        {isOpen ? <X className="mr-2 h-4 w-4" /> : <BotMessageSquare className="mr-2 h-4 w-4" />}
        {isOpen ? "Đóng AI Tutor" : "AI Tutor"}
      </Button>

      {isOpen ? (
        <aside className="fixed bottom-20 right-4 z-40 w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-primary/20 bg-white/95 shadow-[0_30px_70px_-32px_rgba(15,23,42,0.7)] backdrop-blur dark:bg-slate-950/95">
          <header className="flex items-center justify-between border-b border-primary/15 bg-gradient-to-r from-primary/10 via-background to-accent/20 px-4 py-3">
            <div className="space-y-0.5">
              <p className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Azubi AI Tutor
              </p>
              <p className="text-xs text-muted-foreground">
                Hướng dẫn theo phương pháp Socratic
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                className="h-8 w-8"
                disabled={isStreaming}
                onClick={() => {
                  void handleClearHistory();
                }}
                size="icon"
                title="Xóa dòng chat để bắt đầu lại"
                type="button"
                variant="ghost"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Xóa dòng chat để bắt đầu lại</span>
              </Button>
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null}
            </div>
          </header>

          <div className="max-h-[52vh] space-y-3 overflow-y-auto px-4 py-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : !hasMessages ? (
              <p className="rounded-xl border border-dashed border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
                Hãy đặt câu hỏi về bài học, mình sẽ gợi ý từng bước để bạn tự tìm ra đáp án.
              </p>
            ) : (
              messages.map((message) => (
                <div
                  className={cn(
                    "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 shadow-sm",
                    message.role === "USER"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "mr-auto border border-primary/15 bg-slate-50 text-foreground dark:bg-slate-900",
                  )}
                  key={message.id}
                >
                  {message.role === "AI" ? (
                    <div className="prose prose-sm max-w-none break-words dark:prose-invert [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content ||
                          (isStreaming
                            ? "Google Deep Mind đang phân tích dữ liệu, bạn chờ một chút nhé... ⏳"
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

          <div className="space-y-2 border-t border-primary/15 px-4 py-3">
            <div className="flex items-end gap-2">
              <Textarea
                className="min-h-[72px] resize-none bg-white/80 text-sm dark:bg-slate-900/80"
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
                className="h-10 rounded-xl"
                disabled={isStreaming || draft.trim().length === 0}
                onClick={() => {
                  void handleSend();
                }}
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
            <p className="text-xs text-muted-foreground">
              Note: Nội dung hội thoại sẽ được bảo lưu 90 ngày theo quy chuẩn bảo mật.
            </p>
          </div>
        </aside>
      ) : null}
    </>
  );
}
