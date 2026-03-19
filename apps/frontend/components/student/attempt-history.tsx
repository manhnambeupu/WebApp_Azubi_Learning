"use client";

import dynamic from "next/dynamic";
import { History, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
      <p className="text-sm text-muted-foreground">Đang tải chi tiết kết quả...</p>
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
    <section className="space-y-5 rounded-2xl border border-border/70 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Lịch sử nộp bài</h2>
        <p className="text-sm text-muted-foreground">
          Xem lại tất cả lần nộp và mở chi tiết từng kết quả.
        </p>
        {latestAttemptQuery.data ? (
          <p className="text-xs text-muted-foreground">
            Lần gần nhất: #{latestAttemptQuery.data.attemptNumber} —{" "}
            {formatScore(latestAttemptQuery.data.score)}/100
          </p>
        ) : null}
      </div>

      <Separator />

      {historyQuery.isLoading ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải lịch sử nộp bài...
        </div>
      ) : null}

      {historyQuery.isError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(historyQuery.error)}
        </p>
      ) : null}

      {historyQuery.data ? (
        historyQuery.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center">
            <History className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Bạn chưa có lần nộp bài nào cho bài học này.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-slate-200/80">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/80 bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="w-[90px] px-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Lần nộp
                    </TableHead>
                    <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Điểm số
                    </TableHead>
                    <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Số câu đúng
                    </TableHead>
                    <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Thời gian nộp
                    </TableHead>
                    <TableHead className="px-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Thao tác
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyQuery.data.map((attempt) => (
                    <TableRow
                      className={cn(
                        "border-slate-200/70 hover:bg-slate-50/90",
                        selectedAttemptId === attempt.id ? "bg-primary/5 hover:bg-primary/10" : "",
                      )}
                      key={attempt.id}
                    >
                      <TableCell className="px-4 py-4">#{attempt.attemptNumber}</TableCell>
                      <TableCell className="px-4 py-4">{formatScore(attempt.score)}/100</TableCell>
                      <TableCell className="px-4 py-4">
                        {formatCorrectCount(attempt.correctCount)}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        {formatSubmittedAt(attempt.submittedAt)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <Button
                          onClick={() => setSelectedAttemptId(attempt.id)}
                          size="sm"
                          type="button"
                          variant="outline"
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
                <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải chi tiết lần nộp...
                </div>
              ) : attemptDetailQuery.isError ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {getApiErrorMessage(attemptDetailQuery.error)}
                </p>
              ) : attemptDetailQuery.data ? (
                <QuizResult result={attemptDetailQuery.data} showActions={false} />
              ) : null
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3 text-sm text-muted-foreground">
                Chọn một lần nộp để xem kết quả chi tiết.
              </p>
            )}
          </div>
        )
      ) : null}
    </section>
  );
}
