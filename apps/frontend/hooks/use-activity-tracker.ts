"use client";

import { useEffect, useRef } from "react";
import { endSession, sendHeartbeat, startSession } from "@/lib/analytics-api";

type UseActivityTrackerOptions = {
  lessonId: string;
  sessionType: "LESSON_VIEW" | "QUIZ_ATTEMPT";
  enabled?: boolean;
};

export function useActivityTracker({
  lessonId,
  sessionType,
  enabled = true,
}: UseActivityTrackerOptions) {
  const sessionIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !lessonId) {
      return;
    }

    let isMounted = true;

    const start = async () => {
      try {
        const { sessionId } = await startSession({ lessonId, sessionType });
        if (!isMounted) {
          return;
        }

        sessionIdRef.current = sessionId;
        intervalRef.current = setInterval(async () => {
          if (!sessionIdRef.current) {
            return;
          }

          try {
            await sendHeartbeat(sessionIdRef.current);
          } catch {
            // Ignore heartbeat errors to avoid console spam and keep UX smooth.
          }
        }, 30_000);
      } catch {
        // Ignore session start errors; tracking should not block page usage.
      }
    };

    void start();

    const handleBeforeUnload = () => {
      if (!sessionIdRef.current) {
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      navigator.sendBeacon(
        `${baseUrl}/student/analytics/session/end`,
        new Blob([JSON.stringify({ sessionId: sessionIdRef.current })], {
          type: "application/json",
        }),
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      isMounted = false;
      window.removeEventListener("beforeunload", handleBeforeUnload);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (!sessionIdRef.current) {
        return;
      }

      void endSession(sessionIdRef.current);
      sessionIdRef.current = null;
    };
  }, [enabled, lessonId, sessionType]);
}
