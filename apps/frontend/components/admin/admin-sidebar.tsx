"use client";

import {
  BarChart3,
  BookOpenText,
  BotMessageSquare,
  FolderTree,
  Loader2,
  LogOut,
  Mail,
  Menu,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: BookOpenText,
  },
  {
    href: "/admin/categories",
    label: "Danh mục",
    icon: FolderTree,
  },
  {
    href: "/admin/students",
    label: "Quản lý học viên",
    icon: Users,
  },
  {
    href: "/admin/emails",
    label: "Gửi email",
    icon: Mail,
  },
  {
    href: "/admin/analytics",
    label: "Phân tích",
    icon: BarChart3,
  },
  {
    href: "/admin/ai-tutor",
    label: "Lịch sử AI Chat",
    icon: BotMessageSquare,
  },
];

const isActivePath = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);

export function AdminSidebar({ children }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f7f7f7] text-[#3c3c3c] dark:bg-[#111b21] dark:text-white">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 z-30 hidden h-dvh w-[280px] shrink-0 flex-col justify-between overflow-y-auto border-r-2 border-[#e5e5e5] bg-white text-[#3c3c3c] dark:border-[#2b3940] dark:bg-[#131f24] dark:text-white md:flex">
        <div>
          {/* Brand Header */}
          <div className="p-6 pb-4">
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#58cc02]/30 bg-[#e8f5e1] px-3 py-1 text-xs font-extrabold text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]">
              Admin Console
            </div>
            <div className="mt-3 space-y-0.5">
              <h2 className="text-xl font-extrabold tracking-tight text-[#3c3c3c] dark:text-white">
                Azubi Admin
              </h2>
              <p className="text-xs font-bold text-[#777777] dark:text-slate-400">
                Gastro-Hoga-Lernplattform
              </p>
            </div>
          </div>

          <div className="mx-6 border-b-2 border-[#e5e5e5] dark:border-[#2b3940]" />

          {/* Nav Links */}
          <nav className="space-y-2 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-extrabold transition-all",
                    active
                      ? "border-2 border-[#58cc02] border-b-4 border-b-[#46a302] bg-[#e8f5e1] text-[#46a302] dark:border-[#58cc02] dark:border-b-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]"
                      : "border-2 border-transparent text-[#777777] hover:border-[#e5e5e5] hover:border-b-4 hover:border-b-[#d4d4d4] hover:bg-[#f7f7f7] hover:text-[#3c3c3c] dark:text-slate-400 dark:hover:border-[#2b3940] dark:hover:border-b-[#1c272d] dark:hover:bg-[#18252d] dark:hover:text-white active:translate-y-0.5 active:border-b-2",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                      active
                        ? "bg-[#58cc02] text-white"
                        : "bg-[#f0f0f0] text-[#777777] dark:bg-[#1f2d35] dark:text-slate-300",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          {/* Footer Actions */}
          <div className="space-y-2.5 p-4 pt-2">
            <ThemeToggle className="w-full justify-center rounded-2xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white font-extrabold text-[#3c3c3c] hover:bg-[#f7f7f7] active:translate-y-0.5 active:border-b-2 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#18252d] dark:text-white dark:hover:bg-[#1f2d35]" />
            
            <Button
              className="w-full justify-center gap-2 rounded-2xl border-2 border-[#ff4b4b]/30 border-b-4 border-b-[#e03838] bg-[#ffebee] font-extrabold text-[#ff4b4b] hover:bg-[#ffdada] active:translate-y-0.5 active:border-b-2 dark:border-[#ff4b4b]/40 dark:border-b-[#ff4b4b]/80 dark:bg-[#ff4b4b]/20 dark:text-[#ff4b4b] dark:hover:bg-[#ff4b4b]/30"
              disabled={isLoggingOut}
              onClick={() => {
                void handleLogout();
              }}
              variant="ghost"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang đăng xuất...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </>
              )}
            </Button>
          </div>

          {/* Legal Links */}
          <div className="border-t-2 border-[#e5e5e5] p-4 text-center dark:border-[#2b3940]">
            <div className="flex justify-center gap-4 text-xs font-bold text-[#777777] dark:text-slate-400">
              <a href="/impressum" className="hover:text-[#58cc02] hover:underline">
                Impressum
              </a>
              <span>•</span>
              <a href="/datenschutz" className="hover:text-[#58cc02] hover:underline">
                Datenschutz
              </a>
            </div>
            <p className="mt-1 text-[11px] font-bold text-[#a0a0a0] dark:text-slate-500">
              © Azubi Learning
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 min-w-0 flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b-2 border-[#e5e5e5] bg-white px-4 py-3 text-[#3c3c3c] dark:border-[#2b3940] dark:bg-[#131f24] dark:text-white md:hidden">
          <div>
            <p className="text-sm font-extrabold">Azubi Admin</p>
            <p className="text-xs font-bold text-[#777777] dark:text-slate-400">Quản trị hệ thống</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Toggle navigation menu"
                className="h-10 w-10 rounded-xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white text-[#3c3c3c] hover:bg-[#f7f7f7] active:translate-y-0.5 active:border-b-2 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#18252d] dark:text-white"
                size="icon"
                variant="outline"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Mở menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px] rounded-2xl border-2 border-[#e5e5e5] bg-white p-2 dark:border-[#2b3940] dark:bg-[#131f24]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);

                return (
                  <DropdownMenuItem asChild key={item.href}>
                    <Link
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-extrabold",
                        active
                          ? "bg-[#e8f5e1] text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]"
                          : "text-[#777777] hover:bg-[#f7f7f7] hover:text-[#3c3c3c] dark:text-slate-300 dark:hover:bg-[#18252d]",
                      )}
                      href={item.href}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator className="my-1 border-b border-[#e5e5e5] dark:border-[#2b3940]" />
              <DropdownMenuItem asChild>
                <ThemeToggle className="w-full cursor-pointer rounded-xl" />
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 border-b border-[#e5e5e5] dark:border-[#2b3940]" />
              <DropdownMenuItem
                className="cursor-pointer rounded-xl font-extrabold text-[#ff4b4b] hover:bg-[#ffebee] dark:hover:bg-[#ff4b4b]/20"
                disabled={isLoggingOut}
                onClick={() => {
                  void handleLogout();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}