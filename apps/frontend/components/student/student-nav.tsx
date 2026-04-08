"use client";

import { Loader2, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-950/95">
      <nav aria-label="Student top navigation" className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <Link aria-label="GastroLernplattform" className="inline-block" href="/student/lessons">
              <Image
                alt="GastroLernplattform"
                className="h-20 w-auto"
                height={80}
                priority
                src="/images/Logo_Book.png"
                width={320}
                unoptimized
              />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <p className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:block">
              {displayName}
            </p>
            <Button
              className="border-slate-200 bg-white shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
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

        <p className="ml-auto mt-2 max-w-[14rem] truncate rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:hidden">
          {displayName}
        </p>
      </nav>
    </header>
  );
}
