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
  const [isPrivate, setIsPrivate] = useState(initialData?.isPrivate ?? false);
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
    "h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-bold text-[#3c3c3c] placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white";
  const textareaClassName =
    "resize-y rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-bold text-[#3c3c3c] leading-6 placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white";
  const panelClassName =
    "space-y-3 rounded-2xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-[#f7f7f7] p-5 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#111b21]";

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuestionText(initialData?.text ?? "");
    setQuestionType(initialData?.type ?? DEFAULT_QUESTION_TYPE);
    setQuestionExplanation(initialData?.explanation ?? "");
    setIsPrivate(initialData?.isPrivate ?? false);
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
        isPrivate,
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
      isPrivate,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[24px] border-2 border-[#e5e5e5] bg-white p-6 shadow-2xl dark:border-[#2b3940] dark:bg-[#131f24] sm:max-w-3xl">
        <DialogHeader className="border-b-2 border-[#e5e5e5] pb-4 dark:border-[#2b3940]">
          <DialogTitle className="text-xl font-extrabold text-[#3c3c3c] dark:text-white">
            {isEditMode ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-[#777777] dark:text-slate-400">
            {isEditMode
              ? "Chỉnh sửa nội dung câu hỏi và toàn bộ đáp án liên quan."
              : "Tạo câu hỏi mới cho bài học và thiết lập các đáp án."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className={panelClassName}>
            <div className="space-y-1">
              <Label className="text-xs font-extrabold text-[#3c3c3c] dark:text-white" htmlFor="question-text">
                Nội dung câu hỏi
              </Label>
              <p className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
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
            <Label className="text-xs font-extrabold text-[#3c3c3c] dark:text-white" htmlFor="question-type">
              Loại câu hỏi
            </Label>
            <Select
              onValueChange={(value) => handleQuestionTypeChange(value as QuestionType)}
              value={questionType}
            >
              <SelectTrigger className={fieldClassName} id="question-type">
                <SelectValue placeholder="Chọn loại câu hỏi" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2 border-[#e5e5e5] bg-white dark:border-[#2b3940] dark:bg-[#131f24]">
                {QUESTION_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
              {
                QUESTION_TYPE_OPTIONS.find((option) => option.value === questionType)
                  ?.description
              }
            </p>
          </div>

          <div className={panelClassName}>
            <div className="flex items-start gap-3">
              <Checkbox
                className="mt-0.5 h-5 w-5 border-2 border-[#e5e5e5] data-[state=checked]:border-[#58cc02] data-[state=checked]:bg-[#58cc02] data-[state=checked]:text-white dark:border-[#2b3940]"
                checked={isPrivate}
                id="question-is-private"
                onCheckedChange={(checked) => setIsPrivate(checked === true)}
              />
              <div className="space-y-1">
                <Label
                  className="cursor-pointer text-xs font-extrabold text-[#3c3c3c] dark:text-white"
                  htmlFor="question-is-private"
                >
                  Câu hỏi VIP ẩn
                </Label>
                <p className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
                  Chỉ học viên được cấp quyền vào bài học mới nhìn thấy câu hỏi này.
                </p>
              </div>
            </div>
          </div>

          <div className={panelClassName}>
            <Label
              className="text-xs font-extrabold text-[#3c3c3c] dark:text-white"
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

          <div className="space-y-3 rounded-2xl border-2 border-dashed border-[#e5e5e5] bg-[#f7f7f7] p-5 dark:border-[#2b3940] dark:bg-[#111b21]">
            <div className="space-y-1">
              <Label
                className="text-xs font-extrabold text-[#3c3c3c] dark:text-white"
                htmlFor="question-image-upload"
              >
                Ảnh câu hỏi
              </Label>
              <p className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
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
                className="h-10 rounded-xl border-2 border-[#58cc02] border-b-4 border-b-[#46a302] bg-[#e8f5e1] text-xs font-extrabold text-[#46a302] hover:bg-[#d5f0ca] active:translate-y-0.5 active:border-b-2 dark:bg-[#58cc02]/20 dark:text-[#58cc02]"
                disabled={!selectedImageFile || isUploadingImage || isSubmitting}
                onClick={() => {
                  void handleUploadImage();
                }}
                type="button"
                variant="ghost"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin text-[#58cc02]" />
                    Đang tải ảnh...
                  </>
                ) : (
                  <>
                    <Upload className="mr-1.5 h-4 w-4" />
                    Upload ảnh
                  </>
                )}
              </Button>
              {selectedImageFile ? (
                <span className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
                  Đã chọn: {selectedImageFile.name}
                </span>
              ) : null}
            </div>

            {questionImageUrl ? (
              <span className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
                URL ảnh hiện tại:{" "}
                <a
                  className="text-[#58cc02] hover:text-[#46a302] underline underline-offset-2"
                  href={questionImageUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {questionImageUrl}
                </a>
              </span>
            ) : null}
          </div>

          <Separator />

          {isEssayQuestion ? (
            <div className={panelClassName}>
              <div className="space-y-2">
                <Label className="text-xs font-extrabold text-[#3c3c3c] dark:text-white" htmlFor="essay-sample-answer">
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
              <p className="rounded-2xl border-2 border-[#e5e5e5] bg-[#f7f7f7] px-3 py-2 text-xs font-bold text-[#777777] dark:border-[#2b3940] dark:bg-[#111b21] dark:text-slate-400">
                Khi lưu câu hỏi tự luận, hệ thống sẽ gửi một đáp án mẫu duy nhất với
                trạng thái đúng.
              </p>
            </div>
          ) : (
            <div className={panelClassName}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="text-xs font-extrabold text-[#3c3c3c] dark:text-white">
                    Danh sách đáp án
                  </h3>
                  {questionType === "SINGLE_CHOICE" ? (
                    <p className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
                      Khi chọn đáp án đúng mới, đáp án đúng cũ sẽ tự động bỏ chọn.
                    </p>
                  ) : isOrderingQuestion ? (
                    <p className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
                      Thứ tự hiển thị trong danh sách sẽ được lưu thành thứ tự đúng.
                    </p>
                  ) : isMatchingQuestion ? (
                    <p className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
                      Mỗi đáp án gồm vế trái và vế phải tương ứng để tạo thành cặp đúng.
                    </p>
                  ) : null}
                </div>
                <Button
                  className="h-9 rounded-xl border-2 border-[#58cc02] border-b-4 border-b-[#46a302] bg-[#e8f5e1] text-xs font-extrabold text-[#46a302] hover:bg-[#d5f0ca] active:translate-y-0.5 active:border-b-2 dark:bg-[#58cc02]/20 dark:text-[#58cc02]"
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
                <p className="rounded-2xl border-2 border-[#ffc800]/40 bg-[#fef9e7] px-3 py-2 text-xs font-extrabold text-[#3c3c3c] dark:border-[#ffc800]/30 dark:bg-[#ffc800]/10 dark:text-white">
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
                      className="space-y-3 rounded-2xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-4 transition-all hover:border-[#58cc02]/50 active:translate-y-0.5 active:border-b-2 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]"
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
                          className="rounded-xl border-2 border-transparent text-[#777777] hover:border-[#ff4b4b]/30 hover:bg-[#ffebee] hover:text-[#ff4b4b] dark:text-slate-400 dark:hover:bg-[#ff4b4b]/20"
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
                          className="text-xs font-extrabold text-[#3c3c3c] dark:text-white"
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
                            className="text-xs font-extrabold text-[#3c3c3c] dark:text-white"
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
                              className="h-5 w-5 border-2 border-[#e5e5e5] data-[state=checked]:border-[#58cc02] data-[state=checked]:bg-[#58cc02] data-[state=checked]:text-white dark:border-[#2b3940]"
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
                              className="text-xs font-extrabold text-[#3c3c3c] dark:text-white"
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
            <p className="rounded-2xl border-2 border-[#ff4b4b]/40 bg-[#ffebee] px-3 py-2 text-xs font-extrabold text-[#ff4b4b] dark:bg-[#ff4b4b]/15">
              {formError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              className="h-12 rounded-2xl border-b-4 border-[#46a302] bg-[#58cc02] px-6 text-sm font-extrabold text-white transition-all hover:bg-[#46a302] active:translate-y-0.5 active:border-b-2"
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
