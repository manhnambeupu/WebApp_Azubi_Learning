import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AdminLessonsTableFetcher } from "@/components/admin/admin-lessons-table-fetcher";
import { LessonsTableSkeleton } from "@/components/ui/lessons-list-skeleton";

export default function AdminDashboardPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24] shadow-sm">
        <div className="flex flex-col gap-4 border-b-2 border-[#e5e5e5] pb-6 dark:border-[#2b3940] sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#58cc02]/30 bg-[#e8f5e1] px-3 py-1 text-xs font-extrabold text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]">
              Quản trị
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#3c3c3c] dark:text-white sm:text-3xl">
              Quản lý bài học
            </h1>
            <p className="text-xs md:text-sm font-bold text-[#777777] dark:text-slate-400">
              Tạo, chỉnh sửa và theo dõi nội dung các bài học trong hệ thống.
            </p>
          </div>

          <Link
            href="/admin/lessons/new"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border-b-4 border-[#46a302] bg-[#58cc02] px-6 text-sm font-extrabold text-white transition-all hover:bg-[#46a302] active:translate-y-0.5 active:border-b-2"
          >
            <Plus className="h-4 w-4" />
            Tạo bài học mới
          </Link>
        </div>

        <div className="pt-6">
          <Suspense fallback={<LessonsTableSkeleton />}>
            <AdminLessonsTableFetcher />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
