"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_CATEGORIES_QUERY_KEY } from "@/hooks/use-categories";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { Category } from "@/types";

type CategoryFormDialogProps = {
  initialData?: Pick<Category, "id" | "name">;
  triggerLabel: string;
  triggerVariant?: ButtonProps["variant"];
};

export function CategoryFormDialog({
  initialData,
  triggerLabel,
  triggerVariant = "default",
}: CategoryFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialData?.name ?? "");

  const isEditMode = Boolean(initialData);

  useEffect(() => {
    if (!open) {
      setName(initialData?.name ?? "");
    }
  }, [initialData?.name, open]);

  const trimmedName = useMemo(() => name.trim(), [name]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEditMode && initialData) {
        await api.patch(`/admin/categories/${initialData.id}`, {
          name: trimmedName,
        });
        return;
      }

      await api.post("/admin/categories", {
        name: trimmedName,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_CATEGORIES_QUERY_KEY,
      });

      toast({
        title: isEditMode ? "Cập nhật thành công" : "Tạo danh mục thành công",
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: isEditMode ? "Không thể cập nhật danh mục" : "Không thể tạo danh mục",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trimmedName) {
      toast({
        title: "Tên danh mục không hợp lệ",
        description: "Tên danh mục không được để trống.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate();
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm" variant={triggerVariant}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Cập nhật tên danh mục và lưu thay đổi."
              : "Nhập tên danh mục để tạo mới."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="category-name">Tên danh mục</Label>
            <Input
              id="category-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Ví dụ: Buồng phòng"
              value={name}
            />
          </div>

          <DialogFooter>
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
