"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type CountdownTimerProps = {
  timeLimitMinutes: number;
  onTimeUp: () => void;
};

export function CountdownTimer({ timeLimitMinutes, onTimeUp }: CountdownTimerProps) {
  // Use a static end time to calculate remaining time
  const [endTime] = useState(() => Date.now() + timeLimitMinutes * 60000);
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, endTime - Date.now()));

  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 1000);

    // React Doctor best practice: Always cleanup interval
    return () => clearInterval(interval);
  }, [endTime, onTimeUp, timeLeft]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const isUrgent = timeLeft < 60000; // Less than 1 minute

  if (timeLeft <= 0) {
    return (
      <div className="sticky top-0 z-40 mb-6 flex items-center justify-center rounded-2xl border-b-4 border-[#e03838] bg-[#ffebee] p-3 text-sm font-extrabold text-[#ff4b4b]">
        <Clock className="mr-2 h-5 w-5" />
        Hết giờ làm bài!
      </div>
    );
  }

  return (
    <div
      className={cn(
        "sticky top-0 z-40 mb-6 flex items-center justify-center rounded-2xl border-b-4 p-3 text-sm font-extrabold transition-colors duration-300",
        isUrgent
          ? "border-[#e03838] bg-[#ffebee] text-[#ff4b4b] animate-pulse"
          : "border-[#e5e5e5] bg-white text-[#3c3c3c] dark:border-[#2b3940] dark:bg-[#131f24] dark:text-white"
      )}
    >
      <Clock className="mr-2 h-5 w-5" />
      Thời gian còn lại: {minutes.toString().padStart(2, "0")}:
      {seconds.toString().padStart(2, "0")}
    </div>
  );
}