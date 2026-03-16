import Link from "next/link";
import { BookOpenCheck, BookOpenText, FileQuestion, ImageIcon, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StudentLessonListItem } from "@/types";

type LessonCardProps = {
  lesson: StudentLessonListItem;
  featured?: boolean;
};

export function LessonCard({ lesson, featured = false }: LessonCardProps) {
  return (
    <Link className="group block h-full" href={`/student/lessons/${lesson.id}`}>
      <Card
        className={cn(
          "kokonut-hover-lift relative flex h-full flex-col overflow-hidden rounded-2xl border border-primary/20 bg-white/70 p-0 shadow-glow-soft transition-all duration-300 dark:bg-slate-950/55",
          "hover:border-amber-300/60 hover:shadow-[0_20px_46px_-24px_hsl(var(--accent)/0.92),0_12px_28px_-18px_rgba(217,119,6,0.85)]",
          featured && "min-h-[24rem]"
        )}
      >
        <div
          className={cn(
            "relative w-full overflow-hidden border-b border-primary/15 bg-slate-100",
            featured ? "h-52" : "h-44"
          )}
        >
          {lesson.imageUrl ? (
            <div
              className="h-full w-full bg-cover bg-center bg-no-repeat transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              style={{ backgroundImage: `url(${lesson.imageUrl})` }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-background to-accent/20 text-muted-foreground">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/60 px-3 py-1 text-xs shadow-sm dark:bg-slate-900/70">
                <ImageIcon className="h-4 w-4" />
                <span className="font-medium">Lesson Visual</span>
              </div>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
          <div className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/35 bg-white/30 text-white backdrop-blur-md">
            <UserRound className="h-4 w-4" />
          </div>
        </div>

        <CardHeader className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border border-primary/25 bg-primary/10 text-primary hover:bg-primary/15">
              {lesson.category.name}
            </Badge>
            <Badge
              className={
                lesson.isCompleted
                  ? "rounded-full border border-amber-300/60 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 shadow-[0_0_0_1px_rgba(245,158,11,0.3),0_10px_22px_-14px_rgba(245,158,11,0.95)] hover:from-amber-100 hover:to-amber-200"
                  : "rounded-full border border-slate-300/80 bg-white/70 text-slate-700 hover:bg-white/80 dark:bg-slate-900/60 dark:text-slate-200"
              }
              variant="secondary"
            >
              {lesson.isCompleted ? "Đã hoàn thành" : "Chưa hoàn thành"}
            </Badge>
          </div>
          <CardTitle className="line-clamp-2 text-lg leading-7 tracking-tight">
            {lesson.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="mt-auto space-y-4 p-5 pt-0">
          <p className={cn("text-sm leading-6 text-muted-foreground", featured ? "line-clamp-4" : "line-clamp-3")}>
            {lesson.summary}
          </p>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <FileQuestion className="h-4 w-4" />
              {lesson._count.questions} câu hỏi
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-primary transition-colors group-hover:text-accent-foreground">
              <BookOpenText className="h-4 w-4" />
              Xem bài học
            </span>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-muted-foreground">
            <BookOpenCheck className="h-3.5 w-3.5 text-primary" />
            Tập trung học tập
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
