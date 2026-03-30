"use client";

import { ExternalLink, Heart } from "lucide-react";

const PAYPAL_DONATE_URL = "https://paypal.me/Tranmanhnam/2";

type DonationBannerProps = {
  variant?: "card" | "inline";
};

export function DonationBanner({ variant = "card" }: DonationBannerProps) {
  if (variant === "inline") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-amber-200/60 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-rose-50/40 px-5 py-4 shadow-sm dark:border-amber-900/40 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-rose-950/20">
        <p className="text-sm text-amber-900 dark:text-amber-200">
          <Heart className="mr-1.5 inline-block h-4 w-4 text-rose-500" />
          Nếu bài tập giúp ích cho bạn, hãy ủng hộ bọn mình nhé!
        </p>
        <a
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:brightness-110 dark:border-amber-700/60"
          href={PAYPAL_DONATE_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          Ủng hộ 2€ ☕
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  return (
    <section className="kokonut-glass-card kokonut-glow-border overflow-hidden border-primary/15 bg-gradient-to-br from-amber-50/70 via-white/80 to-orange-50/50 p-6 shadow-glass dark:from-amber-950/20 dark:via-slate-900/70 dark:to-orange-950/15 sm:p-8">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
          <Heart className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold tracking-tight">
            Nếu thấy các bài tập do bọn mình soạn hữu ích thì Ủng hộ bọn mình nhé! ☕
          </h3>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Chỉ 2€ thôi sẽ giúp bọn mình có thêm chi phí để soạn bài tập chất lượng và duy trì website, hướng tới
            mục tiêu thi <strong>Abschlussprüfung ngành FK</strong> đạt điểm cao tuyệt đối cho
            các bạn! 💪🎯
          </p>
        </div>
        <div className="shrink-0">
          <a
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-sm font-bold text-white shadow-glow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-strong hover:brightness-110"
            href={PAYPAL_DONATE_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            ỦNG HỘ 2€ QUA PAYPAL ☕
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
