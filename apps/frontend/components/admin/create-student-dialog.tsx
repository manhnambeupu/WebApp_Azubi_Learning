"use client";

import { Loader2, PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateStudent } from "@/hooks/use-students";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

type FieldErrors = {
  email?: string;
  fullName?: string;
  password?: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CreateStudentDialogProps = {
  triggerClassName?: string;
};

export function CreateStudentDialog({ triggerClassName }: CreateStudentDialogProps) {
  const { toast } = useToast();
  const createStudentMutation = useCreateStudent();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const isSubmitting = createStudentMutation.isPending;

  const canSubmit = useMemo(
    () => email.trim().length > 0 && fullName.trim().length > 0 && password.length > 0,
    [email, fullName, password],
  );

  const resetState = () => {
    setEmail("");
    setFullName("");
    setPassword("");
    setFieldErrors({});
    setApiError(null);
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    const normalizedEmail = email.trim();
    const normalizedFullName = fullName.trim();

    if (!emailRegex.test(normalizedEmail)) {
      errors.email = "Email không hợp lệ.";
    }

    if (normalizedFullName.length < 2) {
      errors.fullName = "Họ tên phải có ít nhất 2 ký tự.";
    }

    if (password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    try {
      await createStudentMutation.mutateAsync({
        email: email.trim(),
        fullName: fullName.trim(),
        password,
      });
      toast({
        title: "Tạo học viên thành công",
        description: "Tài khoản học viên mới đã được tạo.",
      });
      setOpen(false);
      resetState();
    } catch (error) {
      const message = getApiErrorMessage(error);
      setApiError(message);
      toast({
        title: "Không thể tạo học viên",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetState();
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button className={cn(triggerClassName)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm học viên
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[24px] border-2 border-[#e5e5e5] bg-white p-6 shadow-2xl dark:border-[#2b3940] dark:bg-[#131f24]">
        <DialogHeader className="border-b-2 border-[#e5e5e5] pb-4 dark:border-[#2b3940]">
          <DialogTitle className="text-xl font-extrabold text-[#3c3c3c] dark:text-white">
            Tạo học viên mới
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-[#777777] dark:text-slate-400">
            Nhập thông tin tài khoản để thêm học viên vào hệ thống.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 pt-2" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300" htmlFor="student-email">
              Email
            </Label>
            <Input
              className="h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-bold text-[#3c3c3c] placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white"
              id="student-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@azubi.de"
              type="email"
              value={email}
            />
            {fieldErrors.email ? (
              <p className="text-xs font-extrabold text-[#ff4b4b]">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300" htmlFor="student-full-name">
              Họ tên
            </Label>
            <Input
              className="h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-bold text-[#3c3c3c] placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white"
              id="student-full-name"
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Nguyễn Văn A"
              value={fullName}
            />
            {fieldErrors.fullName ? (
              <p className="text-xs font-extrabold text-[#ff4b4b]">{fieldErrors.fullName}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300" htmlFor="student-password">
              Mật khẩu
            </Label>
            <Input
              className="h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-bold text-[#3c3c3c] placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white"
              id="student-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              type="password"
              value={password}
            />
            {fieldErrors.password ? (
              <p className="text-xs font-extrabold text-[#ff4b4b]">{fieldErrors.password}</p>
            ) : null}
          </div>

          {apiError ? (
            <p className="rounded-xl border-2 border-[#ff4b4b]/40 bg-[#ffebee] p-3 text-xs font-extrabold text-[#ff4b4b] dark:bg-[#ff4b4b]/15">
              {apiError}
            </p>
          ) : null}

          <DialogFooter className="mt-6 gap-2">
            <Button
              className="h-11 rounded-2xl border-b-4 border-[#46a302] bg-[#58cc02] px-6 text-sm font-extrabold text-white transition-all hover:bg-[#46a302] active:translate-y-0.5 active:border-b-2 disabled:opacity-50"
              disabled={!canSubmit || isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo tài khoản"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
