"use client";

import { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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
    <Card className="border-border/70 shadow-lg">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Sign in
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Access your Azubi learning dashboard.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {errorMessage ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          <Button className="w-full" disabled={isSubmitting} type="submit">
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
      </CardContent>
    </Card>
  );
}
