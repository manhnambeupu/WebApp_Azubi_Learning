"use client";

import { AxiosError } from "axios";
import { BookOpenText, Loader2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="kokonut-glass-card kokonut-glow-border border-primary/20 bg-white/60 text-foreground shadow-glow-soft dark:bg-slate-950/55">
      <CardHeader className="space-y-3 pb-5">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-[0.08em] text-primary">
          <BookOpenText className="h-3.5 w-3.5" />
          Learning Portal
        </span>
        <CardTitle className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
          Sign in
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Access your Azubi learning dashboard.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-5 sm:grid-cols-[0.85fr_minmax(0,1.2fr)] sm:items-start">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background/80 to-accent/20 p-4 text-sm text-muted-foreground">
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-accent/40 blur-2xl"
              aria-hidden
            />
            <div className="relative space-y-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/40 bg-white/60 text-primary shadow-glow-soft dark:bg-slate-900/75">
                <UserRound className="h-5 w-5" />
              </div>
              <p className="font-semibold leading-6 text-foreground">
                Học tập một cách hiệu quả
              </p>
              <p className="text-xs leading-5">
                Ôn thi với các bài học có cấu trúc,
                bài kiểm tra có hướng dẫn, và theo dõi tiến độ thực tế.
              </p>
            </div>
          </div>

          <form className="space-y-4 kokonut-enter" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label className="text-foreground/90" htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-10 rounded-xl border-primary/20 bg-white/70 shadow-sm transition-all duration-300 focus-visible:border-accent/70 focus-visible:ring-2 focus-visible:ring-primary/55 focus-visible:ring-offset-0 dark:bg-slate-900/70"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground/90" htmlFor="password">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-10 rounded-xl border-primary/20 bg-white/70 shadow-sm transition-all duration-300 focus-visible:border-accent/70 focus-visible:ring-2 focus-visible:ring-primary/55 focus-visible:ring-offset-0 dark:bg-slate-900/70"
                required
              />
            </div>

            {errorMessage ? (
              <p className="rounded-xl border border-destructive/35 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}

            <Button
              className="kokonut-hover-lift h-11 w-full rounded-xl border border-white/20 bg-gradient-to-r from-primary via-blue-700 to-amber-600 text-white shadow-glow-soft transition-all duration-300 hover:brightness-110 hover:shadow-glow-strong"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
