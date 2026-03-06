"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types";

type RoleProtectedLayoutProps = {
  requiredRole: UserRole;
  children: React.ReactNode;
};

export function RoleProtectedLayout({
  requiredRole,
  children,
}: RoleProtectedLayoutProps) {
  const router = useRouter();
  const { getMe, refreshToken } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let isActive = true;

    const checkAuth = async () => {
      try {
        const { accessToken } = useAuthStore.getState();
        if (!accessToken) {
          await refreshToken();
        }

        const me = await getMe();
        if (me.role !== requiredRole) {
          router.replace("/login");
          return;
        }
      } catch {
        router.replace("/login");
      } finally {
        if (isActive) {
          setIsCheckingAuth(false);
        }
      }
    };

    void checkAuth();

    return () => {
      isActive = false;
    };
  }, [getMe, refreshToken, requiredRole, router]);

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
