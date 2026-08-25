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
    <header className="sticky top-0 z-30 border-b-2 border-[#e5e5e5] bg-white text-[#3c3c3c] dark:border-[#2b3940] dark:bg-[#131f24] dark:text-white shadow-sm">
      <nav aria-label="Student top navigation" className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div>
          <Link aria-label="GastroLernplattform" className="inline-block transition-transform hover:scale-105" href="/student/lessons">
            <Image
              alt="GastroLernplattform"
              className="h-20 w-auto object-contain"
              height={80}
              priority
              src="/images/Logo_Book.png"
              width={320}
              unoptimized
            />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle className="rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-xs font-extrabold text-[#3c3c3c] dark:border-[#2b3940] dark:bg-[#18252d] dark:text-white" />
          <div className="hidden rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] px-3.5 py-1.5 text-xs font-extrabold text-[#3c3c3c] dark:border-[#2b3940] dark:bg-[#18252d] dark:text-white sm:block">
            {displayName}
          </div>
          <Button
            className="h-9 rounded-xl border-2 border-[#ff4b4b]/30 border-b-4 border-b-[#e03838] bg-[#ffebee] px-3 text-xs font-extrabold text-[#ff4b4b] hover:bg-[#ffdada] active:translate-y-0.5 active:border-b-2 dark:border-[#ff4b4b]/40 dark:border-b-[#ff4b4b]/80 dark:bg-[#ff4b4b]/20"
            disabled={isLoggingOut}
            onClick={() => {
              void handleLogout();
            }}
            size="sm"
            variant="ghost"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Đang thoát...
              </>
            ) : (
              <>
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Đăng xuất
              </>
            )}
          </Button>
        </div>
      </nav>
    </header>
  );
}
