"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function LingoThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="w-12 h-12 rounded-full border-2 border-[var(--lingo-border)] border-b-4 opacity-50 bg-[var(--lingo-surface)]"></div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-[var(--lingo-border)] border-b-4 bg-[var(--lingo-surface)] text-[var(--lingo-text)] transition-all hover:-translate-y-1 hover:border-b-[#58cc02] active:translate-y-1 active:border-b-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lingo-primary)] z-50 shadow-sm"
      style={{
        borderBottomColor: isDark ? "var(--lingo-primary-dark)" : "hsl(0 0% 85%)",
      }}
    >
      {isDark ? (
        <Sun className="h-6 w-6 text-[var(--lingo-warning)]" />
      ) : (
        <Moon className="h-6 w-6 text-[#ce82ff]" />
      )}
    </button>
  );
}
