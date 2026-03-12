"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
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
    <section className="space-y-6">
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-border/70 bg-slate-50/70 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-2xl">Quản lý danh mục</CardTitle>
            <CardDescription>Tạo, chỉnh sửa và xóa danh mục bài học.</CardDescription>
          </div>

          <CategoryFormDialog triggerLabel="Thêm danh mục" />
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {categoriesQuery.isLoading ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải danh mục...
            </div>
          ) : null}

          {categoriesQuery.isError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(categoriesQuery.error)}
            </p>
          ) : null}

          {categoriesQuery.data ? (
            <div className="overflow-hidden rounded-lg border border-slate-200/80">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/80 bg-slate-100/70 hover:bg-slate-100/70">
                    <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Tên danh mục
                    </TableHead>
                    <TableHead className="h-11 px-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Số bài học
                    </TableHead>
                    <TableHead className="w-[220px] px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriesQuery.data.length === 0 ? (
                    <TableRow className="border-slate-200/70 hover:bg-transparent">
                      <TableCell className="py-10 text-center text-muted-foreground" colSpan={3}>
                        Chưa có danh mục nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categoriesQuery.data.map((category) => (
                      <TableRow
                        className="border-slate-200/70 hover:bg-slate-50/90"
                        key={category.id}
                      >
                        <TableCell className="px-4 py-4 font-medium">{category.name}</TableCell>
                        <TableCell className="px-4 py-4">{category.lessonCount}</TableCell>
                        <TableCell className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <CategoryFormDialog
                              initialData={{ id: category.id, name: category.name }}
                              triggerLabel="Sửa"
                              triggerVariant="outline"
                            />

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  disabled={deleteMutation.isPending && pendingDeleteId === category.id}
                                  size="sm"
                                  variant="destructive"
                                >
                                  Xóa
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
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
