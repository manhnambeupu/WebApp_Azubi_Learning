"use client";

import {
  BookOpenText,
  ChevronRight,
  Download,
  Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AiChatWidget } from "@/components/student/lessons/ai-chat-widget";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityTracker } from "@/hooks/use-activity-tracker";
import { useAuthStore } from "@/stores/auth-store";
import { useToast } from "@/hooks/use-toast";
import { useGetStudentLessonDetail } from "@/hooks/use-student-lessons";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { QuizResult as QuizResultData } from "@/types";

const normalizeParam = (value: string | string[] | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
};

type DownloadResponse = {
  downloadUrl: string;
};

type MarkdownImageDimensions = {
  width?: number;
  height?: number;
};

const isValidMarkdownImageSrc = (src: string | undefined): src is string => {
  if (!src) {
    return false;
  }

  const normalizedSrc = src.trim();
  if (!normalizedSrc || normalizedSrc === "#") {
    return false;
  }

  try {
    const parsed = new URL(normalizedSrc, "https://azubivn.de");
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const parsePositiveInt = (value?: string): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
};

const parseMarkdownImageDimensions = (
  title: string | null | undefined,
): MarkdownImageDimensions => {
  if (!title) {
    return {};
  }

  const pairs = title.match(/[a-zA-Z]+=\d+/g) ?? [];
  const metadata = new Map<string, string>();

  for (const pair of pairs) {
    const [key, rawValue] = pair.split("=");
    if (!key || !rawValue) {
      continue;
    }
    metadata.set(key, rawValue);
  }

  return {
    width: parsePositiveInt(metadata.get("w") ?? metadata.get("optimizedWidth")),
    height: parsePositiveInt(metadata.get("h") ?? metadata.get("optimizedHeight")),
  };
};

const QuizForm = dynamic(
  () => import("@/components/student/quiz-form").then((mod) => mod.QuizForm),
  {
    ssr: false,
    loading: () => (
      <p className="text-xs font-bold text-[#777777] dark:text-slate-400">Đang tải form làm bài...</p>
    ),
  },
);

const QuizResult = dynamic(
  () => import("@/components/student/quiz-result").then((mod) => mod.QuizResult),
  {
    ssr: false,
    loading: () => (
      <p className="text-xs font-bold text-[#777777] dark:text-slate-400">Đang tải kết quả làm bài...</p>
    ),
  },
);

const AttemptHistory = dynamic(
  () => import("@/components/student/attempt-history").then((mod) => mod.AttemptHistory),
  {
    ssr: false,
    loading: () => (
      <p className="text-xs font-bold text-[#777777] dark:text-slate-400">Đang tải lịch sử nộp bài...</p>
    ),
  },
);

function StudentLessonDetailSkeleton() {
  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <Skeleton className="h-5 w-48 rounded-xl bg-[#f0f0f0] dark:bg-[#18252d]" />
      <div className="space-y-3 rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
        <Skeleton className="h-8 w-2/3 rounded-xl bg-[#f0f0f0] dark:bg-[#18252d]" />
        <Skeleton className="h-4 w-full rounded-xl bg-[#f0f0f0] dark:bg-[#18252d]" />
        <Skeleton className="h-4 w-5/6 rounded-xl bg-[#f0f0f0] dark:bg-[#18252d]" />
        <Skeleton className="h-56 w-full rounded-2xl bg-[#f0f0f0] dark:bg-[#18252d]" />
      </div>
      <div className="space-y-2 rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
        <Skeleton className="h-5 w-40 rounded-xl bg-[#f0f0f0] dark:bg-[#18252d]" />
        <Skeleton className="h-10 w-full rounded-xl bg-[#f0f0f0] dark:bg-[#18252d]" />
        <Skeleton className="h-10 w-full rounded-xl bg-[#f0f0f0] dark:bg-[#18252d]" />
      </div>
    </section>
  );
}

