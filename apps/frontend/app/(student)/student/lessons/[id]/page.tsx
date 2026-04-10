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
      <p className="text-sm text-muted-foreground">Đang tải form làm bài...</p>
    ),
  },
);

const QuizResult = dynamic(
  () => import("@/components/student/quiz-result").then((mod) => mod.QuizResult),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground">Đang tải kết quả làm bài...</p>
    ),
  },
);

const AttemptHistory = dynamic(
  () => import("@/components/student/attempt-history").then((mod) => mod.AttemptHistory),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground">Đang tải lịch sử nộp bài...</p>
    ),
  },
);

function StudentLessonDetailSkeleton() {
  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <Skeleton className="h-5 w-48" />
      <div className="space-y-3 rounded-2xl border border-border/70 bg-white/70 p-6 shadow-glass dark:bg-slate-900/70">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-56 w-full" />
      </div>
      <div className="space-y-2 rounded-2xl border border-border/70 bg-white/70 p-6 shadow-glass dark:bg-slate-900/70">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
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
      <section className="mx-auto max-w-5xl rounded-2xl border border-border/70 bg-white/70 p-6 shadow-glass dark:bg-slate-900/70">
        <p className="text-sm text-destructive">Không tìm thấy bài học hợp lệ.</p>
      </section>
    );
  }

  if (lessonQuery.isLoading) {
    return <StudentLessonDetailSkeleton />;
  }

  if (lessonQuery.isError) {
    return (
      <section className="mx-auto max-w-5xl rounded-2xl border border-border/70 bg-white/70 p-6 shadow-glass dark:bg-slate-900/70">
        <p className="text-sm text-destructive">{getApiErrorMessage(lessonQuery.error)}</p>
      </section>
    );
  }

  if (!lessonQuery.data) {
    return null;
  }

  const lesson = lessonQuery.data;

  return (
    <article className="mx-auto max-w-5xl space-y-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-3 py-1 text-sm text-muted-foreground shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
        <Link className="hover:text-foreground" href="/student/lessons">
          Bài học
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="line-clamp-1 text-foreground">{lesson.title}</span>
      </div>

      <article className="kokonut-glass-card kokonut-glow-border space-y-8 border-primary/15 bg-white/70 p-6 shadow-glass sm:p-8 dark:bg-slate-900/70">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15">
              {lesson.category.name}
            </Badge>
            <Badge
              className={
                lesson.isCompleted
                  ? "rounded-full border border-amber-300/60 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 shadow-[0_0_0_1px_rgba(245,158,11,0.3),0_10px_20px_-14px_rgba(245,158,11,0.9)] hover:from-amber-100 hover:to-amber-200"
                  : "rounded-full border border-slate-300/80 bg-white/70 text-slate-700 hover:bg-white/80 dark:border-slate-600/80 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900/80"
              }
              variant="secondary"
            >
              {lesson.isCompleted ? "Đã hoàn thành" : "Chưa hoàn thành"}
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{lesson.title}</h1>
          <p className="max-w-4xl text-lg leading-8 text-muted-foreground">{lesson.summary}</p>
        </header>

        {lesson.imageUrl ? (
          <section className="overflow-hidden rounded-2xl border border-primary/15 shadow-glow-soft">
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

        <section className="student-markdown rounded-2xl border border-primary/15 bg-white/80 p-6 text-[1.04rem] leading-8 shadow-glass sm:p-8 sm:text-[1.08rem] dark:bg-slate-900/80">
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
                  <span className="inline-block max-w-full align-top overflow-hidden rounded-xl border border-primary/15">
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

        <section className="space-y-4 rounded-2xl border border-primary/15 bg-slate-50/55 p-5 dark:bg-slate-800/55">
          <h2 className="inline-flex items-center gap-2 font-semibold">
            <BookOpenText className="h-4 w-4 text-primary" />
            Tài liệu đính kèm
          </h2>
          {lesson.files.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bài học chưa có file đính kèm.</p>
          ) : (
            <div className="space-y-2">
              {lesson.files.map((file) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/15 bg-white/85 px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-soft dark:bg-slate-900/85"
                  key={file.id}
                >
                  <span className="text-sm">{file.fileName}</span>
                  <Button
                    disabled={downloadingFileId === file.id}
                    onClick={() => {
                      void handleDownloadFile(file.id);
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                    className="rounded-full border-primary/25 bg-white/90 hover:border-primary/40 hover:bg-white dark:bg-slate-950/90 dark:hover:bg-slate-950"
                  >
                    {downloadingFileId === file.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang lấy link...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
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
        className="kokonut-glass-card kokonut-glow-border rounded-2xl border-primary/20 bg-white/70 p-6 shadow-glass sm:p-8 dark:bg-slate-900/70"
        id="quiz"
      >
        <h2 className="text-xl font-semibold">🖋Phần làm bài tập</h2>
        <Separator className="my-4" />
        {lesson.questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Bài học này chưa có câu hỏi để làm bài.
          </p>
        ) : (
          <div className="transition-all duration-300">
            {submittedResult ? (
              <QuizResult
                onRetry={() => setSubmittedResult(null)}
                result={submittedResult}
              />
            ) : (
              <QuizForm
                lessonId={lessonId}
                onSubmitted={setSubmittedResult}
                questions={lesson.questions}
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
