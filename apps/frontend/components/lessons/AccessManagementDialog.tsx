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
          className="rounded-full border-primary/25 bg-white/90 hover:border-primary/40 hover:bg-white dark:bg-slate-950/90 dark:hover:bg-slate-950"
          size="sm"
          variant="outline"
        >
          <ShieldCheck className="mr-2 h-4 w-4" />
          Quản lý quyền
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl border-primary/15 bg-white/90 shadow-glass backdrop-blur-xl dark:bg-slate-950/90">
        <DialogHeader>
          <DialogTitle>Quản lý quyền truy cập bài học</DialogTitle>
          <DialogDescription>
            Thêm hoặc thu hồi học viên được phép xem bài học riêng tư này.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-2" onSubmit={handleGrantAccess}>
          <Label htmlFor={`grant-access-email-${lessonId}`}>Nhập Email học viên...</Label>
          <div className="flex gap-2">
            <Input
              className="border-primary/20 bg-white/85 dark:bg-slate-900/85"
              id={`grant-access-email-${lessonId}`}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@example.com"
              value={email}
            />
            <Button disabled={grantAccessMutation.isPending} type="submit">
              {grantAccessMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              THÊM
            </Button>
          </div>
        </form>

        {accessListQuery.isError ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {getApiErrorMessage(accessListQuery.error)}
          </p>
        ) : null}

        <div className="max-h-[360px] overflow-auto rounded-xl border border-primary/15">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead>Email</TableHead>
                <TableHead>Họ Tên</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accessListQuery.isLoading ? (
                <TableRow>
                  <TableCell className="py-6 text-center text-muted-foreground" colSpan={3}>
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải danh sách quyền...
                    </span>
                  </TableCell>
                </TableRow>
              ) : (accessListQuery.data ?? []).length === 0 ? (
                <TableRow>
                  <TableCell className="py-6 text-center text-muted-foreground" colSpan={3}>
                    Chưa có học viên nào được cấp quyền.
                  </TableCell>
                </TableRow>
              ) : (
                (accessListQuery.data ?? []).map((access) => (
                  <TableRow key={access.id}>
                    <TableCell>{access.user.email}</TableCell>
                    <TableCell>{access.user.fullName}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        disabled={pendingDeleteUserId === access.userId}
                        onClick={() => {
                          void handleRevokeAccess(access.userId);
                        }}
                        size="sm"
                        variant="destructive"
                      >
                        {pendingDeleteUserId === access.userId ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
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
