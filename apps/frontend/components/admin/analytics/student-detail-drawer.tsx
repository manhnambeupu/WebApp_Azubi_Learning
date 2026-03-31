"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp } from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchStudentDetail } from "@/lib/analytics-api";
import { getApiErrorMessage } from "@/lib/api-error";

type Props = {
  studentId: string | null;
  onClose: () => void;
};

type ChartPoint = {
  attemptNumber: number;
  [lessonLabel: string]: number;
};

const CHART_COLORS = [
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const mins = Math.floor(seconds / 60);
  if (mins < 60) {
    return `${mins} phút`;
  }

  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

function DrawerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-[320px] w-full rounded-xl" />
      <Skeleton className="h-36 w-full rounded-xl" />
    </div>
  );
}

export function StudentDetailDrawer({ studentId, onClose }: Props) {
  const detailQuery = useQuery({
    queryKey: ["analytics", "student", studentId],
    queryFn: () => fetchStudentDetail(studentId as string),
    enabled: studentId !== null,
    staleTime: 2 * 60 * 1000,
  });

  const chartData = useMemo<ChartPoint[]>(() => {
    if (!detailQuery.data) {
      return [];
    }

    const pointByAttempt = new Map<number, ChartPoint>();
    for (const trend of detailQuery.data.scoreTrend) {
      const lessonLabel = trend.lessonTitle;
      for (const attempt of trend.attempts) {
        const current = pointByAttempt.get(attempt.attemptNumber) ?? {
          attemptNumber: attempt.attemptNumber,
        };
        current[lessonLabel] = attempt.score;
        pointByAttempt.set(attempt.attemptNumber, current);
      }
    }

    return Array.from(pointByAttempt.values()).sort(
      (left, right) => left.attemptNumber - right.attemptNumber,
    );
  }, [detailQuery.data]);

  const chartLines = useMemo(() => detailQuery.data?.scoreTrend ?? [], [detailQuery.data]);

  return (
    <Dialog onOpenChange={(open) => (!open ? onClose() : undefined)} open={studentId !== null}>
      <DialogContent className="left-auto right-0 top-0 h-screen w-full max-w-[920px] translate-x-0 translate-y-0 overflow-y-auto rounded-none border-l border-primary/15 p-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-[920px]">
        <div className="space-y-6 p-6 sm:p-8">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle>Chi tiết phân tích học viên</DialogTitle>
            <DialogDescription>
              Theo dõi hiệu suất theo từng bài học, xu hướng điểm và các câu hỏi cần cải thiện.
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading ? <DrawerSkeleton /> : null}

          {detailQuery.isError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(detailQuery.error)}
            </p>
          ) : null}

          {detailQuery.data ? (
            <>
              <section className="rounded-2xl border border-primary/15 bg-white/70 shadow-glass dark:bg-slate-900/70">
                <div className="border-b border-primary/15 px-5 py-4">
                  <h3 className="font-semibold">Per-lesson breakdown</h3>
                  <p className="text-sm text-muted-foreground">
                    {detailQuery.data.student.fullName} - {detailQuery.data.student.email}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow className="border-primary/15 bg-primary/5 hover:bg-primary/5">
                        <TableHead className="px-4">Bài học</TableHead>
                        <TableHead className="px-4">Lần làm</TableHead>
                        <TableHead className="px-4">Điểm cao nhất</TableHead>
                        <TableHead className="px-4">Tiến bộ</TableHead>
                        <TableHead className="px-4">Thời gian</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailQuery.data.lessons.map((lesson) => (
                        <TableRow className="border-primary/10" key={lesson.lessonId}>
                          <TableCell className="px-4 py-3 font-medium">
                            {lesson.lessonTitle}
                          </TableCell>
                          <TableCell className="px-4 py-3">{lesson.totalAttempts}</TableCell>
                          <TableCell className="px-4 py-3">{lesson.bestScore.toFixed(1)}%</TableCell>
                          <TableCell className="px-4 py-3">
                            <span className="inline-flex items-center gap-1">
                              {lesson.improvementDelta >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-rose-500" />
                              )}
                              <span
                                className={
                                  lesson.improvementDelta >= 0
                                    ? "text-emerald-600 dark:text-emerald-300"
                                    : "text-rose-600 dark:text-rose-300"
                                }
                              >
                                {lesson.improvementDelta >= 0 ? "+" : ""}
                                {lesson.improvementDelta.toFixed(1)}
                              </span>
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {formatDuration(lesson.totalActiveSeconds)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section className="rounded-2xl border border-primary/15 bg-white/70 p-5 shadow-glass dark:bg-slate-900/70">
                <h3 className="mb-3 font-semibold">Score trend</h3>
                {chartLines.length === 0 || chartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có dữ liệu điểm để hiển thị biểu đồ.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer height="100%" width="100%">
                        <LineChart
                          data={chartData}
                          margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                        >
                          <XAxis
                            dataKey="attemptNumber"
                            tickMargin={10}
                            tick={{ fill: "#64748b", fontSize: 13 }}
                            label={{
                              value: "Số lần làm bài",
                              position: "insideBottom",
                              offset: -10,
                              fill: "#64748b",
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fill: "#64748b", fontSize: 13 }}
                            label={{
                              value: "Điểm số (%)",
                              angle: -90,
                              position: "insideLeft",
                              fill: "#64748b",
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                          />
                          <Tooltip
                            formatter={(value, name) => [
                              `${Number(value ?? 0).toFixed(1)}%`,
                              String(name),
                            ]}
                            labelFormatter={(label) => `Lần làm #${String(label)}`}
                          />
                          {chartLines.map((trend, index) => (
                            <Line
                              dataKey={trend.lessonTitle}
                              key={trend.lessonId}
                              name={trend.lessonTitle}
                              stroke={CHART_COLORS[index % CHART_COLORS.length]}
                              strokeWidth={2}
                              type="monotone"
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {chartLines.map((trend, index) => (
                        <Badge
                          className="rounded-full border border-primary/20 bg-white/80 text-foreground dark:bg-slate-900/80"
                          key={trend.lessonId}
                          variant="secondary"
                        >
                          <span
                            className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          />
                          {trend.lessonTitle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-primary/15 bg-white/70 p-5 shadow-glass dark:bg-slate-900/70">
                <h3 className="mb-3 font-semibold">Weak questions</h3>
                {detailQuery.data.weakQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Khong co cau hoi yeu. Hoc vien nay lam tot! 🎉
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {detailQuery.data.weakQuestions.map((question) => (
                      <li
                        className="rounded-xl border border-rose-200/40 bg-rose-50/35 px-4 py-3 dark:border-rose-900/40 dark:bg-rose-950/20"
                        key={question.questionId}
                      >
                        <p className="whitespace-pre-wrap font-medium leading-normal">
                          <span className="mr-1.5 font-semibold text-rose-600 dark:text-rose-400">
                            [Câu số {question.orderIndex + 1}]
                          </span>
                          {question.questionText}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                          <span className="text-muted-foreground">{question.lessonTitle}</span>
                          <span className="font-semibold text-rose-600 dark:text-rose-300">
                            {question.incorrectRate.toFixed(0)}% sai
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
