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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCreateQuestion, useUpdateQuestion } from "@/hooks/use-questions";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  CreateQuestionPayload,
  QuestionDetail,
  QuestionType,
  UpdateQuestionPayload,
} from "@/types";

const BR03_MIN_ANSWERS_MESSAGE = "Mỗi câu hỏi phải có ít nhất 2 đáp án.";
const BR03_MIN_CORRECT_MESSAGE = "Phải có ít nhất 1 đáp án đúng.";
const ESSAY_SAMPLE_ANSWER_REQUIRED_MESSAGE = "Đáp án tự luận mẫu không được để trống.";
const DEFAULT_QUESTION_TYPE: QuestionType = "SINGLE_CHOICE";
const QUESTION_TYPE_OPTIONS: Array<{
  value: QuestionType;
  label: string;
  description: string;
}> = [
  {
    value: "SINGLE_CHOICE",
    label: "Chọn 1 đáp án",
    description: "Mỗi câu chỉ có một đáp án đúng.",
  },
  {
    value: "MULTIPLE_CHOICE",
    label: "Chọn nhiều đáp án",
    description: "Một câu có thể có nhiều đáp án đúng.",
  },
  {
    value: "ESSAY",
    label: "Tự luận",
    description: "Nhập một đáp án mẫu duy nhất cho câu hỏi tự luận.",
  },
];

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
  if (question?.type === "ESSAY") {
    return [createEmptyAnswer(), createEmptyAnswer()];
  }

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

const buildInitialEssaySampleAnswer = (question?: QuestionDetail): string => {
  if (question?.type !== "ESSAY") {
    return "";
  }

  return question.answers[0]?.text ?? "";
};

const ensureMinimumAnswers = (answerItems: AnswerFormItem[]): AnswerFormItem[] => {
  if (answerItems.length >= 2) {
    return answerItems;
  }

  return [
    ...answerItems,
    ...Array.from({ length: 2 - answerItems.length }, () => createEmptyAnswer()),
  ];
};

