"use client";

import dynamic from "next/dynamic";
import { Loader2, Search, Trash2 } from "lucide-react";
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
import { useDeleteStudent, useGetStudents } from "@/hooks/use-students";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";

const CreateStudentDialog = dynamic(
  () =>
    import("@/components/admin/create-student-dialog").then(
      (mod) => mod.CreateStudentDialog,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-xs font-bold text-[#777777] dark:text-slate-400">Đang tải hộp thoại học viên...</p>
    ),
  },
);

const formatCreatedAt = (value: string): string =>
  new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function StudentsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-[#e5e5e5] bg-white p-4 dark:border-[#2b3940] dark:bg-[#131f24]">
      <div className="h-10 animate-pulse rounded-xl bg-[#f0f0f0] dark:bg-[#1f2d35]" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="grid grid-cols-5 gap-4" key={index}>
            <div className="h-6 animate-pulse rounded bg-[#f7f7f7] dark:bg-[#18252d]" />
            <div className="h-6 animate-pulse rounded bg-[#f7f7f7] dark:bg-[#18252d]" />
            <div className="h-6 animate-pulse rounded bg-[#f7f7f7] dark:bg-[#18252d]" />
            <div className="h-6 animate-pulse rounded bg-[#f7f7f7] dark:bg-[#18252d]" />
            <div className="h-6 animate-pulse rounded bg-[#f7f7f7] dark:bg-[#18252d]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminStudentsPage() {
  const { toast } = useToast();
  const studentsQuery = useGetStudents();
  const deleteStudentMutation = useDeleteStudent();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "email" | "date" | "default">("default");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;

  const sortedAndFilteredStudents = useMemo(() => {
    if (!studentsQuery.data) return [];

    let result = [...studentsQuery.data];
    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (student) =>
          student.fullName.toLowerCase().includes(lowerQuery) ||
          student.email.toLowerCase().includes(lowerQuery),
      );
    }

    if (sortKey !== "default") {
      result.sort((a, b) => {
        const valA: string | number =
          sortKey === "name"
            ? a.fullName.toLowerCase()
            : sortKey === "email"
              ? a.email.toLowerCase()
              : new Date(a.createdAt).getTime();
        const valB: string | number =
          sortKey === "name"
            ? b.fullName.toLowerCase()
            : sortKey === "email"
              ? b.email.toLowerCase()
              : new Date(b.createdAt).getTime();

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [studentsQuery.data, searchQuery, sortKey, sortDirection]);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedAndFilteredStudents, currentPage]);

  const handleDeleteStudent = async (studentId: string) => {
    setPendingDeleteId(studentId);
    try {
      await deleteStudentMutation.mutateAsync(studentId);
      toast({
        title: "Xóa học viên thành công",
      });
    } catch (error) {
      toast({
        title: "Không thể xóa học viên",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24] shadow-sm">
        <div className="flex flex-col gap-4 border-b-2 border-[#e5e5e5] pb-6 dark:border-[#2b3940] sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#58cc02]/30 bg-[#e8f5e1] px-3 py-1 text-xs font-extrabold text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]">
              Học viên
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#3c3c3c] dark:text-white sm:text-3xl">
              Quản lý học viên
            </h1>
            <p className="text-xs md:text-sm font-bold text-[#777777] dark:text-slate-400">
              Tạo tài khoản và theo dõi tiến độ của học viên trong hệ thống.
            </p>
          </div>

          <CreateStudentDialog triggerClassName="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-b-4 border-[#46a302] bg-[#58cc02] px-6 text-sm font-extrabold text-white transition-all hover:bg-[#46a302] active:translate-y-0.5 active:border-b-2" />
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
                  placeholder="Tìm theo tên hoặc email..."
                  value={searchQuery}
                />
              </div>
            </div>
            <div className="w-full sm:w-[220px] space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300">
                Sắp xếp
              </label>
              <Select
                onValueChange={(value) => {
                  const [key, direction] = value.split("-");
                  setCurrentPage(1);

                  if (key === "default") {
                    setSortKey("default");
                    setSortDirection("desc");
                    return;
                  }

                  if (
                    (key === "name" || key === "email" || key === "date") &&
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
                  <SelectItem value="default-desc">Mặc định</SelectItem>
                  <SelectItem value="name-asc">Tên (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Tên (Z-A)</SelectItem>
                  <SelectItem value="email-asc">Email (A-Z)</SelectItem>
                  <SelectItem value="date-desc">Mới nhất trước</SelectItem>
                  <SelectItem value="date-asc">Cũ nhất trước</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {studentsQuery.isLoading ? <StudentsTableSkeleton /> : null}

          {studentsQuery.isError ? (
            <p className="rounded-2xl border-2 border-[#ff4b4b]/40 bg-[#ffebee] p-3 text-xs font-extrabold text-[#ff4b4b] dark:bg-[#ff4b4b]/15">
              {getApiErrorMessage(studentsQuery.error)}
            </p>
          ) : null}

          {studentsQuery.data ? (
            <>
              <div className="overflow-hidden rounded-2xl border-2 border-[#e5e5e5] bg-white shadow-sm dark:border-[#2b3940] dark:bg-[#131f24]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-[#e5e5e5] bg-[#f7f7f7] hover:bg-[#f7f7f7] dark:border-[#2b3940] dark:bg-[#111b21] dark:hover:bg-[#111b21]">
                      <TableHead className="w-[72px] px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                        STT
                      </TableHead>
                      <TableHead className="px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                        Email
                      </TableHead>
                      <TableHead className="px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                        Họ tên
                      </TableHead>
                      <TableHead className="px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                        Ngày tạo
                      </TableHead>
                      <TableHead className="px-4 text-right text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndFilteredStudents.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell className="py-12 text-center text-sm font-bold text-[#777777] dark:text-slate-400" colSpan={5}>
                          Chưa có học viên nào.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedStudents.map((student, index) => (
                        <TableRow
                          className="border-b border-[#e5e5e5] transition-colors hover:bg-[#f7f7f7] dark:border-[#2b3940] dark:hover:bg-[#18252d]"
                          key={student.id}
                        >
                          <TableCell className="px-4 py-4 font-bold text-[#777777] dark:text-slate-400">
                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </TableCell>
                          <TableCell className="px-4 py-4 font-extrabold text-[#3c3c3c] dark:text-white">
                            {student.email}
                          </TableCell>
                          <TableCell className="px-4 py-4 font-bold text-[#3c3c3c] dark:text-slate-200">
                            {student.fullName}
                          </TableCell>
                          <TableCell className="px-4 py-4 text-xs font-bold text-[#777777] dark:text-slate-400">
                            {formatCreatedAt(student.createdAt)}
                          </TableCell>
                          <TableCell className="px-4 py-4 text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  className="h-9 rounded-xl border-2 border-[#ff4b4b]/30 border-b-4 border-b-[#e03838] bg-[#ffebee] px-3 text-xs font-extrabold text-[#ff4b4b] hover:bg-[#ffdada] active:translate-y-0.5 active:border-b-2 dark:border-[#ff4b4b]/40 dark:border-b-[#ff4b4b]/80 dark:bg-[#ff4b4b]/20"
                                  disabled={
                                    deleteStudentMutation.isPending && pendingDeleteId === student.id
                                  }
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
                                    Xóa học viên?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-xs font-bold text-[#777777] dark:text-slate-400">
                                    Xóa học viên sẽ xóa tất cả lịch sử làm bài của họ. Bạn có chắc
                                    chắn muốn xóa?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="mt-4 gap-2">
                                  <AlertDialogCancel className="rounded-xl border-2 border-[#e5e5e5] font-extrabold text-[#3c3c3c] dark:border-[#2b3940] dark:text-white">
                                    Hủy
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    className="rounded-xl border-b-4 border-[#e03838] bg-[#ff4b4b] font-extrabold text-white hover:bg-[#e03838]"
                                    onClick={() => {
                                      void handleDeleteStudent(student.id);
                                    }}
                                  >
                                    {pendingDeleteId === student.id ? (
                                      <span className="inline-flex items-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang xóa...
                                      </span>
                                    ) : (
                                      "Xác nhận xóa"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
                  totalItems={sortedAndFilteredStudents.length}
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
