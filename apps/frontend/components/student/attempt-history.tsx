"use client";

import dynamic from "next/dynamic";
import { History, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetAttemptDetail,
  useGetAttemptHistory,
  useGetLatestAttempt,
} from "@/hooks/use-submissions";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

const QuizResult = dynamic(
  () => import("@/components/student/quiz-result").then((mod) => mod.QuizResult),
  {
    ssr: false,
    loading: () => (
      <p className="text-xs font-bold text-[#777777] dark:text-slate-400">Đang tải chi tiết kết quả...</p>
    ),
  },
);

type AttemptHistoryProps = {
  lessonId: string;
};

const formatSubmittedAt = (value: string): string =>
  new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatScore = (score: number): string =>
  Number.isInteger(score) ? `${score}` : score.toFixed(2);

const formatCorrectCount = (correctCount: number): string =>
  Number.isInteger(correctCount) ? `${correctCount}` : correctCount.toFixed(2);

export function AttemptHistory({ lessonId }: AttemptHistoryProps) {
  const historyQuery = useGetAttemptHistory(lessonId);
  const latestAttemptQuery = useGetLatestAttempt(lessonId);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | undefined>(undefined);

  const attemptDetailQuery = useGetAttemptDetail(lessonId, selectedAttemptId);

  return (
    <section className="space-y-5 rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24] sm:p-8">
      <div className="space-y-1 border-b-2 border-[#e5e5e5] pb-4 dark:border-[#2b3940]">
        <h2 className="text-xl font-extrabold text-[#3c3c3c] dark:text-white">Lịch sử nộp bài</h2>
        <p className="text-xs md:text-sm font-bold text-[#777777] dark:text-slate-400">
          Xem lại tất cả lần nộp và mở chi tiết từng kết quả.
        </p>
        {latestAttemptQuery.data ? (
          <p className="text-xs font-extrabold text-[#46a302] dark:text-[#58cc02]">
            Lần gần nhất: #{latestAttemptQuery.data.attemptNumber} —{" "}
            {formatScore(latestAttemptQuery.data.score)}/100
          </p>
        ) : null}
      </div>

      {historyQuery.isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl border-2 border-[#58cc02]/30 bg-[#e8f5e1] p-4 text-xs font-extrabold text-[#46a302]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải lịch sử nộp bài...
        </div>
      ) : null}

      {historyQuery.isError ? (
        <p className="rounded-2xl border-2 border-[#ff4b4b]/40 bg-[#ffebee] p-3 text-xs font-extrabold text-[#ff4b4b] dark:bg-[#ff4b4b]/15">
          {getApiErrorMessage(historyQuery.error)}
        </p>
      ) : null}

      {historyQuery.data ? (
        historyQuery.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e5e5e5] bg-[#f7f7f7] px-6 py-12 text-center dark:border-[#2b3940] dark:bg-[#111b21]">
            <History className="h-8 w-8 text-[#777777] dark:text-slate-400" />
            <p className="mt-3 text-xs font-bold text-[#777777] dark:text-slate-400">
              Bạn chưa có lần nộp bài nào cho bài học này.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border-2 border-[#e5e5e5] bg-white shadow-sm dark:border-[#2b3940] dark:bg-[#131f24]">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-[#e5e5e5] bg-[#f7f7f7] hover:bg-[#f7f7f7] dark:border-[#2b3940] dark:bg-[#111b21] dark:hover:bg-[#111b21]">
                    <TableHead className="w-[90px] px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                      Lần nộp
                    </TableHead>
                    <TableHead className="px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                      Điểm số
                    </TableHead>
                    <TableHead className="px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                      Số câu đúng
                    </TableHead>
                    <TableHead className="px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                      Thời gian nộp
                    </TableHead>
                    <TableHead className="px-4 text-right text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyQuery.data.map((attempt) => (
                    <TableRow
                      className={cn(
                        "border-b border-[#e5e5e5] transition-colors hover:bg-[#f7f7f7] dark:border-[#2b3940] dark:hover:bg-[#18252d]",
                        selectedAttemptId === attempt.id ? "bg-[#e8f5e1]/40 font-bold dark:bg-[#58cc02]/10" : "",
                      )}
                      key={attempt.id}
                    >
                      <TableCell className="px-4 py-4 font-extrabold text-[#3c3c3c] dark:text-white">#{attempt.attemptNumber}</TableCell>
                      <TableCell className="px-4 py-4 font-bold text-[#46a302] dark:text-[#58cc02]">{formatScore(attempt.score)}/100</TableCell>
                      <TableCell className="px-4 py-4 font-bold text-[#777777] dark:text-slate-300">
                        {formatCorrectCount(attempt.correctCount)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-xs font-bold text-[#777777] dark:text-slate-400">
                        {formatSubmittedAt(attempt.submittedAt)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <Button
                          className="h-8 rounded-xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white px-3 text-xs font-extrabold text-[#3c3c3c] hover:border-[#58cc02] hover:text-[#46a302] active:translate-y-0.5 active:border-b-2 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#18252d] dark:text-white"
                          onClick={() => setSelectedAttemptId(attempt.id)}
                          size="sm"
                          type="button"
                          variant="ghost"
                        >
                          Xem chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {selectedAttemptId ? (
              attemptDetailQuery.isLoading ? (
                <div className="flex items-center gap-2 rounded-2xl border-2 border-[#58cc02]/30 bg-[#e8f5e1] p-4 text-xs font-extrabold text-[#46a302]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải chi tiết lần nộp...
                </div>
              ) : attemptDetailQuery.isError ? (
                <p className="rounded-2xl border-2 border-[#ff4b4b]/40 bg-[#ffebee] p-3 text-xs font-extrabold text-[#ff4b4b] dark:bg-[#ff4b4b]/15">
                  {getApiErrorMessage(attemptDetailQuery.error)}
                </p>
              ) : attemptDetailQuery.data ? (
                <QuizResult result={attemptDetailQuery.data} showActions={false} />
              ) : null
            ) : (
              <p className="rounded-2xl border-2 border-dashed border-[#e5e5e5] bg-[#f7f7f7] px-4 py-3 text-center text-xs font-bold text-[#777777] dark:border-[#2b3940] dark:bg-[#111b21] dark:text-slate-400">
                Chọn một lần nộp ở bảng trên để xem lại chi tiết bài làm.
              </p>
            )}
          </div>
        )
      ) : null}
    </section>
  );
}
