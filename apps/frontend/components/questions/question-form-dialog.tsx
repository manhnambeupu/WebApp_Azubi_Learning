"use client";

import { Loader2, PlusCircle, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import imageCompression from "browser-image-compression";
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
import { api } from "@/lib/api";
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
const MATCHING_RIGHT_REQUIRED_MESSAGE = "Vế phải của cặp ghép không được để trống.";
const IMAGE_UPLOAD_REQUIRED_MESSAGE = "Vui lòng tải ảnh cho câu hỏi Ảnh (Tự luận).";
const DEFAULT_QUESTION_TYPE: QuestionType = "SINGLE_CHOICE";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};
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
  {
    value: "IMAGE_ESSAY",
    label: "Câu hỏi Ảnh (Tự luận)",
    description: "Tự luận có kèm ảnh minh hoạ, cần upload ảnh trước khi lưu câu hỏi.",
  },
  {
    value: "ORDERING",
    label: "Sắp xếp thứ tự",
    description: "Mỗi đáp án là một bước, thứ tự trong danh sách chính là đáp án đúng.",
  },
  {
    value: "MATCHING",
    label: "Ghép đôi",
    description: "Mỗi dòng gồm vế trái và vế phải tương ứng để tạo thành cặp đúng.",
  },
];

let answerKeySeed = 0;

type AnswerFormItem = {
  key: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
  matchText: string;
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
  matchText: "",
});

const buildInitialAnswers = (question?: QuestionDetail): AnswerFormItem[] => {
  if (question?.type === "ESSAY" || question?.type === "IMAGE_ESSAY") {
    return [createEmptyAnswer(), createEmptyAnswer()];
  }

  if (question?.answers.length) {
    const sourceAnswers =
      question.type === "ORDERING"
        ? [...question.answers].sort(
            (left, right) =>
              (left.orderIndex ?? Number.MAX_SAFE_INTEGER) -
              (right.orderIndex ?? Number.MAX_SAFE_INTEGER),
          )
        : question.answers;

    return sourceAnswers.map((answer) => ({
      key: `answer-${answerKeySeed++}`,
      text: answer.text,
      isCorrect: answer.isCorrect,
      explanation: answer.explanation ?? "",
      matchText: answer.matchText ?? "",
    }));
  }

  return [createEmptyAnswer(), createEmptyAnswer()];
};

