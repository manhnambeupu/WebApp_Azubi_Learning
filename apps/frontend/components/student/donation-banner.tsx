"use client";

import { ExternalLink, Heart } from "lucide-react";

const PAYPAL_DONATE_URL = "https://paypal.me/Tranmanhnam/2";

type DonationBannerProps = {
  variant?: "card" | "inline";
};

export function DonationBanner({ variant = "card" }: DonationBannerProps) {
  if (variant === "inline") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border-2 border-[#ffc800]/40 border-b-4 border-b-[#e6b400] bg-[#fef9e7] p-4 text-[#3c3c3c] dark:border-[#ffc800]/30 dark:bg-[#ffc800]/10 dark:text-white">
        <p className="text-xs md:text-sm font-bold">
          <Heart className="mr-1.5 inline-block h-4 w-4 fill-rose-500 text-rose-500" />
          Nếu bài tập giúp ích cho bạn, hãy ủng hộ bọn mình nhé!
        </p>
        <a
          className="inline-flex items-center gap-1.5 rounded-xl border-b-4 border-[#e6b400] bg-[#ffc800] px-4 py-1.5 text-xs font-extrabold text-[#3c3c3c] shadow-sm transition-all hover:bg-[#e6b400] active:translate-y-0.5 active:border-b-2"
          href={PAYPAL_DONATE_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          Ủng hộ ☕
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  return (
    <section className="rounded-[24px] border-2 border-[#ffc800]/40 border-b-4 border-b-[#e6b400] bg-[#fef9e7] p-6 shadow-sm dark:border-[#ffc800]/30 dark:bg-[#ffc800]/10 sm:p-8">
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#e6b400] border-b-4 border-b-[#cc9e00] bg-[#ffc800] text-[#3c3c3c] shadow-sm">
          <Heart className="h-7 w-7 fill-[#3c3c3c]" />
        </div>
        <div className="flex-1 space-y-1.5">
          <h3 className="text-base md:text-lg font-extrabold text-[#3c3c3c] dark:text-white">
            Nếu thấy các bài tập do bọn mình soạn hữu ích thì Ủng hộ bọn mình nhé! ☕
          </h3>
          <p className="text-xs md:text-sm font-bold leading-relaxed text-[#777777] dark:text-slate-300">
            Sẽ giúp bọn mình có thêm chi phí để soạn bài tập chất lượng và duy trì website, hướng tới
            mục tiêu thi <strong>Abschlussprüfung Fachkraft für Gastronomie</strong> đạt điểm cao cho các bạn! 💪🎯
          </p>
        </div>
        <div className="shrink-0">
          <a
            className="inline-flex items-center gap-2 rounded-2xl border-b-4 border-[#e6b400] bg-[#ffc800] px-6 py-3 text-xs md:text-sm font-extrabold text-[#3c3c3c] shadow-sm transition-all hover:bg-[#e6b400] active:translate-y-0.5 active:border-b-2"
            href={PAYPAL_DONATE_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            ỦNG HỘ QUA PAYPAL ☕
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
