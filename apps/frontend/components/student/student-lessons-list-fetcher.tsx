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
      <p className="rounded-2xl border-2 border-[#ff4b4b]/40 bg-[#ffebee] p-4 text-xs font-extrabold text-[#ff4b4b] dark:bg-[#ff4b4b]/15">
        {getApiErrorMessage(lessonsQuery.error)}
      </p>
    );
  }

  if (!lessonsQuery.data || lessonsQuery.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#e5e5e5] bg-white px-6 py-16 text-center shadow-sm dark:border-[#2b3940] dark:bg-[#131f24]">
        <BookOpenText className="h-10 w-10 text-[#777777] dark:text-slate-400" />
        <h2 className="mt-4 text-base font-extrabold text-[#3c3c3c] dark:text-white">Chưa có bài học nào</h2>
        <p className="mt-1 max-w-md text-xs font-bold text-[#777777] dark:text-slate-400">
          Danh sách bài học sẽ hiển thị tại đây khi nội dung được phát hành.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-col gap-4 rounded-[20px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-4 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777777] dark:text-slate-400" />
          <Input
            placeholder="Tìm kiếm tên bài học, nội dung..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] pl-10 text-xs font-bold text-[#3c3c3c] placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger className="h-11 w-[180px] rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-xs font-bold text-[#3c3c3c] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white">
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-2 border-[#e5e5e5] bg-white dark:border-[#2b3940] dark:bg-[#131f24]">
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
              className="h-10 w-10 rounded-xl border-2 border-[#e5e5e5] text-[#777777] hover:border-[#ff4b4b] hover:text-[#ff4b4b] dark:border-[#2b3940] dark:text-slate-400"
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {filteredLessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-[#e5e5e5] bg-white px-6 py-16 text-center shadow-sm dark:border-[#2b3940] dark:bg-[#131f24]">
          <BookOpenText className="h-10 w-10 text-[#777777] dark:text-slate-400" />
          <h2 className="mt-4 text-base font-extrabold text-[#3c3c3c] dark:text-white">Không tìm thấy bài học phù hợp</h2>
          <p className="mt-1 max-w-md text-xs font-bold text-[#777777] dark:text-slate-400">
            Hãy thử từ khóa khác hoặc thay đổi danh mục để xem thêm bài học.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((lesson, index) => {
            const featured = index === 0;
            return (
              <article
                className={cn("h-full", featured ? "sm:col-span-2 lg:col-span-2" : "col-span-1")}
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