const normalizeSingleChoiceAnswers = (
  answerItems: AnswerFormItem[],
): AnswerFormItem[] => {
  let hasCorrectAnswer = false;

  return answerItems.map((answer) => {
    if (!answer.isCorrect) {
      return answer;
    }

    if (!hasCorrectAnswer) {
      hasCorrectAnswer = true;
      return answer;
    }

    return {
      ...answer,
      isCorrect: false,
    };
  });
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
  const [questionType, setQuestionType] = useState<QuestionType>(
    initialData?.type ?? DEFAULT_QUESTION_TYPE,
  );
  const [questionExplanation, setQuestionExplanation] = useState(
    initialData?.explanation ?? "",
  );
  const [answers, setAnswers] = useState<AnswerFormItem[]>(() =>
    buildInitialAnswers(initialData),
  );
  const [essaySampleAnswer, setEssaySampleAnswer] = useState(
    buildInitialEssaySampleAnswer(initialData),
  );
  const [formError, setFormError] = useState<string | null>(null);

  const isEditMode = Boolean(initialData);
  const isSubmitting =
    createQuestionMutation.isPending || updateQuestionMutation.isPending;
  const isEssayQuestion = questionType === "ESSAY";

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuestionText(initialData?.text ?? "");
    setQuestionType(initialData?.type ?? DEFAULT_QUESTION_TYPE);
    setQuestionExplanation(initialData?.explanation ?? "");
    setAnswers(buildInitialAnswers(initialData));
    setEssaySampleAnswer(buildInitialEssaySampleAnswer(initialData));
    setFormError(null);
  }, [initialData, open]);

  const br03Warning = useMemo(() => {
    if (isEssayQuestion) {
      return null;
    }

    if (answers.length < 2) {
      return BR03_MIN_ANSWERS_MESSAGE;
    }

    if (!answers.some((answer) => answer.isCorrect)) {
      return BR03_MIN_CORRECT_MESSAGE;
    }

    return null;
  }, [answers, isEssayQuestion]);

  const addAnswer = () => {
    setAnswers((prev) => [...prev, createEmptyAnswer()]);
  };

  const updateAnswer = (
    answerKey: string,
    patch: Partial<Pick<AnswerFormItem, "text" | "isCorrect" | "explanation">>,
  ) => {
    setAnswers((prev) => {
      if (questionType === "SINGLE_CHOICE" && patch.isCorrect === true) {
        return prev.map((answer) =>
          answer.key === answerKey
            ? { ...answer, ...patch, isCorrect: true }
            : { ...answer, isCorrect: false },
        );
      }

      return prev.map((answer) =>
        answer.key === answerKey ? { ...answer, ...patch } : answer,
      );
    });
  };

  const removeAnswer = (answerKey: string) => {
    if (answers.length <= 2) {
      return;
    }

    setAnswers((prev) => prev.filter((answer) => answer.key !== answerKey));
  };

  const handleQuestionTypeChange = (nextType: QuestionType) => {
    setQuestionType(nextType);
    setFormError(null);

    if (nextType === "ESSAY") {
      return;
    }

    setAnswers((prev) => {
      const nextAnswers = ensureMinimumAnswers(prev);

      return nextType === "SINGLE_CHOICE"
        ? normalizeSingleChoiceAnswers(nextAnswers)
        : nextAnswers;
    });
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

    if (isEssayQuestion) {
      const normalizedEssaySampleAnswer = essaySampleAnswer.trim();
      if (!normalizedEssaySampleAnswer) {
        setFormError(ESSAY_SAMPLE_ANSWER_REQUIRED_MESSAGE);
        return null;
      }

      const basePayload = {
        text: normalizedQuestionText,
        type: questionType,
        ...(questionExplanation.trim()
          ? { explanation: questionExplanation.trim() }
          : {}),
        answers: [
          {
            text: normalizedEssaySampleAnswer,
            isCorrect: true,
          },
        ],
      };

      return {
        createPayload: basePayload,
        updatePayload: basePayload,
      };
    }

    const normalizedObjectiveAnswers = ensureMinimumAnswers(answers);

    if (normalizedObjectiveAnswers.length < 2) {
      setFormError(BR03_MIN_ANSWERS_MESSAGE);
      return null;
    }

    if (!normalizedObjectiveAnswers.some((answer) => answer.isCorrect)) {
      setFormError(BR03_MIN_CORRECT_MESSAGE);
      return null;
    }

    const answerPayload = normalizedObjectiveAnswers.map((answer) => ({
      text: answer.text.trim(),
      isCorrect: answer.isCorrect,
      explanation: answer.explanation.trim(),
    }));

    if (answerPayload.some((answer) => !answer.text)) {
      setFormError("Nội dung đáp án không được để trống.");
      return null;
    }

    const normalizedAnswerPayload = answerPayload.map((answer) => ({
      text: answer.text,
      isCorrect: answer.isCorrect,
      ...(answer.explanation ? { explanation: answer.explanation } : {}),
    }));

    const basePayload = {
      text: normalizedQuestionText,
      type: questionType,
      ...(questionExplanation.trim()
        ? { explanation: questionExplanation.trim() }
        : {}),
      answers: normalizedAnswerPayload,
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
            <Label htmlFor="question-type">Loại câu hỏi</Label>
            <Select
              onValueChange={(value) => handleQuestionTypeChange(value as QuestionType)}
              value={questionType}
            >
              <SelectTrigger id="question-type">
                <SelectValue placeholder="Chọn loại câu hỏi" />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {
                QUESTION_TYPE_OPTIONS.find((option) => option.value === questionType)
                  ?.description
              }
            </p>
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

          {isEssayQuestion ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="essay-sample-answer">Đáp án tự luận mẫu</Label>
                <Textarea
                  id="essay-sample-answer"
                  onChange={(event) => setEssaySampleAnswer(event.target.value)}
                  placeholder="Nhập đoạn văn mẫu để admin tham chiếu khi chấm bài..."
                  rows={8}
                  value={essaySampleAnswer}
                />
              </div>
              <p className="rounded-md border border-muted bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                Khi lưu câu hỏi tự luận, hệ thống sẽ gửi một đáp án mẫu duy nhất với
                trạng thái đúng.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Danh sách đáp án</h3>
                  {questionType === "SINGLE_CHOICE" ? (
                    <p className="text-xs text-muted-foreground">
                      Khi chọn đáp án đúng mới, đáp án đúng cũ sẽ tự động bỏ chọn.
                    </p>
                  ) : null}
                </div>
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
          )}

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
