"use client";

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
    <main className="space-y-6 rounded-lg border bg-background p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Quản lý danh mục
          </h1>
          <p className="text-sm text-muted-foreground">
            Tạo, chỉnh sửa và xóa danh mục bài học.
          </p>
        </div>
        <CategoryFormDialog triggerLabel="Thêm danh mục" />
      </div>

      {categoriesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải danh mục...</p>
      ) : null}

      {categoriesQuery.isError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(categoriesQuery.error)}
        </p>
      ) : null}

      {categoriesQuery.data ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên danh mục</TableHead>
                <TableHead>Số bài học</TableHead>
                <TableHead className="w-[220px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesQuery.data.length === 0 ? (
                <TableRow>
                  <TableCell className="py-8 text-center text-muted-foreground" colSpan={3}>
                    Chưa có danh mục nào.
                  </TableCell>
                </TableRow>
              ) : (
                categoriesQuery.data.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.lessonCount}</TableCell>
                    <TableCell className="text-right">
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
    </main>
  );
}
