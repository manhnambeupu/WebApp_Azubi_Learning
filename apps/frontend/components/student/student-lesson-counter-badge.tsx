"use client";

import { Sparkles } from "lucide-react";
import { useGetStudentLessons } from "@/hooks/use-student-lessons";

export function StudentLessonCounterBadge() {
  const { data, isLoading } = useGetStudentLessons();

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-4 py-2 text-xs font-medium text-foreground shadow-[0_8px_24px_-16px_hsl(var(--accent)/0.85)]">
      <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
      {isLoading ? "Đang đồng bộ lộ trình" : `Đang có ${data?.length ?? 0} bài học`}
    </div>
  );
}
