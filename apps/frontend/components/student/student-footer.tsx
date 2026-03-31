import Image from "next/image";
import { Heart, Mail, MessageCircle } from "lucide-react";

export function StudentFooter() {
  return (
    <footer className="mt-auto w-full border-t border-slate-200/60 bg-white/40 backdrop-blur-[12px] dark:border-slate-800/60 dark:bg-slate-950/40">
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
                  className="rounded-full object-cover ring-2 ring-slate-200/60 shadow-md dark:ring-slate-700/60"
                />
                {/* Online Status Dot */}
                <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                </span>
              </div>

              <div>
                <h4 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
                  Bạn Cần Hỗ Trợ 1-Kèm-1?
                  <Heart className="h-5 w-5 animate-pulse fill-rose-500/20 text-rose-500" />
                </h4>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Jason • Sẵn sàng hỗ trợ
                </p>
              </div>
            </div>

            <p className="max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
              Mình là Jason. Nhận kèm học 1 kèm 1 chuyên sâu để giúp bạn đạt điểm
              tuyệt đối bài thi Abschlussprüfung ngành FK. Hãy liên hệ ngay để
              bắt đầu!
            </p>
          </div>

          {/* Cột phải: Thông tin liên hệ */}
          <div className="flex w-full flex-col items-center justify-end gap-3 sm:flex-row md:w-1/2">
            <a
              href="https://wa.me/4915758084635"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-12 w-full max-w-xs items-center justify-center gap-2.5 overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 sm:w-fit hover:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 ease-out group-hover:translate-x-[100%]"></div>
              <MessageCircle className="h-5 w-5 text-emerald-600 transition-transform group-hover:scale-110 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                +49 15758084635
              </span>
            </a>

            <a
              href="mailto:bonziet@gmail.com"
              className="group relative flex h-12 w-full max-w-xs items-center justify-center gap-2.5 overflow-hidden rounded-xl border border-blue-500/30 bg-blue-500/10 px-6 sm:w-fit hover:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 ease-out group-hover:translate-x-[100%]"></div>
              <Mail className="h-5 w-5 text-blue-600 transition-transform group-hover:scale-110 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                bonziet@gmail.com
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
