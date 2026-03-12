import { RoleProtectedLayout } from "@/components/auth/role-protected-layout";
import { StudentNav } from "@/components/student/student-nav";

type StudentLayoutProps = {
  children: React.ReactNode;
};

export default function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <RoleProtectedLayout requiredRole="STUDENT">
      <div className="min-h-screen bg-slate-50">
        <StudentNav />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </RoleProtectedLayout>
  );
}
