"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth-store";

function OAuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getMe } = useAuth();
  const { setAccessToken } = useAuthStore();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const accessToken = searchParams.get("accessToken");

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    setAccessToken(accessToken);

    const syncAndRedirect = async () => {
      try {
        const user = await getMe();
        router.replace(user.role === "ADMIN" ? "/admin/dashboard" : "/student/lessons");
      } catch {
        router.replace("/login");
      }
    };

    void syncAndRedirect();
  }, [searchParams, router, getMe, setAccessToken]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Đang xác thực tài khoản...</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      }
    >
      <OAuthCallbackHandler />
    </Suspense>
  );
}
