"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CreateStudentDialog } from "@/components/admin/create-student-dialog";
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
    <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-card shadow-sm">
      <div className="h-11 border-b border-slate-200/80 bg-slate-100/70" />
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
    <section className="space-y-6">
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-border/70 bg-slate-50/70 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-2xl">Quản lý học viên</CardTitle>
            <CardDescription>
              Tạo tài khoản học viên và quản lý danh sách người học trong hệ thống.
            </CardDescription>
          </div>

          <CreateStudentDialog />
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {studentsQuery.isLoading ? <StudentsTableSkeleton /> : null}

          {studentsQuery.isError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(studentsQuery.error)}
            </p>
          ) : null}

          {studentsQuery.data ? (
            <div className="overflow-hidden rounded-lg border border-slate-200/80">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/80 bg-slate-100/70 hover:bg-slate-100/70">
                    <TableHead className="w-[72px] px-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      STT
                    </TableHead>
                    <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Email
                    </TableHead>
                    <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Họ tên
                    </TableHead>
                    <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Ngày tạo
                    </TableHead>
                    <TableHead className="px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow className="border-slate-200/70 hover:bg-transparent">
                      <TableCell className="py-10 text-center text-muted-foreground" colSpan={5}>
                        Chưa có học viên nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student, index) => (
                      <TableRow
                        className="border-slate-200/70 hover:bg-slate-50/90"
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
                                disabled={
                                  deleteStudentMutation.isPending && pendingDeleteId === student.id
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
