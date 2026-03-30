"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchStudentsSummary } from "@/lib/analytics-api";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

type Props = {
  onSelectStudent: (studentId: string) => void;
};

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

function formatRelativeTime(value: string | null): string {
  if (!value) {
    return "Chưa hoạt động";
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "Không xác định";
  }

  const diffMs = Date.now() - timestamp;
  if (diffMs < 60_000) {
    return "vừa xong";
  }

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} ngày trước`;
  }

  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function scoreColorClass(score: number): string {
  if (score < 50) {
    return "text-rose-600 dark:text-rose-300";
  }
  if (score < 80) {
    return "text-amber-600 dark:text-amber-300";
  }
  return "text-emerald-600 dark:text-emerald-300";
}

function StudentsTableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow className="border-primary/10" key={index}>
          <TableCell className="px-4 py-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-4 w-52" />
          </TableCell>
          <TableCell className="px-4 py-4">
            <Skeleton className="h-5 w-12" />
          </TableCell>
          <TableCell className="px-4 py-4">
            <Skeleton className="h-5 w-20" />
          </TableCell>
          <TableCell className="px-4 py-4">
            <Skeleton className="h-5 w-16" />
          </TableCell>
          <TableCell className="px-4 py-4">
            <Skeleton className="h-5 w-24" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function StudentsAnalyticsTable({ onSelectStudent }: Props) {
  const studentsQuery = useQuery({
    queryKey: ["analytics", "students"],
    queryFn: fetchStudentsSummary,
    staleTime: 2 * 60 * 1000,
  });

  return (
    <Card className="kokonut-glass-card kokonut-glow-border border-primary/15 bg-white/70 shadow-glass dark:bg-slate-900/70">
      <CardHeader className="border-b border-primary/15 bg-gradient-to-r from-primary/5 via-background to-accent/10">
        <CardTitle className="text-xl">Hiệu suất học viên</CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {studentsQuery.isError ? (
          <div className="px-6 py-4">
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getApiErrorMessage(studentsQuery.error)}
            </p>
          </div>
        ) : null}

        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="border-primary/15 bg-primary/5 hover:bg-primary/5">
              <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90 dark:text-slate-400">
                Học viên
              </TableHead>
              <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90 dark:text-slate-400">
                Bài học
              </TableHead>
              <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90 dark:text-slate-400">
                Thời gian TB
              </TableHead>
              <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90 dark:text-slate-400">
                Điểm TB
              </TableHead>
              <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-slate-600/90 dark:text-slate-400">
                Hoạt động cuối
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {studentsQuery.isLoading ? <StudentsTableSkeletonRows /> : null}

            {!studentsQuery.isLoading && studentsQuery.data?.length === 0 ? (
              <TableRow className="border-primary/10 hover:bg-transparent">
                <TableCell className="py-10 text-center text-muted-foreground" colSpan={5}>
                  Chưa có dữ liệu phân tích.
                </TableCell>
              </TableRow>
            ) : null}

            {!studentsQuery.isLoading
              ? studentsQuery.data?.map((student, index) => (
                  <TableRow
                    className={cn(
                      "group/row cursor-pointer border-primary/10 transition-colors duration-200 hover:bg-primary/[0.05]",
                      index % 2 === 0
                        ? "bg-white/90 dark:bg-slate-900/90"
                        : "bg-slate-50/45 dark:bg-slate-800/45",
                    )}
                    key={student.id}
                    onClick={() => onSelectStudent(student.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectStudent(student.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <TableCell className="px-4 py-4">
                      <p className="font-medium">{student.fullName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{student.email}</p>
                    </TableCell>
                    <TableCell className="px-4 py-4">{student.lessonsCompleted}</TableCell>
                    <TableCell className="px-4 py-4">
                      {formatDuration(Math.round(student.avgActiveTimeSeconds))}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <span className={cn("font-semibold", scoreColorClass(student.avgScore))}>
                        {student.avgScore.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-muted-foreground">
                      {formatRelativeTime(student.lastActiveAt)}
                    </TableCell>
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
