"use client";

import { Loader2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <section className="space-y-6 kokonut-fade">
      <Card className="kokonut-glass-card kokonut-glow-border border-primary/15 bg-white/70 shadow-glass">
        <CardHeader className="flex flex-col gap-4 border-b border-primary/15 bg-gradient-to-r from-primary/5 via-background to-accent/10 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/15 px-3 py-1 text-xs font-medium text-foreground shadow-[0_8px_20px_-16px_hsl(var(--accent)/0.9)]">
              <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
              Admin dashboard
            </div>
            <CardTitle className="pt-2 text-2xl">Quản lý bài học</CardTitle>
            <CardDescription className="max-w-2xl leading-7">
              Tạo, chỉnh sửa và theo dõi nội dung các bài học trong hệ thống.
            </CardDescription>
          </div>

          <Button
            asChild
            className="kokonut-hover-lift h-11 w-full rounded-xl border border-white/25 bg-gradient-to-r from-primary via-blue-700 to-amber-600 px-5 text-white shadow-glow-soft transition-all duration-300 hover:brightness-110 hover:shadow-glow-strong sm:w-auto"
          >
            <Link href="/admin/lessons/new">
              <Plus className="mr-2 h-4 w-4" />
              Tạo bài học mới
            </Link>
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="grid gap-3 rounded-2xl border border-primary/15 bg-white/65 p-4 md:max-w-sm">
            <label className="text-sm font-medium" htmlFor="lesson-category-filter">
              Lọc theo danh mục
            </label>
            <Select onValueChange={setCategoryFilter} value={categoryFilter}>
              <SelectTrigger className="border-primary/20 bg-white/80" id="lesson-category-filter">
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
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải danh sách bài học...
            </div>
          ) : null}

          {lessonsQuery.isError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(lessonsQuery.error)}
            </p>
          ) : null}

          {lessonsQuery.data ? (
            <div className="overflow-hidden rounded-2xl border border-primary/15 bg-white/85 shadow-glass">
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
                  {lessonsQuery.data.length === 0 ? (
                    <TableRow className="border-primary/10 hover:bg-transparent">
                      <TableCell className="py-10 text-center text-muted-foreground" colSpan={5}>
                        Chưa có bài học nào trong danh mục này.
                      </TableCell>
                    </TableRow>
                  ) : (
                    lessonsQuery.data.map((lesson) => (
                      <TableRow
                        className="border-primary/10 transition-colors duration-300 hover:bg-primary/[0.04]"
                        key={lesson.id}
                      >
                        <TableCell className="max-w-[360px] px-4 py-4 align-top">
                          <div className="space-y-1">
                            <p className="font-medium leading-6">{lesson.title}</p>
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
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="rounded-full border-primary/25 bg-white/90 hover:border-primary/40 hover:bg-white"
                            >
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
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
