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
    if (!error.response || error.code === "ERR_NETWORK") {
      return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc liên hệ Admin: tranmanhnam@azubivn.de";
    }

    if (error.response.status >= 500) {
      return "Hệ thống đang bảo trì. Vui lòng thử lại sau ít phút hoặc liên hệ Admin: tranmanhnam@azubivn.de";
    }

    const apiMessage = (error.response?.data as { message?: string })?.message;
    if (apiMessage) {
      return apiMessage;
    }
  }
  return "Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.";
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
        title: "Đăng nhập thất bại",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative z-10 w-full overflow-hidden flex flex-col md:flex-row rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white text-[#3c3c3c] shadow-xl dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24] dark:text-white">
      <Suspense fallback={null}>
        <OAuthErrorToaster />
      </Suspense>

      {/* BEGIN: Sidebar Section */}
      <section className="w-full md:w-5/12 p-6 md:p-8 bg-[#f7f7f7] dark:bg-[#111b21] border-b-2 md:border-b-0 md:border-r-2 border-[#e5e5e5] dark:border-[#2b3940] flex flex-col items-center justify-center text-center">
        <Link
          href="/"
          aria-label="Quay về trang chủ"
          className="relative block w-full max-w-[220px] aspect-square transition-transform hover:scale-105 active:scale-95"
        >
          <Image
            src="/images/Logo_Book.png"
            alt="Azubi Learning Logo"
            width={240}
            height={240}
            unoptimized
            className="h-auto w-full object-contain drop-shadow-sm"
            priority
          />
        </Link>

        {/* Support Card (Lingo 3D Tactile Card) */}
        <div className="mt-6 w-full max-w-[320px] rounded-2xl bg-white dark:bg-[#131f24] p-5 text-left border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] dark:border-[#2b3940] dark:border-b-[#1c272d] transition-transform hover:-translate-y-1">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border-2 border-[#58cc02]/30 bg-[#e8f5e1] dark:bg-[#58cc02]/20 px-3 py-1 text-xs font-extrabold text-[#46a302] dark:text-[#58cc02]">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#58cc02]"></span>
            </span>
            Online 24/7
          </div>

          {/* Jason Avatar */}
          <div className="my-3 flex justify-center">
            <div className="relative">
              <Image
                src="/images/avatar.jpg"
                alt="Jason - Giảng viên kèm học 1-1"
                width={76}
                height={76}
                className="relative rounded-full object-cover ring-4 ring-[#e8f5e1] dark:ring-[#58cc02]/30 border-2 border-[#58cc02]"
                priority
                unoptimized
              />
            </div>
          </div>

          <h3 className="mb-1 text-center text-base font-extrabold text-[#3c3c3c] dark:text-white">
            Gia Sư Fachkraft für Gastronomie
          </h3>
          <p className="mb-4 text-center text-xs font-bold leading-snug text-[#777777] dark:text-slate-300">
            Khoá học hệ 2 năm 1-1. Liên hệ WhatsApp hoặc Email để nhận tư vấn chi tiết.
          </p>

          <div className="flex flex-col gap-2.5">
            <a
              href="https://wa.me/4915758084635"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] dark:border-[#2b3940] dark:border-b-[#1c272d] bg-[#f7f7f7] dark:bg-[#18252d] p-2.5 transition-all hover:-translate-y-0.5 hover:border-[#58cc02] active:translate-y-0.5 active:border-b-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f5e1] text-[#46a302] transition-transform group-hover:scale-110">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-[#3c3c3c] dark:text-white">WhatsApp</p>
                <p className="font-semibold text-[#777777] dark:text-slate-400">+49 15758084635</p>
              </div>
            </a>

            <a
              href="mailto:jasonluong@azubivn.de"
              className="group flex items-center gap-3 rounded-xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] dark:border-[#2b3940] dark:border-b-[#1c272d] bg-[#f7f7f7] dark:bg-[#18252d] p-2.5 transition-all hover:-translate-y-0.5 hover:border-[#58cc02] active:translate-y-0.5 active:border-b-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e0f2fe] text-[#0284c7] transition-transform group-hover:scale-110">
                <Mail className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-[#3c3c3c] dark:text-white">Email</p>
                <p className="font-semibold text-[#777777] dark:text-slate-400">jasonluong@azubivn.de</p>
              </div>
            </a>
          </div>
        </div>
      </section>
      {/* END: Sidebar Section */}

      {/* BEGIN: Form Section */}
      <section className="w-full md:w-7/12 p-8 md:p-12 flex flex-col items-center justify-center bg-white dark:bg-[#131f24]">
        {/* Learning Portal Badge */}
        <div className="inline-flex items-center gap-2 bg-[#e8f5e1] dark:bg-[#58cc02]/20 border-2 border-[#58cc02]/30 px-3.5 py-1 rounded-full text-xs font-extrabold text-[#46a302] dark:text-[#58cc02] mb-5">
          <BookOpenText className="h-3.5 w-3.5" />
          <span>E-Learning-Plattform</span>
        </div>

        {/* Sign In Header */}
        <div className="text-center mb-6 w-full">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#3c3c3c] dark:text-white mb-1">
            Anmeldung
          </h2>
          <p className="text-xs md:text-sm font-bold text-[#777777] dark:text-slate-400">
            Zugang zum Lernportal für Auszubildende
          </p>
        </div>

        {/* Login Form */}
        <form className="w-full max-w-sm space-y-4" onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="space-y-1.5">
            <Label className="block text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-3 h-12 rounded-xl bg-[#f7f7f7] dark:bg-[#111b21] border-2 border-[#e5e5e5] dark:border-[#2b3940] text-sm font-bold text-[#3c3c3c] dark:text-white placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none transition-colors"
              required
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <Label className="block text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300" htmlFor="password">
              Passwort
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-4 py-3 h-12 rounded-xl bg-[#f7f7f7] dark:bg-[#111b21] border-2 border-[#e5e5e5] dark:border-[#2b3940] text-sm font-bold text-[#3c3c3c] dark:text-white placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none transition-colors"
              required
            />
          </div>

          {errorMessage ? (
            <p className="rounded-xl border-2 border-[#ff4b4b]/40 bg-[#ffebee] dark:bg-[#ff4b4b]/15 px-3 py-2 text-xs font-extrabold text-[#ff4b4b]">
              {errorMessage}
            </p>
          ) : null}

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              className="w-full h-12 rounded-2xl bg-[#58cc02] hover:bg-[#46a302] text-white font-extrabold text-base border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1 transition-all shadow-sm cursor-pointer disabled:opacity-50"
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
              <div className="w-full border-t-2 border-[#e5e5e5] dark:border-[#2b3940]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-extrabold">
              <span className="bg-white dark:bg-[#131f24] px-3 text-[#777777] dark:text-slate-400">
                oder weiter mit
              </span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div>
            <a
              className="flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] dark:border-[#2b3940] dark:border-b-[#1c272d] bg-white dark:bg-[#18252d] text-sm font-extrabold text-[#3c3c3c] dark:text-white transition-all hover:-translate-y-0.5 hover:border-[#58cc02] active:translate-y-0.5 active:border-b-2 cursor-pointer shadow-sm"
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
          </div>
        </form>
      </section>
      {/* END: Form Section */}
    </main>
  );
}