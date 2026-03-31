"use client";

import dynamic from "next/dynamic";
import { Loader2, Search, Sparkles, Trash2 } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

const CreateStudentDialog = dynamic(
  () =>
    import("@/components/admin/create-student-dialog").then(
      (mod) => mod.CreateStudentDialog,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-xs text-muted-foreground">Đang tải hộp thoại học viên...</p>
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
    <div className="overflow-hidden rounded-2xl border border-primary/15 bg-white/85 shadow-glass dark:bg-slate-900/85">
      <div className="h-11 border-b border-primary/15 bg-primary/5" />
      <div className="space-y-2 p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="grid grid-cols-5 gap-4" key={index}>
            <div className="h-6 animate-pulse rounded bg-muted/50" />
            <div className="h-6 animate-pulse rounded bg-muted/50" />
            <div className="h-6 animate-pulse rounded bg-muted/50" />
            <div className="h-6 animate-pulse rounded bg-muted/50" />
            <div className="h-6 animate-pulse rounded bg-muted/50" />
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
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

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
    <section className="space-y-6 kokonut-fade">
      <Card className="kokonut-glass-card kokonut-glow-border border-primary/15 bg-white/70 shadow-glass dark:bg-slate-900/70">
        <CardHeader className="flex flex-col gap-4 border-b border-primary/15 bg-gradient-to-r from-primary/5 via-background to-accent/10 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/15 px-3 py-1 text-xs font-medium shadow-[0_8px_20px_-16px_hsl(var(--accent)/0.9)]">
              <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
              Students
            </div>
            <CardTitle className="text-2xl">Quản lý học viên</CardTitle>
            <CardDescription>
              Tạo tài khoản học viên và quản lý danh sách người học trong hệ thống.
            </CardDescription>
          </div>

          <CreateStudentDialog triggerClassName="h-11 rounded-xl border border-white/25 bg-gradient-to-r from-primary to-amber-600 px-5 text-slate-950 shadow-glow-soft transition-all duration-300 hover:brightness-110" />
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="bg-white/50 pl-9 dark:bg-slate-900/50"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên hoặc email..."
                  value={searchQuery}
                />
              </div>
            </div>
            <div className="w-full sm:w-[220px]">
              <Select
                onValueChange={(value) => {
                  const [key, direction] = value.split("-");

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
                <SelectTrigger className="bg-white/50 dark:bg-slate-900/50">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
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
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(studentsQuery.error)}
            </p>
          ) : null}

          {studentsQuery.data ? (
            <div className="overflow-hidden rounded-2xl border border-primary/15 bg-white/85 shadow-glass dark:bg-slate-900/85">
              <Table>
                <TableHeader>
                  <TableRow className="border-primary/15 bg-primary/5 hover:bg-primary/5">
                    <TableHead className="w-[72px] px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90 dark:text-slate-400">
                      STT
                    </TableHead>
                    <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90 dark:text-slate-400">
                      Email
                    </TableHead>
                    <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90 dark:text-slate-400">
                      Họ tên
                    </TableHead>
                    <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90 dark:text-slate-400">
                      Ngày tạo
                    </TableHead>
                    <TableHead className="px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-600/90 dark:text-slate-400">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndFilteredStudents.length === 0 ? (
                    <TableRow className="border-primary/10 hover:bg-transparent">
                      <TableCell className="py-10 text-center text-muted-foreground" colSpan={5}>
                        Chưa có học viên nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedAndFilteredStudents.map((student, index) => (
                      <TableRow
                        className={cn(
                          "group/row border-primary/10 transition-colors duration-300 hover:bg-primary/[0.04]",
                          index % 2 === 0 ? "bg-white/90 dark:bg-slate-900/90" : "bg-slate-50/45 dark:bg-slate-800/45",
                        )}
                        key={student.id}
                      >
                        <TableCell className="px-4 py-4">{index + 1}</TableCell>
                        <TableCell className="px-4 py-4 font-medium">{student.email}</TableCell>
                        <TableCell className="px-4 py-4">{student.fullName}</TableCell>
                        <TableCell className="px-4 py-4">
                          {formatCreatedAt(student.createdAt)}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                className="h-8 rounded-full opacity-100 transition-opacity duration-300 md:pointer-events-none md:opacity-0 md:group-hover/row:pointer-events-auto md:group-hover/row:opacity-100"
                                disabled={
                                  deleteStudentMutation.isPending && pendingDeleteId === student.id
                                }
                                size="sm"
                                variant="destructive"
                              >
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                Xóa
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border-primary/15 bg-white/85 shadow-glass backdrop-blur-xl data-[state=open]:animate-slide-up dark:bg-slate-950/85">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa học viên?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Xóa học viên sẽ xóa tất cả lịch sử làm bài của họ. Bạn có chắc
                                  chắn?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
