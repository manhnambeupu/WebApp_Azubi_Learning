"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function NetworkStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      const response = await fetch("/api/health", {
        method: "HEAD",
        cache: "no-store",
      });

      if (response.ok) {
        setIsOffline(false);
      }
    } catch {
      setIsOffline(true);
    } finally {
      setIsChecking(false);
    }
  };

  if (!isOffline) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-[9999] flex items-center justify-center gap-3 bg-amber-400 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-lg"
      role="alert"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>Mất kết nối mạng — Dữ liệu bài làm của bạn vẫn được giữ nguyên.</span>
      <button
        className="ml-2 inline-flex items-center gap-1 rounded-md bg-amber-700/90 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-amber-800 disabled:opacity-50"
        disabled={isChecking}
        onClick={() => {
          void handleRetry();
        }}
        type="button"
      >
        <RefreshCw className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`} />
        {isChecking ? "Đang kiểm tra..." : "Kiểm tra lại"}
      </button>
    </div>
  );
}
