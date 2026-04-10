"use client";

import { BotMessageSquare, Loader2, Search, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteAiHistory, useGetAiHistories } from "@/hooks/use-ai-tutor";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AdminAiTutorPage() {
  const { toast } = useToast();
  const [studentFilter, setStudentFilter] = useState("");
  const [lessonFilter, setLessonFilter] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const deleteMutation = useDeleteAiHistory();

  const filters = useMemo(
    () => ({
      studentName: studentFilter,
      lessonTitle: lessonFilter,
      limit: 200,
    }),
    [lessonFilter, studentFilter],
  );

  const historyQuery = useGetAiHistories(filters);

  const handleDelete = async (historyId: string) => {
    setPendingDeleteId(historyId);
    try {
      await deleteMutation.mutateAsync(historyId);
      toast({
        title: "Đã xóa lịch sử chat",
      });
    } catch (error) {
      toast({
        title: "Không thể xóa lịch sử chat",
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
        <CardHeader className="space-y-2 border-b border-primary/15 bg-gradient-to-r from-primary/5 via-background to-accent/10">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium">
            <BotMessageSquare className="h-3.5 w-3.5 text-primary" />
            AI Tutor
          </div>
          <CardTitle className="text-2xl">Lịch sử AI Chat</CardTitle>
          <CardDescription>
            Theo dõi hội thoại AI Tutor và quản trị dữ liệu chat của học viên.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="bg-white/60 pl-9 dark:bg-slate-900/60"
                onChange={(event) => setStudentFilter(event.target.value)}
                placeholder="Lọc theo học viên..."
                value={studentFilter}
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="bg-white/60 pl-9 dark:bg-slate-900/60"
                onChange={(event) => setLessonFilter(event.target.value)}
                placeholder="Lọc theo bài học..."
                value={lessonFilter}
              />
            </div>
          </div>

          {historyQuery.isError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(historyQuery.error)}
            </p>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-primary/15 bg-white/85 shadow-glass dark:bg-slate-900/85">
            <Table>
              <TableHeader>
                <TableRow className="border-primary/15 bg-primary/5 hover:bg-primary/5">
                  <TableHead className="px-4 text-xs uppercase tracking-wide">Thời gian</TableHead>
                  <TableHead className="px-4 text-xs uppercase tracking-wide">Học viên</TableHead>
                  <TableHead className="px-4 text-xs uppercase tracking-wide">Bài học</TableHead>
                  <TableHead className="px-4 text-xs uppercase tracking-wide">Nội dung</TableHead>
                  <TableHead className="px-4 text-right text-xs uppercase tracking-wide">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyQuery.isLoading ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="py-10 text-center text-muted-foreground" colSpan={5}>
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải lịch sử AI chat...
                      </span>
                    </TableCell>
                  </TableRow>
                ) : historyQuery.data && historyQuery.data.length > 0 ? (
                  historyQuery.data.map((history, index) => (
                    <TableRow
                      className={cn(
                        "border-primary/10 hover:bg-primary/[0.04]",
                        index % 2 === 0
                          ? "bg-white/90 dark:bg-slate-900/90"
                          : "bg-slate-50/45 dark:bg-slate-800/45",
                      )}
                      key={history.id}
                    >
                      <TableCell className="px-4 py-4 text-sm">{formatDate(history.createdAt)}</TableCell>
                      <TableCell className="px-4 py-4">
                        <p className="font-medium">{history.student.fullName}</p>
                        <p className="text-xs text-muted-foreground">{history.student.email}</p>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm">{history.lesson.title}</TableCell>
                      <TableCell className="max-w-[420px] px-4 py-4">
                        <div className="space-y-1">
                          <Badge variant={history.role === "AI" ? "secondary" : "outline"}>
                            {history.role === "AI" ? "AI Tutor" : "Student"}
                          </Badge>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {history.content}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              className="h-8 rounded-full"
                              disabled={
                                deleteMutation.isPending && pendingDeleteId === history.id
                              }
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                              Xóa
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-primary/15 bg-white/90 shadow-glass dark:bg-slate-950/90">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa bản ghi chat AI?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Hành động này sẽ xóa vĩnh viễn bản ghi hội thoại đã chọn.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => {
                                  void handleDelete(history.id);
                                }}
                              >
                                {pendingDeleteId === history.id ? (
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
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="py-10 text-center text-muted-foreground" colSpan={5}>
                      Chưa có lịch sử chat AI phù hợp bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