export default function StudentLessonDetailPage() {
  const params = useParams<{ id?: string | string[] }>();
  const lessonId = normalizeParam(params.id);
  const { toast } = useToast();
  const { isAuthenticated } = useAuthStore();
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<QuizResultData | null>(null);

  useActivityTracker({
    lessonId: lessonId ?? "",
    sessionType: "LESSON_VIEW",
    enabled: isAuthenticated,
  });

  const lessonQuery = useGetStudentLessonDetail(lessonId);

  useEffect(() => {
    setSubmittedResult(null);
  }, [lessonId]);

  const handleDownloadFile = async (fileId: string) => {
    if (!lessonId) {
      return;
    }

    setDownloadingFileId(fileId);
    try {
      const response = await api.get<DownloadResponse>(
        `/student/lessons/${lessonId}/files/${fileId}/download`,
      );
      window.open(response.data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({
        title: "Không thể tải file",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setDownloadingFileId(null);
    }
  };

  if (!lessonId) {
    return (
      <section className="mx-auto max-w-5xl rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
        <p className="text-sm text-destructive">Không tìm thấy bài học hợp lệ.</p>
      </section>
    );
  }

  if (lessonQuery.isLoading) {
    return <StudentLessonDetailSkeleton />;
  }

  if (lessonQuery.isError) {
    return (
      <section className="mx-auto max-w-5xl rounded-[24px] border-2 border-[#ff4b4b]/30 bg-[#ffebee] p-6 dark:border-[#ff4b4b]/40 dark:bg-[#ff4b4b]/15">
        <p className="text-xs font-extrabold text-[#ff4b4b]">{getApiErrorMessage(lessonQuery.error)}</p>
      </section>
    );
  }

  if (!lessonQuery.data) {
    return null;
  }

  const lesson = lessonQuery.data;

  return (
    <article className="mx-auto max-w-5xl space-y-8">
      <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#e5e5e5] bg-white px-3.5 py-1 text-xs font-extrabold text-[#777777] shadow-sm dark:border-[#2b3940] dark:bg-[#131f24] dark:text-slate-400">
        <Link className="hover:text-[#58cc02]" href="/student/lessons">
          Bài học
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="line-clamp-1 text-[#3c3c3c] dark:text-white">{lesson.title}</span>
      </div>

      <article className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24] sm:p-8 space-y-8">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border-2 border-[#58cc02]/30 bg-[#e8f5e1] px-3 py-1 text-xs font-extrabold text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]">
              {lesson.category.name}
            </Badge>
            <Badge
              className={
                lesson.isCompleted
                  ? "rounded-full border-2 border-[#ffc800]/40 bg-[#fef9e7] px-3 py-1 text-xs font-extrabold text-[#d97706] dark:bg-[#ffc800]/20 dark:text-[#ffc800]"
                  : "rounded-full border-2 border-[#e5e5e5] bg-[#f7f7f7] px-3 py-1 text-xs font-extrabold text-[#777777] dark:border-[#2b3940] dark:bg-[#111b21] dark:text-slate-400"
              }
              variant="secondary"
            >
              {lesson.isCompleted ? "Đã hoàn thành" : "Chưa hoàn thành"}
            </Badge>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#3c3c3c] dark:text-white sm:text-3xl">{lesson.title}</h1>
          <p className="max-w-4xl text-xs md:text-sm font-bold leading-relaxed text-[#777777] dark:text-slate-300">{lesson.summary}</p>
        </header>

        {lesson.imageUrl ? (
          <section className="overflow-hidden rounded-2xl border-2 border-[#e5e5e5] dark:border-[#2b3940]">
            <Image
              alt={`Ảnh minh hoạ cho bài học: ${lesson.title}`}
              className="h-auto w-full object-cover"
              height={720}
              sizes="(max-width: 768px) 100vw, 1024px"
              src={lesson.imageUrl}
              unoptimized
              width={1280}
            />
          </section>
        ) : null}

        <section className="student-markdown rounded-2xl border-2 border-[#e5e5e5] bg-[#f7f7f7] p-6 text-sm font-medium leading-relaxed dark:border-[#2b3940] dark:bg-[#111b21] dark:text-slate-200">
          <ReactMarkdown
            components={{
              table: ({ children, ...props }) => (
                <div className="table-wrapper">
                  <table {...props}>{children}</table>
                </div>
              ),
              img: ({ src, alt, title }) => {
                if (!isValidMarkdownImageSrc(src)) {
                  return null;
                }

                const dimensions = parseMarkdownImageDimensions(title);
                const hasDimensions = Boolean(dimensions.width && dimensions.height);

                return (
                  <span className="inline-block max-w-full align-top overflow-hidden rounded-2xl border-2 border-[#e5e5e5] dark:border-[#2b3940]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={alt?.trim() || "Ảnh minh hoạ trong bài học"}
                      className="block h-auto max-w-full object-contain"
                      decoding="async"
                      loading="lazy"
                      src={src}
                      {...(hasDimensions
                        ? {
                            width: dimensions.width,
                            height: dimensions.height,
                          }
                        : {})}
                    />
                  </span>
                );
              },
            }}
            rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }], rehypeSanitize]}
            remarkPlugins={[remarkGfm]}
          >
            {lesson.contentMd}
          </ReactMarkdown>
        </section>

        <section className="space-y-4 rounded-2xl border-2 border-[#e5e5e5] bg-white p-5 dark:border-[#2b3940] dark:bg-[#131f24]">
          <h2 className="inline-flex items-center gap-2 text-base font-extrabold text-[#3c3c3c] dark:text-white">
            <BookOpenText className="h-4 w-4 text-[#46a302]" />
            Tài liệu đính kèm ({lesson.files.length})
          </h2>
          {lesson.files.length === 0 ? (
            <p className="text-xs font-bold text-[#777777] dark:text-slate-400">Bài học chưa có file đính kèm.</p>
          ) : (
            <div className="space-y-2">
              {lesson.files.map((file) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] px-4 py-3 dark:border-[#2b3940] dark:bg-[#111b21]"
                  key={file.id}
                >
                  <span className="text-xs font-extrabold text-[#3c3c3c] dark:text-white">{file.fileName}</span>
                  <Button
                    disabled={downloadingFileId === file.id}
                    onClick={() => {
                      void handleDownloadFile(file.id);
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                    className="h-8 rounded-xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white px-2.5 text-xs font-extrabold text-[#3c3c3c] hover:bg-slate-50 active:translate-y-0.5 active:border-b-2 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#18252d] dark:text-white"
                  >
                    {downloadingFileId === file.id ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Đang lấy link...
                      </>
                    ) : (
                      <>
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </article>

      <section
        className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24] sm:p-8"
        id="quiz"
      >
        <div className="border-b-2 border-[#e5e5e5] pb-4 dark:border-[#2b3940]">
          <h2 className="text-xl font-extrabold text-[#3c3c3c] dark:text-white">🖋 Phần làm bài tập trắc nghiệm</h2>
        </div>
        {lesson.questions.length === 0 ? (
          <p className="text-xs font-bold text-[#777777] dark:text-slate-400">
            Bài học này chưa có câu hỏi để làm bài.
          </p>
        ) : (
          <div className="transition-all duration-300">
            {submittedResult ? (
              <QuizResult
                lessonId={lessonId}
                onRetry={() => setSubmittedResult(null)}
                result={submittedResult}
                questions={lesson.questions}
              />
            ) : (
              <QuizForm
                lessonId={lessonId}
                onSubmitted={setSubmittedResult}
                questions={lesson.questions}
                timeLimitMinutes={lesson.timeLimit}
              />
            )}
          </div>
        )}
      </section>

      <AttemptHistory lessonId={lessonId} />
      <AiChatWidget lessonId={lessonId} />
    </article>
  );
}
