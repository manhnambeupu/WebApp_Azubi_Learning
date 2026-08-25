import Link from "next/link";
import { BookOpenText, CalendarDays, FileQuestion, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StudentLessonListItem } from "@/types";

type LessonCardProps = {
  lesson: StudentLessonListItem;
  featured?: boolean;
};

export function LessonCard({ lesson, featured = false }: LessonCardProps) {
  return (
    <Link className="group block h-full" href={`/student/lessons/${lesson.id}`}>
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white transition-all hover:-translate-y-1 hover:border-[#58cc02] active:translate-y-0.5 active:border-b-2 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24] shadow-sm",
          featured && "min-h-[24rem]"
        )}
      >
        <div
          className={cn(
            "relative w-full overflow-hidden border-b-2 border-[#e5e5e5] bg-[#f7f7f7] dark:border-[#2b3940] dark:bg-[#111b21]",
            featured ? "h-52" : "h-44"
          )}
        >
          {lesson.imageUrl ? (
            <div
              className="h-full w-full bg-cover bg-center bg-no-repeat transition-transform duration-500 ease-out group-hover:scale-105"
              style={{ backgroundImage: `url(${lesson.imageUrl})` }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#f0fdf4] dark:bg-[#111b21] text-[#46a302]">
              <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#58cc02]/30 bg-white px-3 py-1 text-xs font-extrabold text-[#46a302] dark:bg-[#131f24]">
                <ImageIcon className="h-4 w-4" />
                <span>Lesson</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border-2 border-[#58cc02]/30 bg-[#e8f5e1] px-2.5 py-0.5 text-xs font-extrabold text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]">
              {lesson.category.name}
            </Badge>
            <Badge
              className={
                lesson.isCompleted
                  ? "rounded-full border-2 border-[#ffc800]/40 bg-[#fef9e7] px-2.5 py-0.5 text-xs font-extrabold text-[#d97706] dark:bg-[#ffc800]/20 dark:text-[#ffc800]"
                  : "rounded-full border-2 border-[#e5e5e5] bg-[#f7f7f7] px-2.5 py-0.5 text-xs font-extrabold text-[#777777] dark:border-[#2b3940] dark:bg-[#111b21] dark:text-slate-400"
              }
            >
              {lesson.isCompleted ? "Đã hoàn thành" : "Chưa hoàn thành"}
            </Badge>
          </div>

          <h2 className="mt-3 line-clamp-2 text-base font-extrabold tracking-tight text-[#3c3c3c] group-hover:text-[#58cc02] dark:text-white transition-colors">
            {lesson.title}
          </h2>

          <p className={cn("mt-2 text-xs font-bold leading-relaxed text-[#777777] dark:text-slate-400", featured ? "line-clamp-4" : "line-clamp-3")}>
            {lesson.summary}
          </p>

          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between border-t-2 border-[#e5e5e5] pt-3 text-xs font-extrabold text-[#777777] dark:border-[#2b3940] dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <FileQuestion className="h-4 w-4 text-[#46a302]" />
                {lesson._count.questions} câu hỏi
              </span>
              <span className="inline-flex items-center gap-1 text-[#46a302] dark:text-[#58cc02] group-hover:translate-x-0.5 transition-transform">
                <BookOpenText className="h-4 w-4" />
                Vào học
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
