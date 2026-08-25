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
import { cn } from "@/lib/utils";

type Props = {
  studentId: string | null;
  onClose: () => void;
};

type ChartPoint = {
  attemptNumber: number;
  [lessonLabel: string]: number;
};

const CHART_COLORS = [
  "#58cc02",
  "#0284c7",
  "#ffc800",
  "#ce82ff",
  "#ff4b4b",
  "#14b8a6",
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
        <Skeleton className="h-6 w-52 rounded-xl" />
        <Skeleton className="h-4 w-72 rounded-xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-[320px] w-full rounded-2xl" />
      <Skeleton className="h-36 w-full rounded-2xl" />
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
      <DialogContent className="left-[50%] top-[50%] z-[100] h-[95vh] w-[95vw] max-w-[920px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[24px] border-2 border-[#e5e5e5] bg-white p-0 shadow-2xl dark:border-[#2b3940] dark:bg-[#131f24] sm:left-auto sm:right-0 sm:top-0 sm:h-screen sm:w-full sm:max-w-[920px] sm:translate-x-0 sm:translate-y-0 sm:rounded-none sm:border-l-2">
        <div className="space-y-4 p-4 sm:space-y-6 sm:p-8">
          <DialogHeader className="space-y-1.5 text-left border-b-2 border-[#e5e5e5] pb-4 dark:border-[#2b3940]">
            <DialogTitle className="text-xl font-extrabold text-[#3c3c3c] dark:text-white">
              Chi tiết phân tích học viên
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-[#777777] dark:text-slate-400">
              Theo dõi hiệu suất theo từng bài học, xu hướng điểm số và các câu hỏi cần cải thiện.
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading ? <DrawerSkeleton /> : null}

          {detailQuery.isError ? (
            <p className="rounded-2xl border-2 border-[#ff4b4b]/40 bg-[#ffebee] p-3 text-xs font-extrabold text-[#ff4b4b] dark:bg-[#ff4b4b]/15">
              {getApiErrorMessage(detailQuery.error)}
            </p>
          ) : null}

          {detailQuery.data ? (
            <>
              {/* Breakdown Table */}
              <section className="rounded-2xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
                <div className="border-b-2 border-[#e5e5e5] px-5 py-4 dark:border-[#2b3940]">
                  <h3 className="font-extrabold text-[#3c3c3c] dark:text-white">Chi tiết từng bài học</h3>
                  <p className="text-xs font-bold text-[#777777] dark:text-slate-400">
                    {detailQuery.data.student.fullName} • {detailQuery.data.student.email}
                  </p>
                </div>
                <div className="hidden md:block overflow-x-auto">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow className="border-b-2 border-[#e5e5e5] bg-[#f7f7f7] hover:bg-[#f7f7f7] dark:border-[#2b3940] dark:bg-[#111b21] dark:hover:bg-[#111b21]">
                        <TableHead className="px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">Bài học</TableHead>
                        <TableHead className="px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">Lần làm</TableHead>
                        <TableHead className="px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">Điểm cao nhất</TableHead>
                        <TableHead className="px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">Tiến bộ</TableHead>
                        <TableHead className="px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">Thời gian</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailQuery.data.lessons.map((lesson) => (
                        <TableRow className="border-b border-[#e5e5e5] dark:border-[#2b3940]" key={lesson.lessonId}>
                          <TableCell className="px-4 py-3 font-extrabold text-[#3c3c3c] dark:text-white">
                            {lesson.lessonTitle}
                          </TableCell>
                          <TableCell className="px-4 py-3 font-bold text-[#3c3c3c] dark:text-slate-300">{lesson.totalAttempts}</TableCell>
                          <TableCell className="px-4 py-3 font-extrabold text-[#3c3c3c] dark:text-white">{lesson.bestScore.toFixed(1)}%</TableCell>
                          <TableCell className="px-4 py-3">
                            <span className="inline-flex items-center gap-1">
                              {lesson.improvementDelta >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-[#46a302]" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-[#ff4b4b]" />
                              )}
                              <span
                                className={
                                  lesson.improvementDelta >= 0
                                    ? "font-extrabold text-[#46a302] dark:text-[#58cc02]"
                                    : "font-extrabold text-[#ff4b4b]"
                                }
                              >
                                {lesson.improvementDelta >= 0 ? "+" : ""}
                                {lesson.improvementDelta.toFixed(1)}%
                              </span>
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 font-bold text-[#777777] dark:text-slate-400">
                            {formatDuration(lesson.totalActiveSeconds)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile View */}
                <div className="block space-y-3 p-4 md:hidden">
                  {detailQuery.data.lessons.map((lesson) => (
                    <div
                      key={lesson.lessonId}
                      className="space-y-2.5 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] p-3.5 dark:border-[#2b3940] dark:bg-[#111b21]"
                    >
                      <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-2 dark:border-[#2b3940]">
                        <h4 className="mr-2 line-clamp-1 flex-1 font-extrabold text-[#3c3c3c] dark:text-white">
                          {lesson.lessonTitle}
                        </h4>
                        <Badge
                          variant="outline"
                          className="rounded-full border-2 border-[#e5e5e5] bg-white text-xs font-bold dark:border-[#2b3940] dark:bg-[#131f24]"
                        >
                          Lần làm: {lesson.totalAttempts}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="font-bold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                            Điểm cao nhất
                          </p>
                          <p className="font-extrabold text-[#3c3c3c] dark:text-white">{lesson.bestScore.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="font-bold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                            Thời gian
                          </p>
                          <p className="font-extrabold text-[#3c3c3c] dark:text-white">
                            {formatDuration(lesson.totalActiveSeconds)}
                          </p>
                        </div>
                        <div className="col-span-2 pt-1">
                          <p className="mb-0.5 font-bold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                            Tiến bộ
                          </p>
                          <div className="flex items-center gap-1.5">
                            {lesson.improvementDelta >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-[#46a302]" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-[#ff4b4b]" />
                            )}
                            <span
                              className={cn(
                                "font-extrabold",
                                lesson.improvementDelta >= 0
                                  ? "text-[#46a302] dark:text-[#58cc02]"
                                  : "text-[#ff4b4b]",
                              )}
                            >
                              {lesson.improvementDelta >= 0 ? "+" : ""}
                              {lesson.improvementDelta.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Score Trend */}
              <section className="rounded-2xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-5 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
                <h3 className="mb-3 font-extrabold text-[#3c3c3c] dark:text-white">Biểu đồ tiến độ điểm số</h3>
                {chartLines.length === 0 || chartData.length === 0 ? (
                  <p className="text-xs font-bold text-[#777777] dark:text-slate-400">
                    Chưa có dữ liệu điểm để hiển thị biểu đồ.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer height="100%" width="100%">
                        <LineChart
                          data={chartData}
                          margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                        >
                          <XAxis
                            dataKey="attemptNumber"
                            tickMargin={10}
                            tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
                            label={{
                              value: "Số lần làm bài",
                              position: "insideBottom",
                              offset: -10,
                              fill: "#64748b",
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }}
                            label={{
                              value: "Điểm số (%)",
                              angle: -90,
                              position: "insideLeft",
                              fill: "#64748b",
                              fontSize: 11,
                              fontWeight: 700,
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
                              strokeWidth={3}
                              type="monotone"
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {chartLines.map((trend, index) => (
                        <Badge
                          className="rounded-full border-2 border-[#e5e5e5] bg-[#f7f7f7] px-2.5 py-1 text-xs font-extrabold text-[#3c3c3c] dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white"
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

              {/* Weak Questions */}
              <section className="rounded-2xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-5 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
                <h3 className="mb-3 font-extrabold text-[#3c3c3c] dark:text-white">Câu hỏi hay sai</h3>
                {detailQuery.data.weakQuestions.length === 0 ? (
                  <p className="text-xs font-bold text-[#46a302] dark:text-[#58cc02]">
                    Không có câu hỏi yếu. Học viên này hoàn thành rất tốt! 🎉
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {detailQuery.data.weakQuestions.map((question) => (
                      <li
                        className="rounded-xl border-2 border-[#ff4b4b]/30 bg-[#ffebee] p-3 dark:border-[#ff4b4b]/40 dark:bg-[#ff4b4b]/15"
                        key={question.questionId}
                      >
                        <p className="whitespace-pre-wrap text-xs font-extrabold text-[#3c3c3c] dark:text-white">
                          <span className="mr-1.5 inline-block rounded-md bg-[#ff4b4b] px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                            Câu {question.orderIndex}
                          </span>
                          {question.questionText}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                          <span className="font-bold text-[#777777] dark:text-slate-400">{question.lessonTitle}</span>
                          <span className="font-extrabold text-[#ff4b4b]">
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
