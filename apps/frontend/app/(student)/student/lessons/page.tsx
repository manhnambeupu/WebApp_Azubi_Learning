import { GraduationCap } from "lucide-react";
import { Suspense } from "react";
import { DonationBanner } from "@/components/student/donation-banner";
import { StudentLessonCounterBadge } from "@/components/student/student-lesson-counter-badge";
import { StudentLessonsListFetcher } from "@/components/student/student-lessons-list-fetcher";
import { LessonsGridSkeleton } from "@/components/ui/lessons-list-skeleton";

export default function StudentLessonsPage() {
  const frontendUrl = process.env.FRONTEND_URL;
  const siteUrl =
    frontendUrl && frontendUrl.startsWith("http")
      ? frontendUrl
      : "http://localhost:3000";
  const normalizedSiteUrl = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;

  const lessonsCollectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "Danh sach bai hoc Ausbildung cho nguoi Viet",
    description:
      "Bo bai hoc he thong hoa kien thuc Ausbildung tai Duc, huong den hoc tap ben vung va minh bach thong tin cho nguoi Viet.",
    provider: {
      "@type": "Organization",
      name: "AzubiVN",
      url: normalizedSiteUrl,
    },
    inLanguage: "vi-VN",
    educationalLevel: "Vocational education",
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
    },
    url: `${normalizedSiteUrl}/student/lessons`,
    about: [
      "Ausbildung tai Duc",
      "Lo trinh hoc nghe cho nguoi Viet",
      "Thong tin minh bach ve hoc tap",
    ],
  } as const;

  return (
    <article className="space-y-8">
      <header className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24] sm:p-8">
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-[#58cc02]/30 bg-[#e8f5e1] px-3 py-1 text-xs font-extrabold text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]">
              <GraduationCap className="h-3.5 w-3.5" />
              Student Dashboard
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#3c3c3c] dark:text-white sm:text-3xl">
              Danh sách bài học
            </h1>
            <p className="max-w-2xl text-xs md:text-sm font-bold leading-relaxed text-[#777777] dark:text-slate-300">
              🏆 📈Làm chủ lộ trình ôn thi của bạn: Tăng cường và củng cố kiến
              thức dựa trên các bài học liên quan mật thiết với
              Abschlussprüfung, tự tin chinh phục từng mục tiêu🎯🏆
            </p>
            <blockquote className="max-w-3xl rounded-2xl border-2 border-[#58cc02]/30 border-l-4 border-l-[#58cc02] bg-[#e8f5e1]/40 p-4 text-xs md:text-sm font-bold italic leading-relaxed text-[#3c3c3c] dark:bg-[#58cc02]/10 dark:text-slate-200">
              &ldquo;Chìa khóa lớn nhất để bứt phá trong hành trình Ausbildung không chỉ nằm ở những gì bạn được dạy, mà ở sự chủ động tự học và biết cách chắt lọc thông tin.&rdquo;
            </blockquote>
            <ul className="list-disc space-y-1 pl-5 text-xs md:text-sm font-bold leading-6 text-[#777777] dark:text-slate-300">
              <li>Hệ thống lại kiến thức trọng tâm, bám sát cấu trúc đề thi giữa và cuối kỳ.</li>
              <li>Dễ dàng tìm lại các kiến thức quan trọng được phân loại rõ ràng.</li>
              <li>Chuẩn bị bài tập và các bài kiểm tra nhanh chóng theo đúng lộ trình.</li>
            </ul>
          </div>
          <StudentLessonCounterBadge />
        </div>
      </header>

      <Suspense fallback={<LessonsGridSkeleton />}>
        <section aria-label="Danh sach bai hoc hien co">
          <StudentLessonsListFetcher />
        </section>
      </Suspense>

      <section aria-label="Dong hanh va dong gop">
        <DonationBanner />
      </section>
    </article>
  );
}
