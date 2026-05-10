"use client";

import { Loader2, Mail, Send, Users } from "lucide-react";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <section className="space-y-6 kokonut-fade">
      <Card className="kokonut-glass-card kokonut-glow-border border-primary/15 bg-white/70 shadow-glass dark:bg-slate-900/70">
        <CardHeader className="space-y-2 border-b border-primary/15 bg-gradient-to-r from-primary/5 via-background to-accent/10">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium">
            <Mail className="h-3.5 w-3.5 text-primary" />
            Bulk Email
          </div>
          <CardTitle className="text-2xl">Gửi email hàng loạt</CardTitle>
          <CardDescription>
            Soạn nội dung bằng Markdown, preview trực tiếp và gửi tới toàn bộ học viên hoặc danh
            sách email cụ thể.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6 p-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Tiêu đề email</Label>
              <Input
                id="email-subject"
                maxLength={200}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Ví dụ: Thông báo lịch học tuần này"
                value={subject}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-content">Nội dung (Markdown)</Label>
              <Textarea
                className="min-h-[280px] bg-white/60 font-mono text-sm dark:bg-slate-900/60"
                id="email-content"
                onChange={(event) => setMarkdownContent(event.target.value)}
                placeholder="## Xin chào các bạn&#10;&#10;Nội dung thông báo..."
                value={markdownContent}
              />
            </div>

            <div className="space-y-3 rounded-xl border border-primary/15 bg-primary/[0.03] p-4">
              <Label>Người nhận</Label>
              <RadioGroup
                className="gap-3"
                onValueChange={(value) => setTargetMode(value as "ALL" | "CUSTOM")}
                value={targetMode}
              >
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1 hover:border-primary/20">
                  <RadioGroupItem id="target-all" value="ALL" />
                  <span className="text-sm">Tất cả học viên ({studentCount})</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1 hover:border-primary/20">
                  <RadioGroupItem id="target-custom" value="CUSTOM" />
                  <span className="text-sm">Email cụ thể (test/chọn lọc)</span>
                </label>
              </RadioGroup>

              {targetMode === "CUSTOM" ? (
                <div className="space-y-2">
                  <Textarea
                    className="min-h-[110px] bg-white/60 text-sm dark:bg-slate-900/60"
                    onChange={(event) => setCustomEmailsInput(event.target.value)}
                    placeholder="student1@example.com, student2@example.com"
                    value={customEmailsInput}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tách email bằng dấu phẩy, chấm phẩy hoặc xuống dòng.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between">
              <Badge className="inline-flex items-center gap-1" variant="outline">
                <Users className="h-3.5 w-3.5" />
                {targetMode === "ALL"
                  ? `Gửi cho ${studentCount} học viên`
                  : `${customEmails.length} email đã nhập`}
              </Badge>
              <Button
                className="min-w-[150px]"
                disabled={!canSend}
                onClick={() => {
                  void handleSend();
                }}
              >
                {sendBulkEmailMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo lệnh...
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

          <div className="rounded-xl border border-primary/15 bg-white/75 p-4 shadow-glass dark:bg-slate-900/75">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Preview email
            </h3>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {markdownContent.trim().length > 0 ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownContent}</ReactMarkdown>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nội dung preview sẽ hiển thị ở đây khi bạn bắt đầu soạn email.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
