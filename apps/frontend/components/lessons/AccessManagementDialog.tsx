"use client";

import { Loader2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetLessonAccessList,
  useGrantLessonAccess,
  useRevokeLessonAccess,
} from "@/hooks/use-lessons";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";

type AccessManagementDialogProps = {
  lessonId: string;
};

export function AccessManagementDialog({ lessonId }: AccessManagementDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);

  const accessListQuery = useGetLessonAccessList(open ? lessonId : undefined);
  const grantAccessMutation = useGrantLessonAccess(lessonId);
  const revokeAccessMutation = useRevokeLessonAccess(lessonId);

  const normalizedEmail = useMemo(() => email.trim(), [email]);

  const handleGrantAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!normalizedEmail) {
      toast({
        title: "Email không hợp lệ",
        description: "Vui lòng nhập email học viên trước khi cấp quyền.",
        variant: "destructive",
      });
      return;
    }

    try {
      await grantAccessMutation.mutateAsync(normalizedEmail);
      setEmail("");
      toast({
        title: "Cấp quyền thành công",
      });
    } catch (error) {
      toast({
        title: "Không thể cấp quyền",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    setPendingDeleteUserId(userId);
    try {
      await revokeAccessMutation.mutateAsync(userId);
      toast({
        title: "Đã thu hồi quyền truy cập",
      });
    } catch (error) {
      toast({
        title: "Không thể thu hồi quyền",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setPendingDeleteUserId(null);
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button
          className="h-9 rounded-xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white px-3 text-xs font-extrabold text-[#3c3c3c] hover:border-[#58cc02] hover:text-[#46a302] active:translate-y-0.5 active:border-b-2 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#18252d] dark:text-white"
          size="sm"
          variant="ghost"
        >
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-[#58cc02]" />
          Quản lý quyền
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-[24px] border-2 border-[#e5e5e5] bg-white p-6 shadow-2xl dark:border-[#2b3940] dark:bg-[#131f24]">
        <DialogHeader className="border-b-2 border-[#e5e5e5] pb-4 dark:border-[#2b3940]">
          <DialogTitle className="text-xl font-extrabold text-[#3c3c3c] dark:text-white">
            Quản lý quyền truy cập bài học
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-[#777777] dark:text-slate-400">
            Thêm hoặc thu hồi học viên được phép xem bài học riêng tư này.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-2 pt-2" onSubmit={handleGrantAccess}>
          <Label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300" htmlFor={`grant-access-email-${lessonId}`}>
            Nhập Email học viên...
          </Label>
          <div className="flex gap-2">
            <Input
              className="h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-bold text-[#3c3c3c] placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white"
              id={`grant-access-email-${lessonId}`}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@example.com"
              value={email}
            />
            <Button
              className="h-11 rounded-2xl border-b-4 border-[#46a302] bg-[#58cc02] px-5 text-xs font-extrabold text-white transition-all hover:bg-[#46a302] active:translate-y-0.5 active:border-b-2 disabled:opacity-50"
              disabled={grantAccessMutation.isPending}
              type="submit"
            >
              {grantAccessMutation.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-1.5 h-4 w-4" />
              )}
              THÊM
            </Button>
          </div>
        </form>

        {accessListQuery.isError ? (
          <p className="rounded-2xl border-2 border-[#ff4b4b]/40 bg-[#ffebee] p-3 text-xs font-extrabold text-[#ff4b4b] dark:bg-[#ff4b4b]/15">
            {getApiErrorMessage(accessListQuery.error)}
          </p>
        ) : null}

        <div className="max-h-[360px] overflow-auto rounded-2xl border-2 border-[#e5e5e5] bg-white shadow-sm dark:border-[#2b3940] dark:bg-[#111b21]">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-[#e5e5e5] bg-[#f7f7f7] hover:bg-[#f7f7f7] dark:border-[#2b3940] dark:bg-[#111b21] dark:hover:bg-[#111b21]">
                <TableHead className="h-11 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">Email</TableHead>
                <TableHead className="h-11 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">Họ Tên</TableHead>
                <TableHead className="h-11 px-4 text-right text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accessListQuery.isLoading ? (
                <TableRow>
                  <TableCell className="py-6 text-center text-xs font-bold text-[#777777] dark:text-slate-400" colSpan={3}>
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#58cc02]" />
                      Đang tải danh sách quyền...
                    </span>
                  </TableCell>
                </TableRow>
              ) : (accessListQuery.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell className="py-6 text-center text-xs font-bold text-[#777777] dark:text-slate-400" colSpan={3}>
                    Chưa có học viên nào được cấp quyền.
                  </TableCell>
                </TableRow>
              ) : (
                (accessListQuery.data ?? []).map((access) => (
                  <TableRow className="border-b border-[#e5e5e5] transition-colors hover:bg-[#f7f7f7] dark:border-[#2b3940] dark:hover:bg-[#18252d]" key={access.id}>
                    <TableCell className="px-4 py-3 font-extrabold text-[#3c3c3c] dark:text-white">{access.user.email}</TableCell>
                    <TableCell className="px-4 py-3 font-bold text-[#777777] dark:text-slate-300">{access.user.fullName}</TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Button
                        className="h-8 rounded-xl border-2 border-[#ff4b4b]/30 border-b-4 border-b-[#e03838] bg-[#ffebee] px-3 text-xs font-extrabold text-[#ff4b4b] hover:bg-[#ffdada] active:translate-y-0.5 active:border-b-2 dark:border-[#ff4b4b]/40 dark:border-b-[#ff4b4b]/80 dark:bg-[#ff4b4b]/20"
                        disabled={pendingDeleteUserId === access.userId}
                        onClick={() => {
                          void handleRevokeAccess(access.userId);
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        {pendingDeleteUserId === access.userId ? (
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                        )}
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
