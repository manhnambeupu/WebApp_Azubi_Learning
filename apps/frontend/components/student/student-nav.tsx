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
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link className="text-base font-semibold tracking-tight" href="/student/lessons">
          GastroLernplattform
        </Link>

        <div className="flex items-center gap-2">
          <p className="hidden text-sm text-muted-foreground sm:block">{displayName}</p>
          <Button
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
