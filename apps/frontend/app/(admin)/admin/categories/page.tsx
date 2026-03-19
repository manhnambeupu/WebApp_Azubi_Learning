"use client";

import dynamic from "next/dynamic";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ADMIN_CATEGORIES_QUERY_KEY, useGetCategories } from "@/hooks/use-categories";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

const CategoryFormDialog = dynamic(
  () =>
    import("@/components/categories/category-form-dialog").then(
      (mod) => mod.CategoryFormDialog,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-xs text-muted-foreground">Đang tải hộp thoại danh mục...</p>
    ),
  },
);

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const categoriesQuery = useGetCategories();

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      await api.delete(`/admin/categories/${categoryId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_CATEGORIES_QUERY_KEY,
      });
      toast({
        title: "Xóa danh mục thành công",
      });
    },
    onError: (error) => {
      toast({
        title: "Không thể xóa danh mục",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    },
    onSettled: () => {
      setPendingDeleteId(null);
    },
  });

  const handleDelete = (categoryId: string) => {
    setPendingDeleteId(categoryId);
    deleteMutation.mutate(categoryId);
  };

  return (
    <section className="space-y-6 kokonut-fade">
      <Card className="kokonut-glass-card kokonut-glow-border border-primary/15 bg-white/70 shadow-glass">
        <CardHeader className="flex flex-col gap-4 border-b border-primary/15 bg-gradient-to-r from-primary/5 via-background to-accent/10 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/15 px-3 py-1 text-xs font-medium shadow-[0_8px_20px_-16px_hsl(var(--accent)/0.9)]">
              <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
              Categories
            </div>
            <CardTitle className="text-2xl">Quản lý danh mục</CardTitle>
            <CardDescription>Tạo, chỉnh sửa và xóa danh mục bài học.</CardDescription>
          </div>

          <CategoryFormDialog
            triggerClassName="h-11 rounded-xl border border-white/25 bg-gradient-to-r from-primary to-amber-600 px-5 text-slate-950 shadow-glow-soft transition-all duration-300 hover:brightness-110"
            triggerLabel="Thêm danh mục"
          />
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {categoriesQuery.isLoading ? (
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải danh mục...
            </div>
          ) : null}

          {categoriesQuery.isError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(categoriesQuery.error)}
            </p>
          ) : null}

          {categoriesQuery.data ? (
            <div className="overflow-hidden rounded-2xl border border-primary/15 bg-white/85 shadow-glass">
              <Table>
                <TableHeader>
                  <TableRow className="border-primary/15 bg-primary/5 hover:bg-primary/5">
                    <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90">
                      Tên danh mục
                    </TableHead>
                    <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90">
                      Số bài học
                    </TableHead>
                    <TableHead className="w-[220px] px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-600/90">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriesQuery.data.length === 0 ? (
                    <TableRow className="border-primary/10 hover:bg-transparent">
                      <TableCell className="py-10 text-center text-muted-foreground" colSpan={3}>
                        Chưa có danh mục nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categoriesQuery.data.map((category, index) => (
                      <TableRow
                        className={cn(
                          "group/row border-primary/10 transition-colors duration-300 hover:bg-primary/[0.04]",
                          index % 2 === 0 ? "bg-white/90" : "bg-slate-50/45",
                        )}
                        key={category.id}
                      >
                        <TableCell className="px-4 py-4 font-medium">{category.name}</TableCell>
                        <TableCell className="px-4 py-4">{category.lessonCount}</TableCell>
                        <TableCell className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-100 transition-opacity duration-300 md:pointer-events-none md:opacity-0 md:group-hover/row:pointer-events-auto md:group-hover/row:opacity-100">
                            <CategoryFormDialog
                              initialData={{ id: category.id, name: category.name }}
                              triggerClassName="h-8 rounded-full border-primary/25 bg-white/90 px-3 hover:border-primary/40 hover:bg-white"
                              triggerLabel="Sửa"
                              triggerVariant="outline"
                            />

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  className="h-8 rounded-full"
                                  disabled={deleteMutation.isPending && pendingDeleteId === category.id}
                                  size="sm"
                                  variant="destructive"
                                >
                                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                  Xóa
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="border-primary/15 bg-white/85 shadow-glass backdrop-blur-xl data-[state=open]:animate-slide-up">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xóa danh mục?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Hành động này không thể hoàn tác. Nếu danh mục còn bài học,
                                    hệ thống sẽ từ chối xóa theo quy tắc nghiệp vụ.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDelete(category.id)}
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
