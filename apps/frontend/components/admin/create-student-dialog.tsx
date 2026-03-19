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
        <Button className={cn("rounded-full", triggerClassName)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm học viên
        </Button>
      </DialogTrigger>
      <DialogContent className="border-primary/15 bg-white/85 shadow-glass backdrop-blur-xl data-[state=open]:animate-slide-up">
        <DialogHeader>
          <DialogTitle>Tạo học viên mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin tài khoản để thêm học viên vào hệ thống.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="student-email">Email</Label>
            <Input
              className="border-primary/20 bg-white/85"
              id="student-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@azubi.de"
              type="email"
              value={email}
            />
            {fieldErrors.email ? (
              <p className="text-xs text-destructive">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-full-name">Họ tên</Label>
            <Input
              className="border-primary/20 bg-white/85"
              id="student-full-name"
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Nguyễn Văn A"
              value={fullName}
            />
            {fieldErrors.fullName ? (
              <p className="text-xs text-destructive">{fieldErrors.fullName}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-password">Mật khẩu</Label>
            <Input
              className="border-primary/20 bg-white/85"
              id="student-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              type="password"
              value={password}
            />
            {fieldErrors.password ? (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            ) : null}
          </div>

          {apiError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {apiError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              className="rounded-full border border-white/30 bg-gradient-to-r from-primary to-amber-600 text-slate-950 shadow-glow-soft transition-all duration-300 hover:brightness-110"
              disabled={!canSubmit || isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo học viên"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
