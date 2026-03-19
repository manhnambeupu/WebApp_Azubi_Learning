"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth-store";

type InactivityProviderProps = {
  children: React.ReactNode;
};

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousemove",
  "keydown",
  "scroll",
  "click",
];

export function InactivityProvider({ children }: InactivityProviderProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/login") {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const resetInactivityTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        useAuthStore.getState().clearAuth();
        toast({
          title: "Phiên đăng nhập đã hết hạn do không hoạt động",
          variant: "destructive",
        });
        window.location.replace("/login");
      }, INACTIVITY_TIMEOUT_MS);
    };

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimeout, { passive: true });
    });
    resetInactivityTimeout();

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimeout);
      });
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [pathname]);

  return <>{children}</>;
}
