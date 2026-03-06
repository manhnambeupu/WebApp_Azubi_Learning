"use client";

import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCreateQuestion, useUpdateQuestion } from "@/hooks/use-questions";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import type { CreateQuestionPayload, QuestionDetail, UpdateQuestionPayload } from "@/types";

const BR03_MIN_ANSWERS_MESSAGE = "Mỗi câu hỏi phải có ít nhất 2 đáp án.";
const BR03_MIN_CORRECT_MESSAGE = "Phải có ít nhất 1 đáp án đúng.";

let answerKeySeed = 0;

type AnswerFormItem = {
  key: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
};

type QuestionFormDialogProps = {
  lessonId: string;
  initialData?: QuestionDetail;
  trigger?: React.ReactNode;
  triggerVariant?: ButtonProps["variant"];
};

const createEmptyAnswer = (): AnswerFormItem => ({
  key: `answer-${answerKeySeed++}`,
  text: "",
  isCorrect: false,
  explanation: "",
});

const buildInitialAnswers = (question?: QuestionDetail): AnswerFormItem[] => {
  if (question?.answers.length) {
    return question.answers.map((answer) => ({
      key: `answer-${answerKeySeed++}`,
      text: answer.text,
      isCorrect: answer.isCorrect,
      explanation: answer.explanation ?? "",
    }));
  }

  return [createEmptyAnswer(), createEmptyAnswer()];
};

