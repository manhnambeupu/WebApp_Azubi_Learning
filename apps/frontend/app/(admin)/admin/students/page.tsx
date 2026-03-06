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
    <div className="rounded-md border">
      <div className="h-11 border-b bg-muted/30" />
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
    <section className="space-y-6 rounded-lg border bg-background p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quản lý học viên</h1>
          <p className="text-sm text-muted-foreground">
            Tạo tài khoản học viên và quản lý danh sách người học trong hệ thống.
          </p>
        </div>

        <CreateStudentDialog />
      </div>

      {studentsQuery.isLoading ? <StudentsTableSkeleton /> : null}

      {studentsQuery.isError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(studentsQuery.error)}
        </p>
      ) : null}

      {studentsQuery.data ? (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px]">STT</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell className="py-8 text-center text-muted-foreground" colSpan={5}>
                    Chưa có học viên nào.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{student.email}</TableCell>
                    <TableCell>{student.fullName}</TableCell>
                    <TableCell>{formatCreatedAt(student.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            disabled={
                              deleteStudentMutation.isPending &&
                              pendingDeleteId === student.id
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
    </section>
  );
}
