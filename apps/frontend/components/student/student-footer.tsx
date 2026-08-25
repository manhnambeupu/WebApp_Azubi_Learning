import Image from "next/image";
import { Heart, Mail, MessageCircle } from "lucide-react";

export function StudentFooter() {
  return (
    <footer className="mt-auto w-full border-t-2 border-[#e5e5e5] bg-white text-[#3c3c3c] dark:border-[#2b3940] dark:bg-[#131f24] dark:text-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-start">
          {/* Cột trái: Avatar + Nhắn nhủ */}
          <div className="flex w-full flex-col items-center text-center md:w-1/2 md:items-start md:text-left">
            <div className="mb-3 flex items-center gap-4">
              {/* Avatar with Online Status Dot */}
              <div className="relative flex-shrink-0">
                <Image
                  src="/images/avatar.jpg"
                  alt="Jason - Giảng viên kèm học 1-1"
                  width={56}
                  height={56}
                  className="rounded-full object-cover ring-4 ring-[#e8f5e1] border-2 border-[#58cc02] dark:ring-[#58cc02]/20"
                />
                {/* Online Status Dot */}
                <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-white bg-[#58cc02] dark:border-slate-900">
                </span>
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-base font-extrabold tracking-tight text-[#3c3c3c] dark:text-white">
                  Bạn Cần Hỗ Trợ Kèm 1-1?
                  <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
                </h4>
                <p className="text-xs font-extrabold text-[#46a302] dark:text-[#58cc02]">
                  Jason • Sẵn sàng hỗ trợ
                </p>
              </div>
            </div>

            <p className="max-w-md text-xs font-bold leading-relaxed text-[#777777] dark:text-slate-400">
              Nhận gia sư dạy học kèm 1-1 nghành Fachkraft für Gastronomie. Hãy liên hệ ngay để bắt đầu! ❤️
            </p>
          </div>

          {/* Cột phải: Thông tin liên hệ */}
          <div className="flex w-full flex-col items-center justify-end gap-3 sm:flex-row md:w-1/2">
            <a
              href="https://wa.me/4915758084635"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 w-full max-w-xs items-center justify-center gap-2.5 rounded-2xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-[#f7f7f7] px-5 text-xs font-extrabold text-[#3c3c3c] transition-all hover:border-[#58cc02] active:translate-y-0.5 active:border-b-2 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#18252d] dark:text-white sm:w-fit"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f5e1] text-[#46a302]">
                <MessageCircle className="h-4 w-4" />
              </div>
              <span>+49 15758084635</span>
            </a>

            <a
              href="mailto:jasonluong@azubivn.de"
              className="flex h-12 w-full max-w-xs items-center justify-center gap-2.5 rounded-2xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-[#f7f7f7] px-5 text-xs font-extrabold text-[#3c3c3c] transition-all hover:border-[#58cc02] active:translate-y-0.5 active:border-b-2 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#18252d] dark:text-white sm:w-fit"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e0f2fe] text-[#0284c7]">
                <Mail className="h-4 w-4" />
              </div>
              <span>jasonluong@azubivn.de</span>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t-2 border-[#e5e5e5] dark:border-[#2b3940]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 py-4 px-4 text-xs font-bold text-[#777777] dark:text-slate-400 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Azubi Learning Portal. Alle Rechte vorbehalten.</p>
          <div className="flex items-center gap-4">
            <a href="/impressum" className="hover:text-[#58cc02] hover:underline">Impressum</a>
            <span>•</span>
            <a href="/datenschutz" className="hover:text-[#58cc02] hover:underline">Datenschutz</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
