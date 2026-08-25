"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Clock, TrendingUp, Users } from "lucide-react";
import { StudentDetailDrawer } from "@/components/admin/analytics/student-detail-drawer";
import { StudentsAnalyticsTable } from "@/components/admin/analytics/students-table";
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
    <div className="h-32 animate-pulse rounded-[24px] border-2 border-[#e5e5e5] bg-white p-5 dark:border-[#2b3940] dark:bg-[#131f24]" />
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
    <section className="space-y-6">
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
            {/* Active Students Card */}
            <div className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-5 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                  Học viên hoạt động
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8f5e1] text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-[#3c3c3c] dark:text-white">
                {overview?.activeStudentsThisWeek ?? 0}
              </p>
              <p className="mt-1 text-xs font-bold text-[#777777] dark:text-slate-400">
                trong 7 ngày qua
              </p>
            </div>

            {/* Average Duration Card */}
            <div className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-5 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                  Thời gian trung bình
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e0f2fe] text-[#0284c7] dark:bg-[#0284c7]/20 dark:text-[#38bdf8]">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-[#3c3c3c] dark:text-white">
                {formatDuration(Math.round(overview?.avgActiveTimeSeconds ?? 0))}
              </p>
              <p className="mt-1 text-xs font-bold text-[#777777] dark:text-slate-400">
                mỗi bài học
              </p>
            </div>

            {/* Average Score Card */}
            <div className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-5 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                  Điểm trung bình
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3e8ff] text-[#9333ea] dark:bg-[#9333ea]/20 dark:text-[#c084fc]">
                  <BarChart3 className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-[#3c3c3c] dark:text-white">
                {(overview?.avgScore ?? 0).toFixed(1)}%
              </p>
              <p className="mt-1 text-xs font-bold text-[#777777] dark:text-slate-400">
                tất cả bài học
              </p>
            </div>

            {/* Improvement Rate Card */}
            <div className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-5 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                  Tỷ lệ tiến bộ
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fef9e7] text-[#d97706] dark:bg-[#d97706]/20 dark:text-[#fbbf24]">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-extrabold text-[#3c3c3c] dark:text-white">
                {(overview?.improvementRate ?? 0).toFixed(0)}%
              </p>
              <p className="mt-1 text-xs font-bold text-[#777777] dark:text-slate-400">
                học viên cải thiện điểm
              </p>
            </div>
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
