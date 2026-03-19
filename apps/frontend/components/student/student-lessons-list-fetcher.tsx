"use client";

import { BookOpenText } from "lucide-react";
import { LessonCard } from "@/components/student/lesson-card";
import { LessonsGridSkeleton } from "@/components/ui/lessons-list-skeleton";
import { useGetStudentLessons } from "@/hooks/use-student-lessons";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

export function StudentLessonsListFetcher() {
  const lessonsQuery = useGetStudentLessons();

  if (lessonsQuery.isLoading) {
    return <LessonsGridSkeleton />;
  }

  if (lessonsQuery.isError) {
    return (
      <p className="rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {getApiErrorMessage(lessonsQuery.error)}
      </p>
    );
  }

  if (!lessonsQuery.data || lessonsQuery.data.length === 0) {
    return (
      <div className="kokonut-glass-card flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-white/65 px-6 py-16 text-center shadow-glass dark:bg-slate-950/45">
        <BookOpenText className="h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Chưa có bài học nào</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Danh sách bài học sẽ hiển thị tại đây khi nội dung được phát hành.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-6">
      {lessonsQuery.data.map((lesson, index) => {
        const featured = index % 5 === 0;
        return (
          <article
            className={cn("h-full", featured ? "sm:col-span-2 xl:col-span-3" : "xl:col-span-2")}
            key={lesson.id}
          >
            <LessonCard featured={featured} lesson={lesson} />
          </article>
        );
      })}
    </div>
  );
}
