"use client";

import { Loader2, Mail, Send, Users } from "lucide-react";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useSendBulkEmail } from "@/hooks/use-emails";
import { useGetStudents } from "@/hooks/use-students";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";

const parseCustomEmails = (value: string): string[] => {
  const unique = new Set<string>();
  for (const token of value.split(/[\n,;]+/)) {
    const email = token.trim().toLowerCase();
    if (!email) {
      continue;
    }
    unique.add(email);
  }
  return Array.from(unique);
};

export default function AdminEmailsPage() {
  const { toast } = useToast();
  const studentsQuery = useGetStudents();
  const sendBulkEmailMutation = useSendBulkEmail();

  const [subject, setSubject] = useState("");
  const [markdownContent, setMarkdownContent] = useState("");
  const [targetMode, setTargetMode] = useState<"ALL" | "CUSTOM">("ALL");
  const [customEmailsInput, setCustomEmailsInput] = useState("");

  const customEmails = useMemo(
    () => parseCustomEmails(customEmailsInput),
    [customEmailsInput],
  );
  const studentCount = studentsQuery.data?.length ?? 0;

  const canSend =
    subject.trim().length > 0 &&
    markdownContent.trim().length > 0 &&
    (targetMode === "ALL" || customEmails.length > 0) &&
    !sendBulkEmailMutation.isPending;

  const handleSend = async () => {
    if (targetMode === "CUSTOM" && customEmails.length === 0) {
      toast({
        title: "Thiếu email người nhận",
        description: "Vui lòng nhập ít nhất một email hợp lệ.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await sendBulkEmailMutation.mutateAsync({
        subject: subject.trim(),
        markdownContent: markdownContent.trim(),
        targetEmails: targetMode === "ALL" ? "ALL" : customEmails,
      });

      toast({
        title: "Đã nhận yêu cầu gửi email",
        description:
          result.message ||
          `Hệ thống đang gửi email cho ${result.totalRecipients} người. Bạn có thể đóng trang này.`,
      });
    } catch (error) {
      toast({
        title: "Không thể gửi email",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
        <div className="flex flex-col gap-2 border-b-2 border-[#e5e5e5] pb-6 dark:border-[#2b3940]">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-[#58cc02]/30 bg-[#e8f5e1] px-3 py-1 text-xs font-extrabold text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]">
            <Mail className="h-3.5 w-3.5" />
            Bulk Email
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#3c3c3c] dark:text-white sm:text-3xl">
            Gửi email hàng loạt
          </h1>
          <p className="text-xs md:text-sm font-bold text-[#777777] dark:text-slate-400">
            Soạn nội dung bằng Markdown, xem trước và gửi thông báo trực tiếp tới học viên.
          </p>
        </div>

        <div className="grid gap-6 pt-6 lg:grid-cols-2">
          {/* Form Area */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300" htmlFor="email-subject">
                Tiêu đề email
              </Label>
              <Input
                className="h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-bold text-[#3c3c3c] placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white"
                id="email-subject"
                maxLength={200}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Ví dụ: Thông báo lịch học tuần này"
                value={subject}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300" htmlFor="email-content">
                Nội dung (Markdown)
              </Label>
              <Textarea
                className="min-h-[260px] rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] p-3 font-mono text-sm font-bold text-[#3c3c3c] placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white"
                id="email-content"
                onChange={(event) => setMarkdownContent(event.target.value)}
                placeholder="## Xin chào các bạn&#10;&#10;Nội dung thông báo..."
                value={markdownContent}
              />
            </div>

            <div className="space-y-3 rounded-2xl border-2 border-[#e5e5e5] bg-[#f7f7f7] p-4 dark:border-[#2b3940] dark:bg-[#111b21]">
              <Label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300">
                Người nhận
              </Label>
              <RadioGroup
                className="gap-2.5"
                onValueChange={(value) => setTargetMode(value as "ALL" | "CUSTOM")}
                value={targetMode}
              >
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border-2 border-[#e5e5e5] bg-white p-3 font-bold text-[#3c3c3c] transition-all hover:border-[#58cc02] dark:border-[#2b3940] dark:bg-[#131f24] dark:text-white">
                  <RadioGroupItem id="target-all" value="ALL" />
                  <span className="text-xs md:text-sm">Tất cả học viên ({studentCount} người)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border-2 border-[#e5e5e5] bg-white p-3 font-bold text-[#3c3c3c] transition-all hover:border-[#58cc02] dark:border-[#2b3940] dark:bg-[#131f24] dark:text-white">
                  <RadioGroupItem id="target-custom" value="CUSTOM" />
                  <span className="text-xs md:text-sm">Email cụ thể (chọn lọc/kiểm thử)</span>
                </label>
              </RadioGroup>

              {targetMode === "CUSTOM" ? (
                <div className="space-y-1.5 pt-2">
                  <Textarea
                    className="min-h-[100px] rounded-xl border-2 border-[#e5e5e5] bg-white p-3 text-xs font-bold text-[#3c3c3c] placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#131f24] dark:text-white"
                    onChange={(event) => setCustomEmailsInput(event.target.value)}
                    placeholder="student1@example.com, student2@example.com"
                    value={customEmailsInput}
                  />
                  <p className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
                    Phân tách email bằng dấu phẩy, chấm phẩy hoặc xuống dòng.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Badge className="rounded-full border-2 border-[#58cc02]/30 bg-[#e8f5e1] px-3 py-1 text-xs font-extrabold text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]" variant="outline">
                <Users className="mr-1.5 h-3.5 w-3.5" />
                {targetMode === "ALL"
                  ? `Gửi cho ${studentCount} học viên`
                  : `${customEmails.length} email đã nhập`}
              </Badge>

              <Button
                className="h-12 rounded-2xl border-b-4 border-[#46a302] bg-[#58cc02] px-6 text-sm font-extrabold text-white transition-all hover:bg-[#46a302] active:translate-y-0.5 active:border-b-2 disabled:opacity-50"
                disabled={!canSend}
                onClick={() => {
                  void handleSend();
                }}
              >
                {sendBulkEmailMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Gửi email
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex flex-col rounded-2xl border-2 border-[#e5e5e5] bg-[#f7f7f7] p-5 dark:border-[#2b3940] dark:bg-[#111b21]">
            <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
              Xem trước nội dung
            </h3>
            <div className="flex-1 rounded-xl border-2 border-[#e5e5e5] bg-white p-5 dark:border-[#2b3940] dark:bg-[#131f24]">
              {markdownContent.trim().length > 0 ? (
                <div className="prose prose-sm max-w-none text-[#3c3c3c] dark:prose-invert dark:text-white">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownContent}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex h-full min-h-[240px] items-center justify-center text-center text-xs font-bold text-[#a0a0a0] dark:text-slate-500">
                  Nội dung email xem trước sẽ xuất hiện tại đây khi bạn nhập markdown.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
