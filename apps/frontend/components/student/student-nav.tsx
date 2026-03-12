"use client";

import { Loader2, LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth-store";

export function StudentNav() {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = user?.fullName?.trim() || user?.email || "Student";

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="space-y-0.5">
          <Link className="text-base font-semibold tracking-tight text-slate-900" href="/student/lessons">
            GastroLernplattform
          </Link>
          <p className="text-xs text-slate-500">Không gian học tập dành cho học viên</p>
        </div>

        <div className="flex items-center gap-3">
          <p className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600 sm:block">
            {displayName}
          </p>
          <Button
            className="border-slate-200 bg-white shadow-sm hover:bg-slate-50"
            disabled={isLoggingOut}
            onClick={() => {
              void handleLogout();
            }}
            size="sm"
            variant="outline"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đăng xuất...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
