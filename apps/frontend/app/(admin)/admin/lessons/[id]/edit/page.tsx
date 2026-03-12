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
      <section className="rounded-xl border border-border/80 bg-card p-6 shadow-sm">
        <p className="text-sm text-destructive">Không tìm thấy mã bài học hợp lệ.</p>
      </section>
    );
  }

  if (lessonQuery.isLoading) {
    return (
      <section className="flex min-h-[320px] items-center justify-center rounded-xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải thông tin bài học...
        </div>
      </section>
    );
  }

  if (lessonQuery.isError) {
    return (
      <section className="space-y-3 rounded-xl border border-border/80 bg-card p-6 shadow-sm">
        <p className="text-sm text-destructive">{getApiErrorMessage(lessonQuery.error)}</p>
        <Button asChild size="sm" variant="outline">
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
    <div className="space-y-6">
      <Button asChild size="sm" variant="outline">
        <Link href="/admin/dashboard">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách bài học
        </Link>
      </Button>

      <LessonForm lesson={lessonQuery.data} mode="edit" />
      <LessonFilesManager files={lessonQuery.data.files} lessonId={lessonId} />
      <QuestionList lessonId={lessonId} />
    </div>
  );
}
