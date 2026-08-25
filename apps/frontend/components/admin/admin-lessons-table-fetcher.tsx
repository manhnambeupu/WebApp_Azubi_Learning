"use client";

import { Pencil, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClientPagination } from "@/components/ui/client-pagination";
import { Input } from "@/components/ui/input";
import { LessonsTableSkeleton } from "@/components/ui/lessons-list-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccessManagementDialog } from "@/components/lessons/AccessManagementDialog";
import { useGetCategories } from "@/hooks/use-categories";
import { useDeleteLesson, useGetLessons } from "@/hooks/use-lessons";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";

const ALL_CATEGORIES_VALUE = "all";

export function AdminLessonsTableFetcher() {
  const { toast } = useToast();
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES_VALUE);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<"title" | "questions" | "default">("default");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;

  const categoryId = useMemo(
    () => (categoryFilter === ALL_CATEGORIES_VALUE ? undefined : categoryFilter),
    [categoryFilter],
  );

  const categoriesQuery = useGetCategories();
  const lessonsQuery = useGetLessons(categoryId);
  const deleteLessonMutation = useDeleteLesson();

  const handleDeleteLesson = async (lessonId: string) => {
    setPendingDeleteId(lessonId);
    try {
      await deleteLessonMutation.mutateAsync(lessonId);
      toast({
        title: "Xóa bài học thành công",
      });
    } catch (error) {
      toast({
        title: "Không thể xóa bài học",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setPendingDeleteId(null);
    }
  };

  const filteredAndSortedLessons = useMemo(() => {
    if (!lessonsQuery.data) return [];

    let result = [...lessonsQuery.data];
    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(lowerQuery) ||
          (lesson.summary && lesson.summary.toLowerCase().includes(lowerQuery)),
      );
    }

    if (sortKey !== "default") {
      result.sort((a, b) => {
        let valueA: string | number = "";
        let valueB: string | number = "";

        if (sortKey === "title") {
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
        } else if (sortKey === "questions") {
          valueA = a._count?.questions ?? 0;
          valueB = b._count?.questions ?? 0;
        }

        if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
        if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [lessonsQuery.data, searchQuery, sortKey, sortDirection]);

  const paginatedLessons = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedLessons.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedLessons, currentPage]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300" htmlFor="lesson-search">
            Tìm kiếm
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777777] dark:text-slate-400" />
            <Input
              className="h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] pl-10 text-sm font-bold text-[#3c3c3c] placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white"
              id="lesson-search"
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Nhập tên hoặc mô tả bài học..."
              value={searchQuery}
            />
          </div>
        </div>

        <div className="space-y-1.5 md:w-[220px]">
          <label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300" htmlFor="lesson-category-filter">
            Lọc theo danh mục
          </label>
          <Select
            onValueChange={(value) => {
              setCategoryFilter(value);
              setCurrentPage(1);
            }}
            value={categoryFilter}
          >
            <SelectTrigger
              className="h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-bold text-[#3c3c3c] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white"
              id="lesson-category-filter"
            >
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-2 border-[#e5e5e5] bg-white dark:border-[#2b3940] dark:bg-[#131f24]">
              <SelectItem value={ALL_CATEGORIES_VALUE}>Tất cả danh mục</SelectItem>
              {(categoriesQuery.data ?? []).map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 md:w-[200px]">
          <label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300" htmlFor="lesson-sort">
            Sắp xếp
          </label>
          <Select
            onValueChange={(value) => {
              const [key, direction] = value.split("-");
              setCurrentPage(1);

              if (key === "default") {
                setSortKey("default");
                setSortDirection("asc");
                return;
              }

              if (
                (key === "title" || key === "questions") &&
                (direction === "asc" || direction === "desc")
              ) {
                setSortKey(key);
                setSortDirection(direction);
              }
            }}
            value={`${sortKey}-${sortDirection}`}
          >
            <SelectTrigger
              className="h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-bold text-[#3c3c3c] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white"
              id="lesson-sort"
            >
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-2 border-[#e5e5e5] bg-white dark:border-[#2b3940] dark:bg-[#131f24]">
              <SelectItem value="default-asc">Mặc định</SelectItem>
              <SelectItem value="title-asc">Tên (A-Z)</SelectItem>
              <SelectItem value="title-desc">Tên (Z-A)</SelectItem>
              <SelectItem value="questions-asc">Số câu hỏi (↑)</SelectItem>
              <SelectItem value="questions-desc">Số câu hỏi (↓)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {lessonsQuery.isLoading ? <LessonsTableSkeleton /> : null}

      {lessonsQuery.isError ? (
        <p className="rounded-2xl border-2 border-[#ff4b4b]/40 bg-[#ffebee] p-3 text-xs font-extrabold text-[#ff4b4b] dark:bg-[#ff4b4b]/15">
          {getApiErrorMessage(lessonsQuery.error)}
        </p>
      ) : null}

      {lessonsQuery.data ? (
        <>
          <div className="overflow-hidden rounded-2xl border-2 border-[#e5e5e5] bg-white shadow-sm dark:border-[#2b3940] dark:bg-[#131f24]">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-[#e5e5e5] bg-[#f7f7f7] hover:bg-[#f7f7f7] dark:border-[#2b3940] dark:bg-[#111b21] dark:hover:bg-[#111b21]">
                  <TableHead className="h-12 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                    Bài học
                  </TableHead>
                  <TableHead className="h-12 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                    Danh mục
                  </TableHead>
                  <TableHead className="h-12 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                    Số câu hỏi
                  </TableHead>
                  <TableHead className="h-12 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                    Trạng thái
                  </TableHead>
                  <TableHead className="h-12 px-4 text-right text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedLessons.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="py-12 text-center text-sm font-bold text-[#777777] dark:text-slate-400" colSpan={5}>
                      Chưa có bài học nào khớp với bộ lọc.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLessons.map((lesson) => (
                    <TableRow
                      className="border-b border-[#e5e5e5] transition-colors hover:bg-[#f7f7f7] dark:border-[#2b3940] dark:hover:bg-[#18252d]"
                      key={lesson.id}
                    >
                      <TableCell className="max-w-[360px] px-4 py-4 align-top">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-extrabold leading-6 text-[#3c3c3c] dark:text-white">{lesson.title}</p>
                            {lesson.isPrivate ? (
                              <Badge className="rounded-full border-2 border-[#ff4b4b]/30 bg-[#ffebee] px-2 py-0.5 text-[11px] font-extrabold text-[#ff4b4b] dark:bg-[#ff4b4b]/20">
                                🔒 Private
                              </Badge>
                            ) : null}
                          </div>
                          <p className="line-clamp-2 text-xs font-bold text-[#777777] dark:text-slate-400">
                            {lesson.summary}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge className="rounded-full border-2 border-[#58cc02]/30 bg-[#e8f5e1] px-2.5 py-0.5 text-xs font-extrabold text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]">
                          {lesson.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 font-bold text-[#3c3c3c] dark:text-white">
                        {lesson._count.questions}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge
                          className={
                            lesson.imageUrl
                              ? "rounded-full border-2 border-[#0284c7]/30 bg-[#e0f2fe] px-2.5 py-0.5 text-xs font-extrabold text-[#0284c7] dark:bg-[#0284c7]/20"
                              : "rounded-full border-2 border-[#e5e5e5] bg-[#f7f7f7] px-2.5 py-0.5 text-xs font-extrabold text-[#777777] dark:border-[#2b3940] dark:bg-[#111b21] dark:text-slate-400"
                          }
                        >
                          {lesson.imageUrl ? "Có ảnh" : "Không ảnh"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <AccessManagementDialog lessonId={lesson.id} />

                          <Button
                            asChild
                            className="h-9 rounded-xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white px-3 text-xs font-extrabold text-[#3c3c3c] hover:border-[#58cc02] hover:text-[#46a302] active:translate-y-0.5 active:border-b-2 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#18252d] dark:text-white"
                            size="sm"
                            variant="ghost"
                          >
                            <Link href={`/admin/lessons/${lesson.id}/edit`}>
                              <Pencil className="mr-1.5 h-3.5 w-3.5" />
                              Sửa
                            </Link>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                className="h-9 rounded-xl border-2 border-[#ff4b4b]/30 border-b-4 border-b-[#e03838] bg-[#ffebee] px-3 text-xs font-extrabold text-[#ff4b4b] hover:bg-[#ffdada] active:translate-y-0.5 active:border-b-2 dark:border-[#ff4b4b]/40 dark:border-b-[#ff4b4b]/80 dark:bg-[#ff4b4b]/20"
                                disabled={deleteLessonMutation.isPending && pendingDeleteId === lesson.id}
                                size="sm"
                                variant="ghost"
                              >
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                Xóa
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl border-2 border-[#e5e5e5] bg-white p-6 dark:border-[#2b3940] dark:bg-[#131f24]">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-lg font-extrabold text-[#3c3c3c] dark:text-white">
                                  Xóa bài học?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-xs font-bold text-[#777777] dark:text-slate-400">
                                  Xóa bài học sẽ xóa tất cả câu hỏi, đáp án, file đính kèm và lịch sử
                                  làm bài. Bạn có chắc chắn muốn xóa?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="mt-4 gap-2">
                                <AlertDialogCancel className="rounded-xl border-2 border-[#e5e5e5] font-extrabold text-[#3c3c3c] dark:border-[#2b3940] dark:text-white">
                                  Hủy
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="rounded-xl border-b-4 border-[#e03838] bg-[#ff4b4b] font-extrabold text-white hover:bg-[#e03838]"
                                  onClick={() => {
                                    void handleDeleteLesson(lesson.id);
                                  }}
                                >
                                  Xác nhận xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="py-2">
            <ClientPagination
              currentPage={currentPage}
              totalItems={filteredAndSortedLessons.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
