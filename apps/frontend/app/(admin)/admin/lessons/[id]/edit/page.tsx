"use client";

import { ChevronLeft, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LessonForm } from "@/components/lessons/lesson-form";
import { Button } from "@/components/ui/button";
import { useGetLesson } from "@/hooks/use-lessons";
import { getApiErrorMessage } from "@/lib/api-error";

const normalizeParam = (value: string | string[] | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
};

const LessonFilesManager = dynamic(
  () =>
    import("@/components/lessons/lesson-files-manager").then(
      (mod) => mod.LessonFilesManager,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-xs font-bold text-[#777777] dark:text-slate-400">
        Đang tải khu vực quản lý file đính kèm...
      </p>
    ),
  },
);

const QuestionList = dynamic(
  () => import("@/components/questions/question-list").then((mod) => mod.QuestionList),
  {
    ssr: false,
    loading: () => (
      <p className="text-xs font-bold text-[#777777] dark:text-slate-400">
        Đang tải khu vực quản lý câu hỏi...
      </p>
    ),
  },
);

export default function AdminEditLessonPage() {
  const params = useParams<{ id?: string | string[] }>();
  const lessonId = normalizeParam(params.id);

  const lessonQuery = useGetLesson(lessonId);

  if (!lessonId) {
    return (
      <section className="rounded-[24px] border-2 border-[#ff4b4b]/30 bg-[#ffebee] p-6 dark:border-[#ff4b4b]/40 dark:bg-[#ff4b4b]/15">
        <p className="text-xs font-extrabold text-[#ff4b4b]">Không tìm thấy mã bài học hợp lệ.</p>
      </section>
    );
  }

  if (lessonQuery.isLoading) {
    return (
      <section className="flex min-h-[320px] items-center justify-center rounded-[24px] border-2 border-[#e5e5e5] bg-white p-6 dark:border-[#2b3940] dark:bg-[#131f24]">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#777777] dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-[#58cc02]" />
          Đang tải thông tin bài học...
        </div>
      </section>
    );
  }

  if (lessonQuery.isError) {
    return (
      <section className="space-y-4 rounded-[24px] border-2 border-[#ff4b4b]/30 bg-[#ffebee] p-6 dark:border-[#ff4b4b]/40 dark:bg-[#ff4b4b]/15">
        <p className="text-xs font-extrabold text-[#ff4b4b]">{getApiErrorMessage(lessonQuery.error)}</p>
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
      </section>
    );
  }

  if (!lessonQuery.data) {
    return null;
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
      </div>

      <section className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
        <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#58cc02]/30 bg-[#e8f5e1] px-3 py-1 text-xs font-extrabold text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]">
          Lesson Builder
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#3c3c3c] dark:text-white sm:text-3xl">
          Biên soạn nội dung bài học
        </h1>
        <p className="mt-1 text-xs md:text-sm font-bold text-[#777777] dark:text-slate-400">
          Cập nhật thông tin chung, nội dung bài giảng, tài liệu đính kèm và ngân hàng câu hỏi.
        </p>
      </section>

      <div>
        <LessonForm lesson={lessonQuery.data} mode="edit" />
      </div>

      <div>
        <LessonFilesManager files={lessonQuery.data.files} lessonId={lessonId} />
      </div>

      <div>
        <QuestionList lessonId={lessonId} />
      </div>
    </div>
  );
}
