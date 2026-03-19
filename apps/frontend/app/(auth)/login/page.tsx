"use client";

import { AxiosError } from "axios";
import { BookOpenText, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
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
    <main className="relative z-10 w-full overflow-hidden flex flex-col md:flex-row shadow-2xl rounded-[2rem] bg-white/40 backdrop-blur-[16px] border border-white/30">
      {/* BEGIN: Sidebar Section */}
      <section className="w-full md:w-5/12 p-8 md:p-12 text-white bg-black/30 backdrop-blur-[8px] border-r border-white/10 flex flex-col items-center justify-center text-center">
        <div className="relative w-full max-w-[280px] sm:max-w-[300px] md:max-w-[320px] aspect-square animate-in fade-in zoom-in duration-1000">
          <Image
            src="/images/Logo_Book.png"
            alt="Azubi Learning Logo"
            fill
            className="object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            priority
          />
        </div>
      </section>
      {/* END: Sidebar Section */}

      {/* BEGIN: Form Section */}
      <section className="w-full md:w-7/12 p-8 md:p-12 flex flex-col items-center">
        {/* Learning Portal Badge */}
        <div className="inline-flex items-center gap-2 bg-white/50 px-4 py-1.5 rounded-full text-sm font-medium text-gray-800 mb-6 backdrop-blur-sm border border-white/40 shadow-sm">
          <BookOpenText className="h-4 w-4" />
          <span>E-Learning-Plattform</span>
        </div>
        
        {/* Sign In Header */}
        <div className="text-center mb-8 w-full">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Anmeldung</h2>
          <p className="text-gray-700 text-sm">Zugang zum Lernportal für Auszubildende</p>
        </div>

        {/* Login Form */}
        <form className="w-full max-w-sm space-y-5" onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="space-y-1">
            <Label className="block text-sm font-medium text-gray-800" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-3 h-12 rounded-lg bg-[#FDF6E3] border border-gray-300/50 text-gray-900 focus:ring-2 focus:ring-primary shadow-sm transition-all duration-200"
              required
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <Label className="block text-sm font-medium text-gray-800" htmlFor="password">
              Passwort
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-4 py-3 h-12 rounded-lg bg-[#FDF6E3] border border-gray-300/50 text-gray-900 focus:ring-2 focus:ring-primary shadow-sm transition-all duration-200"
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
        </form>
      </section>
      {/* END: Form Section */}
    </main>
  );
}
