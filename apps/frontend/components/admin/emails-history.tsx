"use client";

import { useEmailsHistory, useClearEmailsHistory } from "@/hooks/use-emails-history";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

export function EmailsHistory() {
  const { data, isLoading } = useEmailsHistory();
  const { mutate: clearHistory, isPending: isClearing } = useClearEmailsHistory();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
        <Loader2 className="h-6 w-6 animate-spin text-[#58cc02]" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="mt-8 flex items-center justify-between">
        <h3 className="text-xl font-extrabold text-[#3c3c3c] dark:text-white">
          Lịch sử gửi (50 lần gửi gần nhất)
        </h3>
        <Button
          variant="outline"
          onClick={() => {
            if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử gửi email không?")) {
              clearHistory();
            }
          }}
          disabled={isClearing}
          className="rounded-xl border-2 border-[#ff4b4b]/30 bg-[#ffebee] text-sm font-bold text-[#ff4b4b] hover:bg-[#ff4b4b]/20 dark:bg-[#ff4b4b]/10"
        >
          {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Xóa lịch sử
        </Button>
      </div>
      {data.map((campaign: any) => {
        const successCount = campaign._count?.logs || 0;
        const total = campaign.totalRecipients;
        const hasErrors = campaign.logs && campaign.logs.length > 0;
        
        // Neu chua xong ma chua co loi thi dang processing
        const isProcessing = successCount < total && !hasErrors;

        return (
          <div
            key={campaign.id}
            className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-5 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]"
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-[#3c3c3c] dark:text-white">
                {campaign.subject}
              </h4>
              <span suppressHydrationWarning className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
                {new Date(campaign.createdAt).toLocaleString("de-DE")}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="secondary" className="bg-[#f0f0f0] text-[#3c3c3c] hover:bg-[#f0f0f0] border-none dark:bg-[#18252d] dark:text-slate-300">
                Tổng: {total}
              </Badge>
              <Badge className="bg-[#58cc02] text-white hover:bg-[#58cc02] border-none">
                Thành công: {successCount}
              </Badge>
              
              {hasErrors && (
                <Badge className="bg-[#ff4b4b] text-white hover:bg-[#ff4b4b] border-none">
                  Lỗi: {campaign.logs.length}
                </Badge>
              )}

              {isProcessing && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#58cc02]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Đang xử lý...
                </span>
              )}
            </div>

            {hasErrors && (
              <div className="mt-4 rounded-xl border-2 border-[#ff4b4b]/40 bg-[#ffebee] p-3 dark:border-[#ff4b4b]/30 dark:bg-[#ff4b4b]/10">
                <p className="mb-2 text-xs font-extrabold text-[#ff4b4b]">Chi tiết lỗi:</p>
                <ul className="space-y-1.5 text-[11px] font-bold text-[#ff4b4b]/80 dark:text-[#ff4b4b]/90">
                  {campaign.logs.map((log: any) => (
                    <li key={log.email} className="break-words">
                      <strong className="text-[#ff4b4b] dark:text-[#ff4b4b]">{log.email}</strong>: {log.errorReason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}