const buildInitialEssaySampleAnswer = (question?: QuestionDetail): string => {
  if (question?.type !== "ESSAY" && question?.type !== "IMAGE_ESSAY") {
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
  const [questionImageUrl, setQuestionImageUrl] = useState(
    initialData?.imageUrl ?? "",
  );
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditMode = Boolean(initialData);
  const isSubmitting =
    createQuestionMutation.isPending || updateQuestionMutation.isPending;
  const isImageEssayQuestion = questionType === "IMAGE_ESSAY";
  const isEssayQuestion = questionType === "ESSAY" || isImageEssayQuestion;
  const isOrderingQuestion = questionType === "ORDERING";
  const isMatchingQuestion = questionType === "MATCHING";
  const isChoiceQuestion =
    questionType === "SINGLE_CHOICE" || questionType === "MULTIPLE_CHOICE";
  const fieldClassName =
    "border-slate-300/80 bg-white/90 transition-all duration-300 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-0 dark:border-slate-700/80 dark:bg-slate-950/75";
  const textareaClassName =
    "resize-y border-slate-300/80 bg-white/90 leading-7 transition-all duration-300 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-0 dark:border-slate-700/80 dark:bg-slate-950/75";
  const panelClassName =
    "space-y-3 rounded-xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.7)] backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/55";

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuestionText(initialData?.text ?? "");
    setQuestionType(initialData?.type ?? DEFAULT_QUESTION_TYPE);
    setQuestionExplanation(initialData?.explanation ?? "");
    setAnswers(buildInitialAnswers(initialData));
    setEssaySampleAnswer(buildInitialEssaySampleAnswer(initialData));
    setQuestionImageUrl(initialData?.imageUrl ?? "");
    setSelectedImageFile(null);
    setImageInputKey((prev) => prev + 1);
    setIsUploadingImage(false);
    setFormError(null);
  }, [initialData, open]);

  const br03Warning = useMemo(() => {
    if (isEssayQuestion) {
      return null;
    }

    if (answers.length < 2) {
      return BR03_MIN_ANSWERS_MESSAGE;
    }

    if (isOrderingQuestion || isMatchingQuestion) {
      return null;
    }

    if (!answers.some((answer) => answer.isCorrect)) {
      return BR03_MIN_CORRECT_MESSAGE;
    }

    return null;
  }, [answers, isEssayQuestion, isMatchingQuestion, isOrderingQuestion]);

  const addAnswer = () => {
    setAnswers((prev) => [...prev, createEmptyAnswer()]);
  };

  const updateAnswer = (
    answerKey: string,
    patch: Partial<
      Pick<AnswerFormItem, "text" | "isCorrect" | "explanation" | "matchText">
    >,
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

    if (nextType === "ESSAY" || nextType === "IMAGE_ESSAY") {
      return;
    }

    setAnswers((prev) => {
      const nextAnswers = ensureMinimumAnswers(prev);

      return nextType === "SINGLE_CHOICE"
        ? normalizeSingleChoiceAnswers(nextAnswers)
        : nextType === "ORDERING" || nextType === "MATCHING"
          ? nextAnswers.map((answer) => ({ ...answer, isCorrect: true }))
          : nextAnswers;
    });
  };

  const validateImageFile = (file: File): boolean => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Ảnh không hợp lệ",
        description: "Chỉ chấp nhận file ảnh (image/*).",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast({
        title: "Ảnh vượt quá dung lượng",
        description: "Kích thước ảnh tối đa là 5MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const compressImageFile = async (file: File): Promise<File | null> => {
    try {
      return await imageCompression(file, IMAGE_COMPRESSION_OPTIONS);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Đã xảy ra lỗi khi nén ảnh trước khi tải lên.";
      setFormError(message);
      toast({
        title: "Không thể nén ảnh câu hỏi",
        description: message,
        variant: "destructive",
      });
      return null;
    }
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedImageFile(null);
      return;
    }

    if (!validateImageFile(file)) {
      setSelectedImageFile(null);
      setImageInputKey((prev) => prev + 1);
      return;
    }

    const compressedFile = await compressImageFile(file);
    if (!compressedFile) {
      setSelectedImageFile(null);
      setImageInputKey((prev) => prev + 1);
      return;
    }

    if (!validateImageFile(compressedFile)) {
      setSelectedImageFile(null);
      setImageInputKey((prev) => prev + 1);
      return;
    }

    setSelectedImageFile(compressedFile);
  };

  const handleUploadImage = async () => {
    if (!selectedImageFile) {
      setFormError("Vui lòng chọn ảnh trước khi tải lên.");
      return;
    }

    setFormError(null);
    setIsUploadingImage(true);

    const formData = new FormData();
    formData.append("image", selectedImageFile);

    try {
      const response = await api.post<{ imageUrl: string }>(
        "/admin/questions/upload-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setQuestionImageUrl(response.data.imageUrl);
      setSelectedImageFile(null);
      setImageInputKey((prev) => prev + 1);

      toast({
        title: "Tải ảnh câu hỏi thành công",
      });
    } catch (error) {
      const message = getApiErrorMessage(error);
      setFormError(message);
      toast({
        title: "Không thể tải ảnh câu hỏi",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const normalizePayload = (): {
    createPayload: CreateQuestionPayload;
    updatePayload: UpdateQuestionPayload;
  } | null => {
    const normalizedQuestionText = questionText.trim();
    const normalizedImageUrl = questionImageUrl.trim();

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

      if (isImageEssayQuestion && !normalizedImageUrl) {
        setFormError(IMAGE_UPLOAD_REQUIRED_MESSAGE);
        return null;
      }

      const basePayload = {
        text: normalizedQuestionText,
        type: questionType,
        ...(questionExplanation.trim()
          ? { explanation: questionExplanation.trim() }
          : {}),
        ...(normalizedImageUrl ? { imageUrl: normalizedImageUrl } : { imageUrl: "" }),
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

    if (isChoiceQuestion && !normalizedObjectiveAnswers.some((answer) => answer.isCorrect)) {
      setFormError(BR03_MIN_CORRECT_MESSAGE);
      return null;
    }

    if (normalizedObjectiveAnswers.some((answer) => !answer.text.trim())) {
      setFormError("Nội dung đáp án không được để trống.");
      return null;
    }

    if (
      isMatchingQuestion &&
      normalizedObjectiveAnswers.some((answer) => !answer.matchText.trim())
    ) {
      setFormError(MATCHING_RIGHT_REQUIRED_MESSAGE);
      return null;
    }

    const normalizedAnswerPayload = isOrderingQuestion
      ? normalizedObjectiveAnswers.map((answer, index) => ({
          text: answer.text.trim(),
          isCorrect: true,
          orderIndex: index + 1,
        }))
      : isMatchingQuestion
        ? normalizedObjectiveAnswers.map((answer) => ({
            text: answer.text.trim(),
            isCorrect: true,
            matchText: answer.matchText.trim(),
          }))
        : normalizedObjectiveAnswers.map((answer) => ({
            text: answer.text.trim(),
            isCorrect: answer.isCorrect,
            ...(answer.explanation.trim()
              ? { explanation: answer.explanation.trim() }
              : {}),
          }));

    const basePayload = {
      text: normalizedQuestionText,
      type: questionType,
      ...(questionExplanation.trim()
        ? { explanation: questionExplanation.trim() }
        : {}),
      ...(normalizedImageUrl ? { imageUrl: normalizedImageUrl } : { imageUrl: "" }),
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
      <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Chỉnh sửa nội dung câu hỏi và toàn bộ đáp án liên quan."
              : "Tạo câu hỏi mới cho bài học và thiết lập các đáp án."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className={panelClassName}>
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-slate-800 dark:text-slate-100" htmlFor="question-text">
                Nội dung câu hỏi
              </Label>
              <p className="text-xs text-muted-foreground">
                Đặt câu hỏi rõ ràng để học viên hiểu yêu cầu trước khi chọn hoặc nhập đáp án.
              </p>
            </div>
            <Textarea
              className={textareaClassName}
              id="question-text"
              onChange={(event) => setQuestionText(event.target.value)}
              placeholder="Nhập nội dung câu hỏi..."
              rows={4}
              value={questionText}
            />
          </div>

          <div className={panelClassName}>
            <Label className="text-sm font-semibold text-slate-800 dark:text-slate-100" htmlFor="question-type">
              Loại câu hỏi
            </Label>
            <Select
              onValueChange={(value) => handleQuestionTypeChange(value as QuestionType)}
              value={questionType}
            >
              <SelectTrigger className={fieldClassName} id="question-type">
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

          <div className={panelClassName}>
            <Label
              className="text-sm font-semibold text-slate-800 dark:text-slate-100"
              htmlFor="question-explanation"
            >
              Giải thích câu hỏi (tuỳ chọn)
            </Label>
            <Textarea
              className={textareaClassName}
              id="question-explanation"
              onChange={(event) => setQuestionExplanation(event.target.value)}
              placeholder="Giải thích tổng quan cho câu hỏi..."
              rows={3}
              value={questionExplanation}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-dashed border-slate-300/80 bg-slate-50/60 p-4 dark:border-slate-700/70 dark:bg-slate-900/40">
            <div className="space-y-1">
              <Label
                className="text-sm font-semibold text-slate-800 dark:text-slate-100"
                htmlFor="question-image-upload"
              >
                Ảnh câu hỏi
              </Label>
              <p className="text-xs text-muted-foreground">
                Tải ảnh minh hoạ cho câu hỏi (image/*, tối đa 5MB). Với câu hỏi ảnh tự
                luận, ảnh là bắt buộc trước khi lưu.
              </p>
            </div>

            <Input
              accept="image/*"
              id="question-image-upload"
              key={imageInputKey}
              onChange={handleImageFileChange}
              type="file"
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={!selectedImageFile || isUploadingImage || isSubmitting}
                onClick={() => {
                  void handleUploadImage();
                }}
                type="button"
                variant="outline"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tải ảnh...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload ảnh
                  </>
                )}
              </Button>
              {selectedImageFile ? (
                <span className="text-xs text-muted-foreground">
                  Đã chọn: {selectedImageFile.name}
                </span>
              ) : null}
            </div>

            {questionImageUrl ? (
              <p className="break-all text-xs text-muted-foreground">
                URL ảnh hiện tại:{" "}
                <a
                  className="text-primary underline underline-offset-2"
                  href={questionImageUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {questionImageUrl}
                </a>
              </p>
            ) : null}
          </div>

          <Separator />

          {isEssayQuestion ? (
            <div className={panelClassName}>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800 dark:text-slate-100" htmlFor="essay-sample-answer">
                  Đáp án tự luận mẫu
                </Label>
                <Textarea
                  className={textareaClassName}
                  id="essay-sample-answer"
                  onChange={(event) => setEssaySampleAnswer(event.target.value)}
                  placeholder="Nhập đoạn văn mẫu để admin tham chiếu khi chấm bài..."
                  rows={8}
                  value={essaySampleAnswer}
                />
              </div>
              <p className="rounded-lg border border-muted bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                Khi lưu câu hỏi tự luận, hệ thống sẽ gửi một đáp án mẫu duy nhất với
                trạng thái đúng.
              </p>
            </div>
          ) : (
            <div className={panelClassName}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Danh sách đáp án
                  </h3>
                  {questionType === "SINGLE_CHOICE" ? (
                    <p className="text-xs text-muted-foreground">
                      Khi chọn đáp án đúng mới, đáp án đúng cũ sẽ tự động bỏ chọn.
                    </p>
                  ) : isOrderingQuestion ? (
                    <p className="text-xs text-muted-foreground">
                      Thứ tự hiển thị trong danh sách sẽ được lưu thành thứ tự đúng.
                    </p>
                  ) : isMatchingQuestion ? (
                    <p className="text-xs text-muted-foreground">
                      Mỗi đáp án gồm vế trái và vế phải tương ứng để tạo thành cặp đúng.
                    </p>
                  ) : null}
                </div>
                <Button
                  className="border-primary/25 bg-white/90 text-primary transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/10 hover:text-primary dark:bg-slate-950/70"
                  onClick={addAnswer}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Thêm đáp án
                </Button>
              </div>

              {br03Warning ? (
                <p className="rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {br03Warning}
                </p>
              ) : null}

              <div className="space-y-3">
                {answers.map((answer, index) => {
                  const answerLabel = isOrderingQuestion
                    ? `Bước ${index + 1}`
                    : String.fromCharCode(65 + index);
                  const answerTextLabel = isMatchingQuestion
                    ? "Vế trái"
                    : isOrderingQuestion
                      ? "Tên bước"
                      : "Nội dung đáp án";
                  return (
                    <div
                      className="space-y-3 rounded-xl border border-slate-200/85 bg-white/90 p-4 shadow-[0_16px_30px_-26px_rgba(15,23,42,0.65)] transition-all duration-300 hover:border-amber-300/65 hover:shadow-[0_18px_34px_-24px_rgba(245,158,11,0.55)] dark:border-slate-700/80 dark:bg-slate-950/70"
                      key={answer.key}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{answerLabel}</Badge>
                          {isChoiceQuestion && answer.isCorrect ? (
                            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                              Đúng
                            </Badge>
                          ) : null}
                        </div>
                        <Button
                          className="text-muted-foreground transition-all hover:bg-slate-200/70 hover:text-foreground dark:hover:bg-slate-800/70"
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
                        <Label
                          className="text-sm font-medium text-slate-700 dark:text-slate-200"
                          htmlFor={`answer-text-${answer.key}`}
                        >
                          {answerTextLabel}
                        </Label>
                        <Input
                          className={fieldClassName}
                          id={`answer-text-${answer.key}`}
                          onChange={(event) =>
                            updateAnswer(answer.key, { text: event.target.value })
                          }
                          placeholder={
                            isMatchingQuestion
                              ? `Nhập vế trái cho cặp ${answerLabel}`
                              : isOrderingQuestion
                                ? `Nhập nội dung ${answerLabel.toLowerCase()}`
                                : `Nhập đáp án ${answerLabel}`
                          }
                          value={answer.text}
                        />
                      </div>

                      {isMatchingQuestion ? (
                        <div className="space-y-2">
                          <Label
                            className="text-sm font-medium text-slate-700 dark:text-slate-200"
                            htmlFor={`answer-match-text-${answer.key}`}
                          >
                            Vế phải
                          </Label>
                          <Input
                            className={fieldClassName}
                            id={`answer-match-text-${answer.key}`}
                            onChange={(event) =>
                              updateAnswer(answer.key, { matchText: event.target.value })
                            }
                            placeholder={`Nhập vế phải cho cặp ${answerLabel}`}
                            value={answer.matchText}
                          />
                        </div>
                      ) : null}

                      {isChoiceQuestion ? (
                        <>
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
                            <Label
                              className="text-sm font-medium text-slate-700 dark:text-slate-200"
                              htmlFor={`answer-explanation-${answer.key}`}
                            >
                              Giải thích đáp án (tuỳ chọn)
                            </Label>
                            <Input
                              className={fieldClassName}
                              id={`answer-explanation-${answer.key}`}
                              onChange={(event) =>
                                updateAnswer(answer.key, {
                                  explanation: event.target.value,
                                })
                              }
                              placeholder="Giải thích thêm cho đáp án"
                              value={answer.explanation}
                            />
                          </div>
                        </>
                      ) : null}
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
            <Button
              className="h-10 rounded-xl bg-gradient-to-r from-primary via-blue-600 to-amber-500 px-5 text-primary-foreground shadow-[0_14px_32px_-20px_rgba(37,99,235,0.82)] transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-amber-500 hover:shadow-[0_18px_34px_-18px_rgba(245,158,11,0.72)]"
              disabled={isSubmitting}
              type="submit"
            >
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
