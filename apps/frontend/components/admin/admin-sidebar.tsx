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
    <div className="min-h-screen bg-muted/30 md:grid md:grid-cols-[260px_1fr]">
      <aside className="hidden border-r bg-background md:flex md:flex-col">
        <div className="px-6 py-5">
          <p className="text-base font-semibold">Azubi Admin</p>
          <p className="text-xs text-muted-foreground">GastroLernplattform</p>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Button
                asChild
                className={cn(
                  "w-full justify-start",
                  active ? "bg-primary/10 text-primary hover:bg-primary/15" : "",
                )}
                key={item.href}
                variant="ghost"
              >
                <Link href={item.href}>
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
        <div className="p-4">
          <Button
            className="w-full justify-start"
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

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
          <div>
            <p className="text-sm font-semibold">Azubi Admin</p>
            <p className="text-xs text-muted-foreground">Quản trị hệ thống</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Mở menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {navItems.map((item) => (
                <DropdownMenuItem asChild key={item.href}>
                  <Link className="cursor-pointer" href={item.href}>
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
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

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
