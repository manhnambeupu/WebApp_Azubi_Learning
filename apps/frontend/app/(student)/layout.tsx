import type { Metadata } from "next";
import { RoleProtectedLayout } from "@/components/auth/role-protected-layout";
import { StudentFooter } from "@/components/student/student-footer";
import { StudentNav } from "@/components/student/student-nav";

type StudentLayoutProps = {
  children: React.ReactNode;
};

export const metadata: Metadata = {
  title: {
    template: "%s | Hệ thống học tập | Azubi",
    default: "Hệ thống học tập | Azubi",
  },
};

export default function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <RoleProtectedLayout requiredRole="STUDENT">
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <StudentNav />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
          {children}
        </main>

        {/* === STUDENT FOOTER === */}
        <StudentFooter />
      </div>
    </RoleProtectedLayout>
  );
}
