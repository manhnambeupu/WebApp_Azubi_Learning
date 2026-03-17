"use client";

import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LessonFilesManager } from "@/components/lessons/lesson-files-manager";
import { LessonForm } from "@/components/lessons/lesson-form";
import { QuestionList } from "@/components/questions/question-list";
import { Button } from "@/components/ui/button";
import { useGetLesson } from "@/hooks/use-lessons";
import { getApiErrorMessage } from "@/lib/api-error";

const normalizeParam = (value: string | string[] | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
};

export default function AdminEditLessonPage() {
  const params = useParams<{ id?: string | string[] }>();
  const lessonId = normalizeParam(params.id);

  const lessonQuery = useGetLesson(lessonId);

  if (!lessonId) {
    return (
      <section className="kokonut-glass-card kokonut-glow-border rounded-2xl p-6">
        <p className="text-sm text-destructive">Không tìm thấy mã bài học hợp lệ.</p>
      </section>
    );
  }

  if (lessonQuery.isLoading) {
    return (
      <section className="kokonut-glass-card flex min-h-[320px] items-center justify-center rounded-2xl p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải thông tin bài học...
        </div>
      </section>
    );
  }

  if (lessonQuery.isError) {
    return (
      <section className="kokonut-glass-card space-y-3 rounded-2xl p-6">
        <p className="text-sm text-destructive">{getApiErrorMessage(lessonQuery.error)}</p>
        <Button
          asChild
          className="border-primary/25 bg-white/85 text-primary transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/10 hover:text-primary dark:bg-slate-900/70"
          size="sm"
          variant="outline"
        >
          <Link href="/admin/dashboard">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách bài học
          </Link>
        </Button>
      </section>
    );
  }

  if (!lessonQuery.data) {
    return null;
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          asChild
          className="border-primary/25 bg-white/85 text-primary transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/10 hover:text-primary dark:bg-slate-900/70"
          size="sm"
          variant="outline"
        >
          <Link href="/admin/dashboard">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách bài học
          </Link>
        </Button>
      </div>

      <section className="kokonut-glass-card kokonut-glow-border space-y-2 rounded-2xl p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/75">
          Lesson Builder
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Thiết kế bài học theo từng khối nội dung
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Cập nhật thông tin chung, nội dung markdown và hệ thống câu hỏi theo cấu trúc panel
          rõ ràng để giảm tải thao tác khi biên soạn bài học.
        </p>
      </section>

      <div className="kokonut-fade [animation-delay:40ms]">
        <LessonForm lesson={lessonQuery.data} mode="edit" />
      </div>

      <div className="kokonut-fade [animation-delay:80ms]">
        <LessonFilesManager files={lessonQuery.data.files} lessonId={lessonId} />
      </div>

      <div className="kokonut-fade [animation-delay:120ms]">
        <QuestionList lessonId={lessonId} />
      </div>
    </div>
  );
}
