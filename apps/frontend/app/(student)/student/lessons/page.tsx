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
      <header className="kokonut-glass-card kokonut-glow-border relative overflow-hidden border-primary/20 bg-white/60 px-6 py-7 shadow-glow-soft dark:bg-slate-950/50 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/30 blur-3xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-primary">
              <GraduationCap className="h-3.5 w-3.5" />
              Student Dashboard
            </span>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Danh sách bài học
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              🏆 📈Làm chủ lộ trình ôn thi của bạn: Tăng cường và củng cố kiến
              thức dựa trên các bài học liên quan mật thiết với
              Abschlussprüfung, tự tin chinh phục từng mục tiêu🎯🏆
            </p>
            <blockquote className="max-w-3xl border-l-4 border-primary/35 pl-4 text-sm leading-7 text-muted-foreground">
              &ldquo;Chìa khóa lớn nhất để bứt phá trong hành trình Ausbildung không chỉ nằm ở những gì bạn được dạy, mà ở sự chủ động tự học và biết cách chắt lọc thông tin.&rdquo;
            </blockquote>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
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
