import { GraduationCap } from "lucide-react";
import { Suspense } from "react";
import { StudentLessonCounterBadge } from "@/components/student/student-lesson-counter-badge";
import { StudentLessonsListFetcher } from "@/components/student/student-lessons-list-fetcher";
import { LessonsGridSkeleton } from "@/components/ui/lessons-list-skeleton";

export default function StudentLessonsPage() {
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
              🏆 📈Làm chủ lộ trình ôn thi của bạn: Tăng cường và củng có kiến
              thức dựa trên các bài học liên quan mật thiết với
              Abschlussprüfung, tự tin chinh phục từng mục tiêu🎯🏆
            </p>
          </div>
          <StudentLessonCounterBadge />
        </div>
      </section>

      <Suspense fallback={<LessonsGridSkeleton />}>
        <StudentLessonsListFetcher />
      </Suspense>
    </section>
  );
}
