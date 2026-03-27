"use client";

import { useMemo, useState } from "react";
import { BookOpenText, FilterX, Search } from "lucide-react";
import { LessonCard } from "@/components/student/lesson-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LessonsGridSkeleton } from "@/components/ui/lessons-list-skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetStudentLessons } from "@/hooks/use-student-lessons";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

export function StudentLessonsListFetcher() {
  const lessonsQuery = useGetStudentLessons();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("ALL");

  const categories = useMemo(() => {
    if (!lessonsQuery.data) return [];

    const categoryMap = new Map<string, string>();
    lessonsQuery.data.forEach((lesson) => {
      categoryMap.set(lesson.category.id, lesson.category.name);
    });

    return Array.from(categoryMap.entries()).map(([id, name]) => ({ id, name }));
  }, [lessonsQuery.data]);

  const filteredLessons = useMemo(() => {
    if (!lessonsQuery.data) return [];

    const normalizedSearchQuery = searchQuery.toLowerCase();
    return lessonsQuery.data.filter((lesson) => {
      const matchSearch =
        lesson.title.toLowerCase().includes(normalizedSearchQuery) ||
        lesson.summary.toLowerCase().includes(normalizedSearchQuery);
      const matchCategory = selectedCategoryId === "ALL" || lesson.category.id === selectedCategoryId;
      return matchSearch && matchCategory;
    });
  }, [lessonsQuery.data, searchQuery, selectedCategoryId]);

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
    <div>
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-primary/10 bg-white/60 p-4 shadow-sm dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tên bài học, nội dung..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="border-primary/20 bg-white/80 pl-9 focus-visible:ring-primary/30 dark:bg-slate-900/80"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger className="w-[180px] border-primary/20 bg-white/80 dark:bg-slate-900/80">
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả danh mục</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchQuery || selectedCategoryId !== "ALL") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategoryId("ALL");
              }}
              title="Xóa bộ lọc"
              className="h-10 w-10 text-muted-foreground hover:text-destructive"
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {filteredLessons.length === 0 ? (
        <div className="kokonut-glass-card flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-white/65 px-6 py-16 text-center shadow-glass dark:bg-slate-950/45">
          <BookOpenText className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Không tìm thấy bài học phù hợp</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Hãy thử từ khóa khác hoặc thay đổi danh mục để xem thêm bài học.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-6">
          {filteredLessons.map((lesson, index) => {
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
      )}
    </div>
  );
}