export function QuestionFormDialog({
  lessonId,
  initialData,
  trigger,
  triggerVariant = "default",
}: QuestionFormDialogProps) {
  const { toast } = useToast();
  const createQuestionMutation = useCreateQuestion(lessonId);
  const updateQuestionMutation = useUpdateQuestion(lessonId);

  const [open, setOpen] = useState(false);
  const [questionText, setQuestionText] = useState(initialData?.text ?? "");
  const [questionExplanation, setQuestionExplanation] = useState(
    initialData?.explanation ?? "",
  );
  const [answers, setAnswers] = useState<AnswerFormItem[]>(() =>
    buildInitialAnswers(initialData),
  );
  const [formError, setFormError] = useState<string | null>(null);

  const isEditMode = Boolean(initialData);
  const isSubmitting =
    createQuestionMutation.isPending || updateQuestionMutation.isPending;

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuestionText(initialData?.text ?? "");
    setQuestionExplanation(initialData?.explanation ?? "");
    setAnswers(buildInitialAnswers(initialData));
    setFormError(null);
  }, [initialData, open]);

  const br03Warning = useMemo(() => {
    if (answers.length < 2) {
      return BR03_MIN_ANSWERS_MESSAGE;
    }

    if (!answers.some((answer) => answer.isCorrect)) {
      return BR03_MIN_CORRECT_MESSAGE;
    }

    return null;
  }, [answers]);

  const addAnswer = () => {
    setAnswers((prev) => [...prev, createEmptyAnswer()]);
  };

  const updateAnswer = (
    answerKey: string,
    patch: Partial<Pick<AnswerFormItem, "text" | "isCorrect" | "explanation">>,
  ) => {
    setAnswers((prev) =>
      prev.map((answer) =>
        answer.key === answerKey ? { ...answer, ...patch } : answer,
      ),
    );
  };

  const removeAnswer = (answerKey: string) => {
    if (answers.length <= 2) {
      return;
    }

    setAnswers((prev) => prev.filter((answer) => answer.key !== answerKey));
  };

  const normalizePayload = (): {
    createPayload: CreateQuestionPayload;
    updatePayload: UpdateQuestionPayload;
  } | null => {
    const normalizedQuestionText = questionText.trim();
    if (!normalizedQuestionText) {
      setFormError("Nội dung câu hỏi không được để trống.");
      return null;
    }

    if (answers.length < 2) {
      setFormError(BR03_MIN_ANSWERS_MESSAGE);
      return null;
    }

    if (!answers.some((answer) => answer.isCorrect)) {
      setFormError(BR03_MIN_CORRECT_MESSAGE);
      return null;
    }

    const normalizedAnswers = answers.map((answer) => ({
      text: answer.text.trim(),
      isCorrect: answer.isCorrect,
      explanation: answer.explanation.trim(),
    }));

    if (normalizedAnswers.some((answer) => !answer.text)) {
      setFormError("Nội dung đáp án không được để trống.");
      return null;
    }

    const answerPayload = normalizedAnswers.map((answer) => ({
      text: answer.text,
      isCorrect: answer.isCorrect,
      ...(answer.explanation ? { explanation: answer.explanation } : {}),
    }));

    const basePayload = {
      text: normalizedQuestionText,
      ...(questionExplanation.trim()
        ? { explanation: questionExplanation.trim() }
        : {}),
      answers: answerPayload,
    };

    return {
      createPayload: basePayload,
      updatePayload: basePayload,
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const normalizedPayload = normalizePayload();
    if (!normalizedPayload) {
      return;
    }

    try {
      if (isEditMode && initialData) {
        await updateQuestionMutation.mutateAsync({
          questionId: initialData.id,
          data: normalizedPayload.updatePayload,
        });
        toast({
          title: "Cập nhật câu hỏi thành công",
        });
      } else {
        await createQuestionMutation.mutateAsync(normalizedPayload.createPayload);
        toast({
          title: "Tạo câu hỏi thành công",
        });
      }

      setOpen(false);
    } catch (error) {
      const message = getApiErrorMessage(error);
      setFormError(message);
      toast({
        title: isEditMode ? "Không thể cập nhật câu hỏi" : "Không thể tạo câu hỏi",
        description: message,
        variant: "destructive",
      });
    }
  };

  const defaultTrigger = (
    <Button size="sm" variant={triggerVariant}>
      {isEditMode ? "Sửa" : "Thêm câu hỏi"}
    </Button>
  );

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Chỉnh sửa nội dung câu hỏi và toàn bộ đáp án liên quan."
              : "Tạo câu hỏi mới cho bài học và thiết lập các đáp án."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="question-text">Nội dung câu hỏi</Label>
            <Textarea
              id="question-text"
              onChange={(event) => setQuestionText(event.target.value)}
              placeholder="Nhập nội dung câu hỏi..."
              rows={4}
              value={questionText}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="question-explanation">Giải thích câu hỏi (tuỳ chọn)</Label>
            <Textarea
              id="question-explanation"
              onChange={(event) => setQuestionExplanation(event.target.value)}
              placeholder="Giải thích tổng quan cho câu hỏi..."
              rows={3}
              value={questionExplanation}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Danh sách đáp án</h3>
              <Button onClick={addAnswer} size="sm" type="button" variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Thêm đáp án
              </Button>
            </div>

            {br03Warning ? (
              <p className="rounded-md border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {br03Warning}
              </p>
            ) : null}

            <div className="space-y-3">
              {answers.map((answer, index) => {
                const answerLabel = String.fromCharCode(65 + index);
                return (
                  <div className="space-y-3 rounded-md border p-4" key={answer.key}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{answerLabel}</Badge>
                        {answer.isCorrect ? (
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                            Đúng
                          </Badge>
                        ) : null}
                      </div>
                      <Button
                        disabled={answers.length <= 2}
                        onClick={() => removeAnswer(answer.key)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Xóa đáp án</span>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`answer-text-${answer.key}`}>Nội dung đáp án</Label>
                      <Input
                        id={`answer-text-${answer.key}`}
                        onChange={(event) =>
                          updateAnswer(answer.key, { text: event.target.value })
                        }
                        placeholder={`Nhập đáp án ${answerLabel}`}
                        value={answer.text}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={answer.isCorrect}
                        id={`answer-correct-${answer.key}`}
                        onCheckedChange={(checked) =>
                          updateAnswer(answer.key, { isCorrect: checked === true })
                        }
                      />
                      <Label
                        className="cursor-pointer"
                        htmlFor={`answer-correct-${answer.key}`}
                      >
                        Đây là đáp án đúng
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`answer-explanation-${answer.key}`}>
                        Giải thích đáp án (tuỳ chọn)
                      </Label>
                      <Input
                        id={`answer-explanation-${answer.key}`}
                        onChange={(event) =>
                          updateAnswer(answer.key, { explanation: event.target.value })
                        }
                        placeholder="Giải thích thêm cho đáp án"
                        value={answer.explanation}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {formError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <DialogFooter>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : isEditMode ? (
                "Lưu thay đổi"
              ) : (
                "Tạo câu hỏi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
