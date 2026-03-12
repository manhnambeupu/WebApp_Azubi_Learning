"use client";

import { BookOpenText, FolderTree, Loader2, LogOut, Menu, Users } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 md:grid md:grid-cols-[280px_1fr]">
      <aside className="hidden border-r border-slate-800 bg-slate-950 text-slate-100 md:flex md:flex-col">
        <div className="space-y-2 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Admin console
          </p>
          <div className="space-y-1">
            <p className="text-lg font-semibold tracking-tight text-white">Azubi Admin</p>
            <p className="text-sm text-slate-400">GastroLernplattform</p>
          </div>
        </div>
        <Separator className="bg-slate-800" />
        <nav className="flex-1 space-y-2 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Button
                asChild
                className={cn(
                  "h-11 w-full justify-start rounded-lg px-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white",
                  active ? "bg-slate-800 text-white shadow-sm hover:bg-slate-800 hover:text-white" : "",
                )}
                key={item.href}
                variant="ghost"
              >
                <Link aria-current={active ? "page" : undefined} href={item.href}>
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
        <div className="p-4">
          <Button
            className="w-full justify-start border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white"
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

      <div className="flex min-h-screen flex-col bg-slate-50">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 md:hidden">
          <div>
            <p className="text-sm font-semibold">Azubi Admin</p>
            <p className="text-xs text-slate-400">Quản trị hệ thống</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
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
                        "flex w-full cursor-pointer items-center gap-2",
                        active ? "font-medium text-foreground" : "",
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
