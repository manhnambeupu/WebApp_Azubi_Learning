import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { LessonForm } from "@/components/lessons/lesson-form";
import { Button } from "@/components/ui/button";

export default function AdminCreateLessonPage() {
  return (
    <div className="space-y-6">
      <Button
        asChild
        className="h-10 rounded-xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white text-xs font-extrabold text-[#3c3c3c] hover:bg-[#f7f7f7] active:translate-y-0.5 active:border-b-2 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#18252d] dark:text-white"
        size="sm"
        variant="ghost"
      >
        <Link aria-label="Quay lại danh sách bài học" href="/admin/dashboard">
          <ChevronLeft className="mr-1.5 h-4 w-4" />
          Quay lại danh sách bài học
        </Link>
      </Button>

      <LessonForm mode="create" />
    </div>
  );
}
