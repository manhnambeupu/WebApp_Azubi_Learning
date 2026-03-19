"use client";

import dynamic from "next/dynamic";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
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
    <div className="overflow-hidden rounded-2xl border border-primary/15 bg-white/85 shadow-glass">
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
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);

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
      <Card className="kokonut-glass-card kokonut-glow-border border-primary/15 bg-white/70 shadow-glass">
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
          {studentsQuery.isLoading ? <StudentsTableSkeleton /> : null}

          {studentsQuery.isError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(studentsQuery.error)}
            </p>
          ) : null}

          {studentsQuery.data ? (
            <div className="overflow-hidden rounded-2xl border border-primary/15 bg-white/85 shadow-glass">
              <Table>
                <TableHeader>
                  <TableRow className="border-primary/15 bg-primary/5 hover:bg-primary/5">
                    <TableHead className="w-[72px] px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90">
                      STT
                    </TableHead>
                    <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90">
                      Email
                    </TableHead>
                    <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90">
                      Họ tên
                    </TableHead>
                    <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90">
                      Ngày tạo
                    </TableHead>
                    <TableHead className="px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-600/90">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow className="border-primary/10 hover:bg-transparent">
                      <TableCell className="py-10 text-center text-muted-foreground" colSpan={5}>
                        Chưa có học viên nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student, index) => (
                      <TableRow
                        className={cn(
                          "group/row border-primary/10 transition-colors duration-300 hover:bg-primary/[0.04]",
                          index % 2 === 0 ? "bg-white/90" : "bg-slate-50/45",
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
                            <AlertDialogContent className="border-primary/15 bg-white/85 shadow-glass backdrop-blur-xl data-[state=open]:animate-slide-up">
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
