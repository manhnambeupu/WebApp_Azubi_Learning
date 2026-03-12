"use client";

import { ChevronRight, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { AttemptHistory } from "@/components/student/attempt-history";
import { QuizForm } from "@/components/student/quiz-form";
import { QuizResult } from "@/components/student/quiz-result";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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

function StudentLessonDetailSkeleton() {
  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <Skeleton className="h-5 w-48" />
      <div className="space-y-3 rounded-2xl border border-border/70 bg-white p-6 shadow-sm">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-56 w-full" />
      </div>
      <div className="space-y-2 rounded-2xl border border-border/70 bg-white p-6 shadow-sm">
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
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<QuizResultData | null>(null);

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
      <section className="mx-auto max-w-4xl rounded-2xl border border-border/70 bg-white p-6 shadow-sm">
        <p className="text-sm text-destructive">Không tìm thấy bài học hợp lệ.</p>
      </section>
    );
  }

  if (lessonQuery.isLoading) {
    return <StudentLessonDetailSkeleton />;
  }

  if (lessonQuery.isError) {
    return (
      <section className="mx-auto max-w-4xl rounded-2xl border border-border/70 bg-white p-6 shadow-sm">
        <p className="text-sm text-destructive">{getApiErrorMessage(lessonQuery.error)}</p>
      </section>
    );
  }

  if (!lessonQuery.data) {
    return null;
  }

  const lesson = lessonQuery.data;

  return (
    <section className="mx-auto max-w-4xl space-y-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1 text-sm text-muted-foreground shadow-sm">
        <Link className="hover:text-foreground" href="/student/lessons">
          Bài học
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="line-clamp-1 text-foreground">{lesson.title}</span>
      </div>

      <article className="space-y-8 rounded-2xl border border-border/70 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{lesson.category.name}</Badge>
            <Badge
              className={
                lesson.isCompleted ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""
              }
              variant={lesson.isCompleted ? "secondary" : "outline"}
            >
              {lesson.isCompleted ? "Đã hoàn thành" : "Chưa hoàn thành"}
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{lesson.title}</h1>
          <p className="text-base leading-7 text-muted-foreground">{lesson.summary}</p>
        </div>

        {lesson.imageUrl ? (
          <div
            className="h-72 w-full rounded-xl border border-slate-200/80 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${lesson.imageUrl})` }}
          />
        ) : null}

        <div className="student-markdown rounded-xl border border-slate-200/80 bg-white p-6">
          <ReactMarkdown
            rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }], rehypeSanitize]}
            remarkPlugins={[remarkGfm]}
          >
            {lesson.contentMd}
          </ReactMarkdown>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200/80 bg-slate-50/60 p-5">
          <h2 className="font-semibold">Tài liệu đính kèm</h2>
          {lesson.files.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bài học chưa có file đính kèm.</p>
          ) : (
            <div className="space-y-2">
              {lesson.files.map((file) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-white px-4 py-3 transition-colors hover:bg-slate-50"
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
        </div>
      </article>

      <section className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold">Phần làm bài</h2>
        <Separator className="my-3" />
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
    </section>
  );
}
