"use client";

import dynamic from "next/dynamic";
import { Loader2, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { ClientPagination } from "@/components/ui/client-pagination";
import { Input } from "@/components/ui/input";
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
import { ADMIN_CATEGORIES_QUERY_KEY, useGetCategories } from "@/hooks/use-categories";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";

const CategoryFormDialog = dynamic(
  () =>
    import("@/components/categories/category-form-dialog").then(
      (mod) => mod.CategoryFormDialog,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-xs font-bold text-[#777777] dark:text-slate-400">Đang tải hộp thoại danh mục...</p>
    ),
  },
);

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "lessonCount" | "default">("default");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;
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

  const filteredAndSortedCategories = useMemo(() => {
    if (!categoriesQuery.data) return [];

    let result = [...categoriesQuery.data];
    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((category) => category.name.toLowerCase().includes(lowerQuery));
    }

    if (sortKey !== "default") {
      result.sort((a, b) => {
        let valA: string | number = sortKey === "name" ? a.name.toLowerCase() : a.lessonCount;
        let valB: string | number = sortKey === "name" ? b.name.toLowerCase() : b.lessonCount;

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [categoriesQuery.data, searchQuery, sortKey, sortDirection]);

  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedCategories.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedCategories, currentPage]);

  return (
    <section className="space-y-6">
      <div className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24] shadow-sm">
        <div className="flex flex-col gap-4 border-b-2 border-[#e5e5e5] pb-6 dark:border-[#2b3940] sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#58cc02]/30 bg-[#e8f5e1] px-3 py-1 text-xs font-extrabold text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]">
              Danh mục
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#3c3c3c] dark:text-white sm:text-3xl">
              Quản lý danh mục
            </h1>
            <p className="text-xs md:text-sm font-bold text-[#777777] dark:text-slate-400">
              Tạo, chỉnh sửa và quản lý các danh mục bài học.
            </p>
          </div>

          <CategoryFormDialog
            triggerClassName="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-b-4 border-[#46a302] bg-[#58cc02] px-6 text-sm font-extrabold text-white transition-all hover:bg-[#46a302] active:translate-y-0.5 active:border-b-2"
            triggerLabel="Thêm danh mục"
          />
        </div>

        <div className="space-y-6 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777777] dark:text-slate-400" />
                <Input
                  className="h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] pl-10 text-sm font-bold text-[#3c3c3c] placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white"
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Tìm theo tên danh mục..."
                  value={searchQuery}
                />
              </div>
            </div>
            <div className="w-full sm:w-[200px] space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300">
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
                    (key === "name" || key === "lessonCount") &&
                    (direction === "asc" || direction === "desc")
                  ) {
                    setSortKey(key);
                    setSortDirection(direction);
                  }
                }}
                value={`${sortKey}-${sortDirection}`}
              >
                <SelectTrigger className="h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-bold text-[#3c3c3c] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2 border-[#e5e5e5] bg-white dark:border-[#2b3940] dark:bg-[#131f24]">
                  <SelectItem value="default-asc">Mặc định</SelectItem>
                  <SelectItem value="name-asc">Tên (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Tên (Z-A)</SelectItem>
                  <SelectItem value="lessonCount-desc">Số bài học (nhiều nhất)</SelectItem>
                  <SelectItem value="lessonCount-asc">Số bài học (ít nhất)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {categoriesQuery.isLoading ? (
            <div className="flex items-center gap-2 rounded-2xl border-2 border-[#58cc02]/30 bg-[#e8f5e1] p-4 text-xs font-extrabold text-[#46a302]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải danh mục...
            </div>
          ) : null}

          {categoriesQuery.isError ? (
            <p className="rounded-2xl border-2 border-[#ff4b4b]/40 bg-[#ffebee] p-3 text-xs font-extrabold text-[#ff4b4b] dark:bg-[#ff4b4b]/15">
              {getApiErrorMessage(categoriesQuery.error)}
            </p>
          ) : null}

          {categoriesQuery.data ? (
            <>
              <div className="overflow-hidden rounded-2xl border-2 border-[#e5e5e5] bg-white shadow-sm dark:border-[#2b3940] dark:bg-[#131f24]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-[#e5e5e5] bg-[#f7f7f7] hover:bg-[#f7f7f7] dark:border-[#2b3940] dark:bg-[#111b21] dark:hover:bg-[#111b21]">
                      <TableHead className="h-12 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                        Tên danh mục
                      </TableHead>
                      <TableHead className="h-12 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                        Số bài học
                      </TableHead>
                      <TableHead className="w-[220px] px-4 text-right text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedCategories.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell className="py-12 text-center text-sm font-bold text-[#777777] dark:text-slate-400" colSpan={3}>
                          Chưa có danh mục nào khớp với thẻ lọc.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedCategories.map((category) => (
                        <TableRow
                          className="border-b border-[#e5e5e5] transition-colors hover:bg-[#f7f7f7] dark:border-[#2b3940] dark:hover:bg-[#18252d]"
                          key={category.id}
                        >
                          <TableCell className="px-4 py-4 font-extrabold text-[#3c3c3c] dark:text-white">
                            {category.name}
                          </TableCell>
                          <TableCell className="px-4 py-4 font-bold text-[#777777] dark:text-slate-300">
                            {category.lessonCount}
                          </TableCell>
                          <TableCell className="px-4 py-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <CategoryFormDialog
                                initialData={{ id: category.id, name: category.name }}
                                triggerClassName="h-9 rounded-xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white px-3 text-xs font-extrabold text-[#3c3c3c] hover:border-[#58cc02] hover:text-[#46a302] active:translate-y-0.5 active:border-b-2 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#18252d] dark:text-white"
                                triggerLabel="Sửa"
                                triggerVariant="ghost"
                              />

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    className="h-9 rounded-xl border-2 border-[#ff4b4b]/30 border-b-4 border-b-[#e03838] bg-[#ffebee] px-3 text-xs font-extrabold text-[#ff4b4b] hover:bg-[#ffdada] active:translate-y-0.5 active:border-b-2 dark:border-[#ff4b4b]/40 dark:border-b-[#ff4b4b]/80 dark:bg-[#ff4b4b]/20"
                                    disabled={deleteMutation.isPending && pendingDeleteId === category.id}
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
                                      Xóa danh mục?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-xs font-bold text-[#777777] dark:text-slate-400">
                                      Hành động này không thể hoàn tác. Nếu danh mục còn bài học,
                                      hệ thống sẽ từ chối xóa theo quy tắc nghiệp vụ.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="mt-4 gap-2">
                                    <AlertDialogCancel className="rounded-xl border-2 border-[#e5e5e5] font-extrabold text-[#3c3c3c] dark:border-[#2b3940] dark:text-white">
                                      Hủy
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="rounded-xl border-b-4 border-[#e03838] bg-[#ff4b4b] font-extrabold text-white hover:bg-[#e03838]"
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

              <div className="py-2">
                <ClientPagination
                  currentPage={currentPage}
                  totalItems={filteredAndSortedCategories.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
