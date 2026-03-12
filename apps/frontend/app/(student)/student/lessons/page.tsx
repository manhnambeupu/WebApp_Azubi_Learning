"use client";

import { BookOpenText } from "lucide-react";
import { LessonCard } from "@/components/student/lesson-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetStudentLessons } from "@/hooks/use-student-lessons";
import { getApiErrorMessage } from "@/lib/api-error";

function LessonsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm" key={index}>
          <Skeleton className="h-40 w-full" />
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

  return (
    <section className="space-y-8">
      <div className="space-y-2 rounded-2xl border border-border/70 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Danh sách bài học</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Theo dõi tiến độ và tiếp tục học các bài trong chương trình Azubi.
        </p>
      </div>

      {lessonsQuery.isLoading ? <LessonsGridSkeleton /> : null}

      {lessonsQuery.isError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(lessonsQuery.error)}
        </p>
      ) : null}

      {lessonsQuery.data ? (
        lessonsQuery.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <BookOpenText className="h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Chưa có bài học nào</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Danh sách bài học sẽ hiển thị tại đây khi nội dung được phát hành.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {lessonsQuery.data.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )
      ) : null}
    </section>
  );
}
