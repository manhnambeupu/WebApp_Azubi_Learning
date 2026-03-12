"use client";

import { History, Loader2 } from "lucide-react";
import { useState } from "react";
import { QuizResult } from "@/components/student/quiz-result";
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
    <section className="space-y-5 rounded-lg border bg-background p-6 shadow-sm">
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
        <div className="flex items-center gap-2 rounded-md border px-4 py-3 text-sm text-muted-foreground">
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
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center">
            <History className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Bạn chưa có lần nộp bài nào cho bài học này.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">Lần nộp</TableHead>
                    <TableHead>Điểm số</TableHead>
                    <TableHead>Số câu đúng</TableHead>
                    <TableHead>Thời gian nộp</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyQuery.data.map((attempt) => (
                    <TableRow
                      className={cn(
                        selectedAttemptId === attempt.id ? "bg-muted/40 hover:bg-muted/40" : "",
                      )}
                      key={attempt.id}
                    >
                      <TableCell>#{attempt.attemptNumber}</TableCell>
                      <TableCell>{formatScore(attempt.score)}/100</TableCell>
                      <TableCell>{formatCorrectCount(attempt.correctCount)}</TableCell>
                      <TableCell>{formatSubmittedAt(attempt.submittedAt)}</TableCell>
                      <TableCell className="text-right">
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
                <div className="flex items-center gap-2 rounded-md border px-4 py-3 text-sm text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
                Chọn một lần nộp để xem kết quả chi tiết.
              </p>
            )}
          </div>
        )
      ) : null}
    </section>
  );
}
