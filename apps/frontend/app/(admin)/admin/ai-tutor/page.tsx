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
    <section className="space-y-6">
      <div className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
        <div className="flex flex-col gap-2 border-b-2 border-[#e5e5e5] pb-6 dark:border-[#2b3940]">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-[#58cc02]/30 bg-[#e8f5e1] px-3 py-1 text-xs font-extrabold text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]">
            <BotMessageSquare className="h-3.5 w-3.5" />
            AI Tutor
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#3c3c3c] dark:text-white sm:text-3xl">
            Lịch sử AI Chat
          </h1>
          <p className="text-xs md:text-sm font-bold text-[#777777] dark:text-slate-400">
            Theo dõi các cuộc hội thoại giữa học viên và AI Tutor trong hệ thống.
          </p>
        </div>

        <div className="space-y-5 pt-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300">
                Lọc học viên
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777777] dark:text-slate-400" />
                <Input
                  className="h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] pl-10 text-sm font-bold text-[#3c3c3c] placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white"
                  onChange={(event) => setStudentFilter(event.target.value)}
                  placeholder="Nhập tên học viên..."
                  value={studentFilter}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300">
                Lọc bài học
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777777] dark:text-slate-400" />
                <Input
                  className="h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] pl-10 text-sm font-bold text-[#3c3c3c] placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white"
                  onChange={(event) => setLessonFilter(event.target.value)}
                  placeholder="Nhập tên bài học..."
                  value={lessonFilter}
                />
              </div>
            </div>
          </div>

          {historyQuery.isError ? (
            <p className="rounded-2xl border-2 border-[#ff4b4b]/40 bg-[#ffebee] p-3 text-xs font-extrabold text-[#ff4b4b] dark:bg-[#ff4b4b]/15">
              {getApiErrorMessage(historyQuery.error)}
            </p>
          ) : null}

          <div className="overflow-hidden rounded-2xl border-2 border-[#e5e5e5] bg-white shadow-sm dark:border-[#2b3940] dark:bg-[#131f24]">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-[#e5e5e5] bg-[#f7f7f7] hover:bg-[#f7f7f7] dark:border-[#2b3940] dark:bg-[#111b21] dark:hover:bg-[#111b21]">
                  <TableHead className="h-12 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">Thời gian</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">Học viên</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">Bài học</TableHead>
                  <TableHead className="h-12 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">Nội dung</TableHead>
                  <TableHead className="h-12 px-4 text-right text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyQuery.isLoading ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="py-12 text-center text-sm font-bold text-[#777777] dark:text-slate-400" colSpan={5}>
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#58cc02]" />
                        Đang tải lịch sử AI chat...
                      </span>
                    </TableCell>
                  </TableRow>
                ) : historyQuery.data && historyQuery.data.length > 0 ? (
                  historyQuery.data.map((history) => (
                    <TableRow
                      className="border-b border-[#e5e5e5] transition-colors hover:bg-[#f7f7f7] dark:border-[#2b3940] dark:hover:bg-[#18252d]"
                      key={history.id}
                    >
                      <TableCell className="px-4 py-4 text-xs font-bold text-[#777777] dark:text-slate-400">{formatDate(history.createdAt)}</TableCell>
                      <TableCell className="px-4 py-4">
                        <p className="font-extrabold text-[#3c3c3c] dark:text-white">{history.student.fullName}</p>
                        <p className="text-xs font-bold text-[#777777] dark:text-slate-400">{history.student.email}</p>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-xs font-extrabold text-[#3c3c3c] dark:text-slate-200">{history.lesson.title}</TableCell>
                      <TableCell className="max-w-[420px] px-4 py-4">
                        <div className="space-y-1.5">
                          <Badge
                            className={
                              history.role === "AI"
                                ? "rounded-full border-2 border-[#58cc02]/30 bg-[#e8f5e1] px-2 py-0.5 text-[11px] font-extrabold text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]"
                                : "rounded-full border-2 border-[#e5e5e5] bg-[#f7f7f7] px-2 py-0.5 text-[11px] font-extrabold text-[#777777] dark:border-[#2b3940] dark:bg-[#111b21] dark:text-slate-400"
                            }
                          >
                            {history.role === "AI" ? "AI Tutor" : "Student"}
                          </Badge>
                          <p className="line-clamp-2 text-xs font-bold text-[#777777] dark:text-slate-300">
                            {history.content}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              className="h-9 rounded-xl border-2 border-[#ff4b4b]/30 border-b-4 border-b-[#e03838] bg-[#ffebee] px-3 text-xs font-extrabold text-[#ff4b4b] hover:bg-[#ffdada] active:translate-y-0.5 active:border-b-2 dark:border-[#ff4b4b]/40 dark:border-b-[#ff4b4b]/80 dark:bg-[#ff4b4b]/20"
                              disabled={
                                deleteMutation.isPending && pendingDeleteId === history.id
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
                                Xóa bản ghi chat AI?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-xs font-bold text-[#777777] dark:text-slate-400">
                                Hành động này sẽ xóa vĩnh viễn tin nhắn hội thoại này khỏi hệ thống.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-4 gap-2">
                              <AlertDialogCancel className="rounded-xl border-2 border-[#e5e5e5] font-extrabold text-[#3c3c3c] dark:border-[#2b3940] dark:text-white">
                                Hủy
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className="rounded-xl border-b-4 border-[#e03838] bg-[#ff4b4b] font-extrabold text-white hover:bg-[#e03838]"
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
                    <TableCell className="py-12 text-center text-sm font-bold text-[#777777] dark:text-slate-400" colSpan={5}>
                      Chưa có lịch sử chat AI phù hợp bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </section>
  );
}
