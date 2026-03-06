import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { RoleProtectedLayout } from "@/components/auth/role-protected-layout";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <RoleProtectedLayout requiredRole="ADMIN">
      <AdminSidebar>{children}</AdminSidebar>
    </RoleProtectedLayout>
  );
}
