"use client";

import { AxiosError } from "axios";
import { BookOpenText, Loader2, MessageCircle, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { consumeSessionConflictToast } from "@/lib/auth-session";
import { useAuth } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth-store";
import type { UserRole } from "@/types";

const roleRedirectPath = (role: UserRole): string =>
  role === "ADMIN" ? "/admin/dashboard" : "/student/lessons";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const apiMessage = (error.response?.data as { message?: string })?.message;
    if (apiMessage) {
      return apiMessage;
    }
  }
  return "Login failed. Please check your credentials and try again.";
};

function OAuthErrorToaster() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("error") === "oauth_failed") {
      toast({
        title: "Đăng nhập thất bại",
        description:
          "Quá trình đăng nhập bằng tài khoản mạng xã hội đã bị hủy hoặc gặp sự cố.",
        variant: "destructive",
      });

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams, toast]);

  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, getMe } = useAuth();
  const { user, isAuthenticated, accessToken } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const sessionConflictMessage = consumeSessionConflictToast();
    if (!sessionConflictMessage) {
      return;
    }

    toast({
      title: sessionConflictMessage,
      variant: "destructive",
    });
  }, [toast]);

  useEffect(() => {
    if (user) {
      router.replace(roleRedirectPath(user.role));
      return;
    }

    if (!isAuthenticated && !accessToken) {
      return;
    }

    let isActive = true;
    const syncUser = async () => {
      try {
        const me = await getMe();
        if (isActive) {
          router.replace(roleRedirectPath(me.role));
        }
      } catch {
        // ignore, user remains on login page
      }
    };

    void syncUser();

    return () => {
      isActive = false;
    };
  }, [accessToken, getMe, isAuthenticated, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login(email, password);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative z-10 w-full overflow-hidden flex flex-col md:flex-row rounded-[2rem] border border-white/20 bg-white/12 shadow-[0_8px_32px_0_rgba(16,185,129,0.37)]">
      <Suspense fallback={null}>
        <OAuthErrorToaster />
      </Suspense>

      {/* BEGIN: Sidebar Section */}
      <section className="w-full md:w-5/12 p-8 md:p-12 text-white bg-black/20 border-r border-white/10 flex flex-col items-center justify-center text-center">
        <Link
          href="/"
          aria-label="Quay về trang chủ"
          className="relative block w-full max-w-[280px] sm:max-w-[300px] md:max-w-[320px] aspect-square animate-in fade-in duration-500"
        >
          <Image
            src="/images/Logo_Book.png"
            alt="Azubi Learning Logo"
            fill
            className="object-contain"
            priority
            sizes="(max-width: 768px) 70vw, 320px"
          />
        </Link>
        {/* Support Card (Glassmorphism) */}
        <div className="mt-8 md:mt-12 w-full max-w-[320px] rounded-2xl bg-white/10 p-5 md:p-6 text-left border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both hover:-translate-y-1 transition-transform">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-100">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Online 24/7
          </div>

          {/* Jason Avatar */}
          <div className="my-4 flex justify-center">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-emerald-400/60 via-white/30 to-amber-400/60 blur-sm"></div>
              <Image
                src="/images/avatar.jpg"
                alt="Jason - Giảng viên kèm học 1-1"
                width={80}
                height={80}
                className="relative rounded-full object-cover ring-2 ring-white/40 shadow-lg"
                priority
              />
            </div>
          </div>

          <h3 className="mb-1 text-lg font-bold leading-tight text-white drop-shadow-sm md:text-xl">
            Gia Sư Fachkraft für Gastronomie
          </h3>
          <p className="mb-5 text-sm font-medium leading-snug text-white/80 md:text-[15px]">
            Khoá học hệ 2 năm Fachkraft für Gastronomie 1-1. Liên hệ Whatsapp hoặc Gmail để biết thêm chi tiết ❤️
          </p>

          <div className="flex flex-col gap-3">
            <a
              href="https://wa.me/4915758084635"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-white/15 bg-black/20 p-3 transition-all duration-300 hover:border-emerald-500/30 hover:bg-emerald-500/20"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 transition-transform group-hover:scale-110">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-white">WhatsApp</p>
                <p className="text-white/60">+49 15758084635</p>
              </div>
            </a>

            <a
              href="mailto:jasonluong@azubivn.de"
              className="group flex items-center gap-3 rounded-xl border border-white/15 bg-black/20 p-3 transition-all duration-300 hover:border-blue-500/30 hover:bg-blue-500/20"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 transition-transform group-hover:scale-110">
                <Mail className="h-4 w-4" />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-white">Email</p>
                <p className="text-white/60">jasonluong@azubivn.de</p>
              </div>
            </a>
          </div>
        </div>
      </section>
      {/* END: Sidebar Section */}

      {/* BEGIN: Form Section */}
      <section className="w-full md:w-7/12 p-8 md:p-12 flex flex-col items-center justify-center">
        {/* Learning Portal Badge */}
        <div className="inline-flex items-center gap-2 bg-white/50 px-4 py-1.5 rounded-full text-sm font-medium text-gray-800 mb-6 backdrop-blur-sm border border-white/40 shadow-sm">
          <BookOpenText className="h-4 w-4" />
          <span>E-Learning-Plattform</span>
        </div>

        {/* Sign In Header */}
        <div className="text-center mb-8 w-full">
          <h2 className="text-3xl font-bold text-white mb-2">Anmeldung</h2>
          <p className="text-white/80 text-sm">Zugang zum Lernportal für Auszubildende</p>
        </div>

        {/* Login Form */}
        <form className="w-full max-w-sm space-y-5" onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="space-y-1">
            <Label className="block text-sm font-medium text-white" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-3 h-12 rounded-lg bg-white/40 backdrop-blur-sm border border-white/40 text-gray-900 placeholder:text-gray-600 focus:ring-2 focus:ring-primary shadow-sm transition-all duration-200"
              required
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <Label className="block text-sm font-medium text-white" htmlFor="password">
              Passwort
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-4 py-3 h-12 rounded-lg bg-white/40 backdrop-blur-sm border border-white/40 text-gray-900 placeholder:text-gray-600 focus:ring-2 focus:ring-primary shadow-sm transition-all duration-200"
              required
            />
          </div>

          {errorMessage ? (
            <p className="rounded-xl border border-destructive/35 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              className="w-full h-14 rounded-xl text-slate-950 font-medium text-lg bg-gradient-to-r from-[#2F913C] to-[#FFD24A] hover:opacity-90 transition-opacity duration-200 shadow-lg"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Anmelden...
                </>
              ) : (
                "Anmelden"
              )}
            </Button>
          </div>

          {/* Social Login Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/30" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 text-white/80">
                oder weiter mit
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <a
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-300/50 bg-white/70 text-sm font-medium text-gray-800 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-md"
              href={`${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/google`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </a>
            <a
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-gray-300/50 bg-[#1877F2] text-sm font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#166FE5] hover:shadow-md"
              href={`${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/facebook`}
            >
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </a>
          </div>
        </form>
      </section>
      {/* END: Form Section */}
    </main>
  );
}
