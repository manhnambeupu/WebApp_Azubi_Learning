import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AdminLessonsTableFetcher } from "@/components/admin/admin-lessons-table-fetcher";
import { Button } from "@/components/ui/button";
import { LessonsTableSkeleton } from "@/components/ui/lessons-list-skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <section className="space-y-6 kokonut-fade">
      <Card className="kokonut-glass-card kokonut-glow-border border-primary/15 bg-white/70 shadow-glass">
        <CardHeader className="flex flex-col gap-4 border-b border-primary/15 bg-gradient-to-r from-primary/5 via-background to-accent/10 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/15 px-3 py-1 text-xs font-medium text-foreground shadow-[0_8px_20px_-16px_hsl(var(--accent)/0.9)]">
              <Sparkles className="h-3.5 w-3.5 text-accent-foreground" />
              Admin dashboard
            </div>
            <CardTitle className="pt-2 text-2xl">Quản lý bài học</CardTitle>
            <CardDescription className="max-w-2xl leading-7">
              Tạo, chỉnh sửa và theo dõi nội dung các bài học trong hệ thống.
            </CardDescription>
          </div>

          <Button
            asChild
            className="kokonut-hover-lift h-11 w-full rounded-xl border border-white/25 bg-gradient-to-r from-primary via-blue-700 to-amber-600 px-5 text-white shadow-glow-soft transition-all duration-300 hover:brightness-110 hover:shadow-glow-strong sm:w-auto"
          >
            <Link href="/admin/lessons/new">
              <Plus className="mr-2 h-4 w-4" />
              Tạo bài học mới
            </Link>
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          <Suspense fallback={<LessonsTableSkeleton />}>
            <AdminLessonsTableFetcher />
          </Suspense>
        </CardContent>
      </Card>
    </section>
  );
}
