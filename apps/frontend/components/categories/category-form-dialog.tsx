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
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

type CategoryFormDialogProps = {
  initialData?: Pick<Category, "id" | "name">;
  triggerLabel: string;
  triggerVariant?: ButtonProps["variant"];
  triggerClassName?: string;
};

export function CategoryFormDialog({
  initialData,
  triggerLabel,
  triggerVariant = "default",
  triggerClassName,
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
        <Button className={cn(triggerClassName)} size="sm" variant={triggerVariant}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[24px] border-2 border-[#e5e5e5] bg-white p-6 shadow-2xl dark:border-[#2b3940] dark:bg-[#131f24]">
        <DialogHeader className="border-b-2 border-[#e5e5e5] pb-4 dark:border-[#2b3940]">
          <DialogTitle className="text-xl font-extrabold text-[#3c3c3c] dark:text-white">
            {isEditMode ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-[#777777] dark:text-slate-400">
            {isEditMode
              ? "Cập nhật tên danh mục và lưu thay đổi."
              : "Nhập tên danh mục để tạo mới."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 pt-2" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300" htmlFor="category-name">
              Tên danh mục
            </Label>
            <Input
              className="h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-bold text-[#3c3c3c] placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white"
              id="category-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Ví dụ: Buồng phòng"
              value={name}
            />
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              className="h-11 rounded-2xl border-b-4 border-[#46a302] bg-[#58cc02] px-6 text-sm font-extrabold text-white transition-all hover:bg-[#46a302] active:translate-y-0.5 active:border-b-2 disabled:opacity-50"
              disabled={mutation.isPending}
              type="submit"
            >
              {mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
