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
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium" htmlFor="lesson-search">
            Tìm kiếm
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 border-primary/20 bg-white/80 pl-9 dark:bg-slate-900/80"
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

        <div className="space-y-2 md:w-[220px]">
          <label className="text-sm font-medium" htmlFor="lesson-category-filter">
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
              className="border-primary/20 bg-white/80 dark:bg-slate-900/80"
              id="lesson-category-filter"
            >
              <SelectValue placeholder="Chọn danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES_VALUE}>Tất cả danh mục</SelectItem>
              {(categoriesQuery.data ?? []).map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:w-[200px]">
          <label className="text-sm font-medium" htmlFor="lesson-sort">
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
            <SelectTrigger className="border-primary/20 bg-white/80 dark:bg-slate-900/80" id="lesson-sort">
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent>
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
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(lessonsQuery.error)}
        </p>
      ) : null}

      {lessonsQuery.data ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-primary/15 bg-white/85 shadow-glass dark:bg-slate-900/85">
            <Table>
              <TableHeader>
                <TableRow className="border-primary/15 bg-primary/5 hover:bg-primary/5">
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90">
                    Bài học
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90">
                    Danh mục
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90">
                    Số câu hỏi
                  </TableHead>
                  <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90">
                    Có ảnh
                  </TableHead>
                  <TableHead className="h-11 px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-600/90">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedLessons.length === 0 ? (
                  <TableRow className="border-primary/10 hover:bg-transparent">
                    <TableCell className="py-10 text-center text-muted-foreground" colSpan={5}>
                      Chưa có bài học nào khớp với bộ lọc.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLessons.map((lesson) => (
                    <TableRow
                      className="border-primary/10 transition-colors duration-300 hover:bg-primary/[0.04]"
                      key={lesson.id}
                    >
                      <TableCell className="max-w-[360px] px-4 py-4 align-top">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium leading-6">{lesson.title}</p>
                            {lesson.isPrivate ? (
                              <Badge className="rounded-full border border-rose-300/60 bg-rose-100 text-rose-700 hover:bg-rose-100">
                                🔒 Private
                              </Badge>
                            ) : null}
                          </div>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {lesson.summary}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge className="rounded-full border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15">
                          {lesson.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4">{lesson._count.questions}</TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge
                          className={
                            lesson.imageUrl
                              ? "rounded-full border border-emerald-300/60 bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                              : undefined
                          }
                          variant={lesson.imageUrl ? "secondary" : "outline"}
                        >
                          {lesson.imageUrl ? "Có ảnh" : "Không ảnh"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <AccessManagementDialog lessonId={lesson.id} />

                          <Button
                            asChild
                            className="rounded-full border-primary/25 bg-white/90 hover:border-primary/40 hover:bg-white dark:bg-slate-950/90 dark:hover:bg-slate-950"
                            size="sm"
                            variant="outline"
                          >
                            <Link href={`/admin/lessons/${lesson.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Sửa
                            </Link>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                disabled={deleteLessonMutation.isPending && pendingDeleteId === lesson.id}
                                size="sm"
                                variant="destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa bài học?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Xóa bài học sẽ xóa tất cả câu hỏi, đáp án, file đính kèm và lịch sử
                                  làm bài. Bạn có chắc chắn?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

          <div className="py-4">
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
