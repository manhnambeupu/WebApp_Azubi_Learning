"use client";

import { BookOpenText, GraduationCap, Sparkles } from "lucide-react";
import { LessonCard } from "@/components/student/lesson-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetStudentLessons } from "@/hooks/use-student-lessons";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

function LessonsGridSkeleton() {
  const skeletonVariants = [
    "sm:col-span-2 xl:col-span-3",
    "xl:col-span-2",
    "xl:col-span-1",
    "xl:col-span-2",
    "sm:col-span-2 xl:col-span-3",
    "xl:col-span-1",
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-6">
      {skeletonVariants.map((variant, index) => (
        <div
          className={cn(
            "space-y-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-glass",
            variant
          )}
          key={index}
        >
          <Skeleton className="h-44 w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StudentLessonsPage() {
  const lessonsQuery = useGetStudentLessons();
  const lessons = lessonsQuery.data ?? [];

  return (
    <section className="space-y-8">
      <section className="kokonut-glass-card kokonut-glow-border relative overflow-hidden border-primary/20 bg-white/60 px-6 py-7 shadow-glow-soft dark:bg-slate-950/50 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/30 blur-3xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-primary">
              <GraduationCap className="h-3.5 w-3.5" />
              Student Dashboard
            </span>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Danh sách bài học
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              Khám phá nội dung theo lộ trình Azubi với giao diện tập trung cho
              việc học sâu và theo dõi tiến độ trực quan.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-4 py-2 text-xs font-medium text-foreground shadow-[0_8px_24px_-16px_hsl(var(--accent)/0.85)]">
            <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
            {lessonsQuery.isSuccess
              ? `${lessons.length} bài học khả dụng`
              : "Đang đồng bộ lộ trình"}
          </div>
        </div>
      </section>

      {lessonsQuery.isLoading ? <LessonsGridSkeleton /> : null}

      {lessonsQuery.isError ? (
        <p className="rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {getApiErrorMessage(lessonsQuery.error)}
        </p>
      ) : null}

      {lessonsQuery.data ? (
        lessonsQuery.data.length === 0 ? (
          <div className="kokonut-glass-card flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-white/65 px-6 py-16 text-center shadow-glass dark:bg-slate-950/45">
            <BookOpenText className="h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Chưa có bài học nào</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Danh sách bài học sẽ hiển thị tại đây khi nội dung được phát hành.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-6">
            {lessonsQuery.data.map((lesson, index) => {
              const featured = index % 5 === 0;
              return (
                <article
                  className={cn(
                    "h-full",
                    featured ? "sm:col-span-2 xl:col-span-3" : "xl:col-span-2"
                  )}
                  key={lesson.id}
                >
                  <LessonCard featured={featured} lesson={lesson} />
                </article>
              );
            })}
          </div>
        )
      ) : null}
    </section>
  );
}
