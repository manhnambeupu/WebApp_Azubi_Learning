"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Clock, TrendingUp, Users } from "lucide-react";
import { StudentDetailDrawer } from "@/components/admin/analytics/student-detail-drawer";
import { StudentsAnalyticsTable } from "@/components/admin/analytics/students-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAnalyticsOverview } from "@/lib/analytics-api";

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

function OverviewCardSkeleton() {
  return (
    <Card className="kokonut-glass-card kokonut-glow-border border-primary/15 bg-white/70 shadow-glass dark:bg-slate-900/70">
      <CardHeader className="space-y-3 pb-3">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-2/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-1/3" />
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const { data: overview, isLoading } = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: fetchAnalyticsOverview,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="space-y-6 kokonut-fade">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <OverviewCardSkeleton />
            <OverviewCardSkeleton />
            <OverviewCardSkeleton />
            <OverviewCardSkeleton />
          </>
        ) : (
          <>
            <Card className="kokonut-glass-card kokonut-glow-border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 via-white/70 to-emerald-100/55 shadow-glass dark:border-emerald-700/45 dark:from-emerald-950/35 dark:via-slate-900/70 dark:to-emerald-900/25">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Học viên hoạt động
                </CardTitle>
                <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight">
                  {overview?.activeStudentsThisWeek ?? 0}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">trong 7 ngày qua</p>
              </CardContent>
            </Card>

            <Card className="kokonut-glass-card kokonut-glow-border border-sky-200/60 bg-gradient-to-br from-sky-50/80 via-white/70 to-blue-100/55 shadow-glass dark:border-sky-700/45 dark:from-sky-950/35 dark:via-slate-900/70 dark:to-blue-900/25">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Thời gian trung bình
                </CardTitle>
                <Clock className="h-4 w-4 text-sky-600 dark:text-sky-300" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight">
                  {formatDuration(Math.round(overview?.avgActiveTimeSeconds ?? 0))}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">mỗi bài học</p>
              </CardContent>
            </Card>

            <Card className="kokonut-glass-card kokonut-glow-border border-violet-200/60 bg-gradient-to-br from-violet-50/80 via-white/70 to-purple-100/55 shadow-glass dark:border-violet-700/45 dark:from-violet-950/35 dark:via-slate-900/70 dark:to-purple-900/25">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Điểm trung bình
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-300" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight">
                  {(overview?.avgScore ?? 0).toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">tất cả bài học</p>
              </CardContent>
            </Card>

            <Card className="kokonut-glass-card kokonut-glow-border border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-white/70 to-orange-100/55 shadow-glass dark:border-amber-700/45 dark:from-amber-950/35 dark:via-slate-900/70 dark:to-orange-900/25">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Tỷ lệ cải thiện
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight">
                  {(overview?.improvementRate ?? 0).toFixed(0)}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">học viên tiến bộ</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <StudentsAnalyticsTable onSelectStudent={setSelectedStudentId} />
      <StudentDetailDrawer
        onClose={() => setSelectedStudentId(null)}
        studentId={selectedStudentId}
      />
    </section>
  );
}
