"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { useGetCategories } from "@/hooks/use-categories";
import { useDeleteLesson, useGetLessons } from "@/hooks/use-lessons";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";

const ALL_CATEGORIES_VALUE = "all";

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES_VALUE);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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

  return (
    <section className="space-y-6 rounded-lg border bg-background p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quản lý bài học</h1>
          <p className="text-sm text-muted-foreground">
            Tạo, chỉnh sửa và theo dõi nội dung các bài học trong hệ thống.
          </p>
        </div>

        <Button asChild>
          <Link href="/admin/lessons/new">
            <Plus className="mr-2 h-4 w-4" />
            Tạo bài học mới
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:max-w-sm">
        <label className="text-sm font-medium" htmlFor="lesson-category-filter">
          Lọc theo danh mục
        </label>
        <Select onValueChange={setCategoryFilter} value={categoryFilter}>
          <SelectTrigger id="lesson-category-filter">
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

      {lessonsQuery.isLoading ? (
        <div className="flex items-center gap-2 rounded-md border px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải danh sách bài học...
        </div>
      ) : null}

      {lessonsQuery.isError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(lessonsQuery.error)}
        </p>
      ) : null}

      {lessonsQuery.data ? (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bài học</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Số câu hỏi</TableHead>
                <TableHead>Có ảnh</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessonsQuery.data.length === 0 ? (
                <TableRow>
                  <TableCell className="py-8 text-center text-muted-foreground" colSpan={5}>
                    Chưa có bài học nào trong danh mục này.
                  </TableCell>
                </TableRow>
              ) : (
                lessonsQuery.data.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell className="max-w-[360px]">
                      <div className="space-y-1">
                        <p className="font-medium">{lesson.title}</p>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {lesson.summary}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{lesson.category.name}</Badge>
                    </TableCell>
                    <TableCell>{lesson._count.questions}</TableCell>
                    <TableCell>
                      <Badge variant={lesson.imageUrl ? "default" : "outline"}>
                        {lesson.imageUrl ? "Có ảnh" : "Không ảnh"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/lessons/${lesson.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Sửa
                          </Link>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              disabled={
                                deleteLessonMutation.isPending && pendingDeleteId === lesson.id
                              }
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
                                Xóa bài học sẽ xóa tất cả câu hỏi, đáp án, file đính kèm và lịch
                                sử làm bài. Bạn có chắc chắn?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
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
      ) : null}
    </section>
  );
}
