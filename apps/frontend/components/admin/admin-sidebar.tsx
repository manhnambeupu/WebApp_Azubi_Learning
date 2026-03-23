"use client";

import { BookOpenText, FolderTree, Loader2, LogOut, Menu, Users } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
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
    <div className="min-h-screen bg-background md:grid md:grid-cols-[292px_1fr]">
      <aside className="relative hidden border-r border-primary/20 bg-gradient-to-b from-slate-950 via-slate-900 to-primary/65 text-slate-100 md:flex md:flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 top-24 h-32 w-32 rounded-full bg-accent/25 blur-3xl"
        />
        <div className="relative space-y-2 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400/90">
            Admin console
          </p>
          <div className="space-y-1.5">
            <p className="text-lg font-semibold tracking-tight text-white">Azubi Admin</p>
            <p className="text-sm text-slate-300/80">Gastro-Hoga-Lernplattform</p>
          </div>
        </div>
        <Separator className="bg-slate-700/70" />
        <nav className="relative flex-1 space-y-2 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group/nav relative flex h-11 w-full items-center rounded-xl px-4 pl-5 text-sm font-medium transition-all duration-300",
                  active
                    ? "bg-gradient-to-r from-primary/30 via-primary/22 to-accent/24 text-white shadow-[0_14px_26px_-20px_rgba(251,191,36,0.9)]"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                )}
                href={item.href}
                key={item.href}
              >
                <span
                  className={cn(
                    "absolute left-2 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-primary to-accent transition-all duration-300",
                    active
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-1 opacity-0 group-hover/nav:translate-x-0 group-hover/nav:opacity-70",
                  )}
                />
                <Icon className="mr-2 h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 p-4 pt-3">
          <ThemeToggle className="w-full justify-center" />
          <Button
            className="w-full justify-start rounded-xl border-slate-600/70 bg-slate-900/80 text-slate-200 hover:bg-slate-800/90 hover:text-white"
            disabled={isLoggingOut}
            onClick={() => {
              void handleLogout();
            }}
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
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col bg-gradient-to-b from-slate-50 via-background to-slate-100/70 dark:from-slate-950 dark:via-background dark:to-slate-900/70">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800/80 bg-gradient-to-r from-slate-950 to-primary/70 px-4 py-3 text-slate-100 md:hidden">
          <div>
            <p className="text-sm font-semibold">Azubi Admin</p>
            <p className="text-xs text-slate-300/70">Quản trị hệ thống</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Toggle navigation menu"
                className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-white"
                size="icon"
                variant="outline"
              >
                <Menu className="h-4 w-4" />
                <span className="sr-only">Mở menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);

                return (
                  <DropdownMenuItem asChild key={item.href}>
                    <Link
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5",
                        active ? "bg-primary/10 font-medium text-foreground" : "",
                      )}
                      href={item.href}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <ThemeToggle className="w-full cursor-pointer" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                disabled={isLoggingOut}
                onClick={() => {
                  void handleLogout();
                }}
              >
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
