"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGetCategories } from "@/hooks/use-categories";
import {
  type LessonMutationPayload,
  useCreateLesson,
  useUploadLessonMarkdownImage,
  useUpdateLesson,
} from "@/hooks/use-lessons";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import type { LessonDetail, MarkdownImageUploadResponse } from "@/types";

const MarkdownEditor = dynamic(
  () => import("@/components/lessons/markdown-editor").then((mod) => mod.MarkdownEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[380px] items-center justify-center rounded-2xl border-2 border-dashed border-[#e5e5e5] text-xs font-bold text-[#777777] dark:border-[#2b3940] dark:text-slate-400">
        Đang tải trình soạn thảo markdown...
      </div>
    ),
  },
);

const MAX_SUMMARY_LENGTH = 200;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;
const ACCEPTED_IMAGE_TYPE_SET: ReadonlySet<string> = new Set(ACCEPTED_IMAGE_TYPES);
const IMAGE_INPUT_ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");
const IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

type LessonFormProps = {
  mode: "create" | "edit";
  lesson?: LessonDetail;
};

export function LessonForm({ mode, lesson }: LessonFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const categoriesQuery = useGetCategories();
  const createLessonMutation = useCreateLesson();
  const uploadLessonMarkdownImageMutation = useUploadLessonMarkdownImage();
  const updateLessonMutation = useUpdateLesson();

  const [title, setTitle] = useState(lesson?.title ?? "");
  const [summary, setSummary] = useState(lesson?.summary ?? "");
  const [contentMd, setContentMd] = useState(lesson?.contentMd ?? "");
  const [categoryId, setCategoryId] = useState(lesson?.categoryId ?? "");
  const [isPrivate, setIsPrivate] = useState(lesson?.isPrivate ?? false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const isEditMode = mode === "edit";
  const isSaving = createLessonMutation.isPending || updateLessonMutation.isPending;
  const panelClassName =
    "space-y-4 rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]";
  const fieldClassName =
    "h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-bold text-[#3c3c3c] placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white";
  const textareaClassName =
    "resize-y rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-bold text-[#3c3c3c] leading-7 placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white";

  useEffect(() => {
    if (!lesson) {
      return;
    }

    setTitle(lesson.title);
    setSummary(lesson.summary);
    setContentMd(lesson.contentMd);
    setCategoryId(lesson.categoryId);
    setIsPrivate(lesson.isPrivate);
    setImageFile(null);
    setLocalImagePreview(null);
  }, [lesson]);

  useEffect(() => {
    if (!imageFile) {
      setLocalImagePreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setLocalImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const imagePreviewUrl = useMemo(() => {
    if (localImagePreview) {
      return localImagePreview;
    }

    return lesson?.imageUrl ?? null;
  }, [lesson?.imageUrl, localImagePreview]);

  const validateImageFile = (file: File): boolean => {
    if (!ACCEPTED_IMAGE_TYPE_SET.has(file.type)) {
      toast({
        title: "Ảnh không hợp lệ",
        description: "Chỉ chấp nhận file JPEG, PNG, WEBP, AVIF hoặc GIF.",
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
      toast({
        title: "Không thể nén ảnh",
        description:
          error instanceof Error
            ? error.message
            : "Đã xảy ra lỗi khi nén ảnh trước khi tải lên.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleImageFile = async (file: File) => {
    if (!validateImageFile(file)) {
      return;
    }

    const compressedFile = await compressImageFile(file);
    if (!compressedFile) {
      setImageFile(null);
      return;
    }

    if (!validateImageFile(compressedFile)) {
      setImageFile(null);
      return;
    }

    setImageFile(compressedFile);
  };

  const onImageInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    await handleImageFile(selectedFile);
  };

  const onImageDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingImage(false);

    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) {
      return;
    }

    await handleImageFile(droppedFile);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const normalizedSummary = summary.trim();
    const normalizedContent = contentMd.trim();

    if (!normalizedTitle || !normalizedSummary || !normalizedContent || !categoryId) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ tiêu đề, tóm tắt, danh mục và nội dung.",
        variant: "destructive",
      });
      return;
    }

    if (normalizedSummary.length > MAX_SUMMARY_LENGTH) {
      toast({
        title: "Tóm tắt quá dài",
        description: `Tóm tắt chỉ được tối đa ${MAX_SUMMARY_LENGTH} ký tự.`,
        variant: "destructive",
      });
      return;
    }

    const payload: LessonMutationPayload = {
      title: normalizedTitle,
      summary: normalizedSummary,
      contentMd: normalizedContent,
      categoryId,
      isPrivate,
      imageFile: imageFile ?? undefined,
    };

    try {
      if (isEditMode) {
        if (!lesson) {
          return;
        }

        await updateLessonMutation.mutateAsync({
          lessonId: lesson.id,
          data: payload,
        });
        toast({
          title: "Lưu thay đổi thành công",
          description: "Thông tin bài học đã được cập nhật.",
        });
      } else {
        const createdLesson = await createLessonMutation.mutateAsync(payload);
        toast({
          title: "Tạo bài học thành công",
          description: "Bạn có thể tiếp tục tải file đính kèm ở trang chỉnh sửa.",
        });
        router.push(`/admin/lessons/${createdLesson.id}/edit`);
      }
    } catch (error) {
      toast({
        title: isEditMode ? "Không thể cập nhật bài học" : "Không thể tạo bài học",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleMarkdownImageUpload = async (
    file: File,
  ): Promise<MarkdownImageUploadResponse> => {
    return uploadLessonMarkdownImageMutation.mutateAsync(file);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
        <div className="space-y-1 border-b-2 border-[#e5e5e5] pb-4 dark:border-[#2b3940]">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#58cc02]/30 bg-[#e8f5e1] px-3 py-1 text-xs font-extrabold text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]">
            Biên soạn nội dung
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#3c3c3c] dark:text-white sm:text-3xl">
            {isEditMode ? "Chỉnh sửa bài học" : "Tạo bài học mới"}
          </h1>
          <p className="text-xs md:text-sm font-bold text-[#777777] dark:text-slate-400">
            Chia bài học thành từng khối rõ ràng để quản lý thông tin chung, nội dung markdown và
            hình ảnh đại diện mạch lạc hơn.
          </p>
        </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className={panelClassName}>
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-[#3c3c3c] dark:text-white">
              Thông tin chung
            </h2>
            <p className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
              Điền tiêu đề, danh mục và tóm tắt để học viên nắm rõ trọng tâm bài học.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-extrabold text-[#3c3c3c] dark:text-white" htmlFor="lesson-title">
                Tiêu đề
              </Label>
              <Input
                className={fieldClassName}
                id="lesson-title"
                maxLength={255}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: Quy trình setup phòng tiêu chuẩn"
                value={title}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-extrabold text-[#3c3c3c] dark:text-white" htmlFor="lesson-category">
                Danh mục
              </Label>
              <Select onValueChange={setCategoryId} value={categoryId}>
                <SelectTrigger className={fieldClassName} id="lesson-category">
                  <SelectValue
                    placeholder={
                      categoriesQuery.isLoading ? "Đang tải danh mục..." : "Chọn danh mục"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(categoriesQuery.data ?? []).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categoriesQuery.isError ? (
                <p className="text-xs text-destructive">
                  {getApiErrorMessage(categoriesQuery.error)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border-2 border-[#e5e5e5] bg-[#f7f7f7] p-4 dark:border-[#2b3940] dark:bg-[#111b21]">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={isPrivate}
                className="mt-0.5 h-5 w-5 border-2 border-[#e5e5e5] data-[state=checked]:border-[#58cc02] data-[state=checked]:bg-[#58cc02] data-[state=checked]:text-white dark:border-[#2b3940]"
                id="lesson-private-mode"
                onCheckedChange={(checked) => setIsPrivate(checked === true)}
              />
              <div className="space-y-0.5">
                <Label
                  className="cursor-pointer text-xs font-extrabold text-[#3c3c3c] dark:text-white"
                  htmlFor="lesson-private-mode"
                >
                  Chế độ Riêng tư (Kèm 1-1, ẩn với học sinh thường)
                </Label>
                <p className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
                  Bật tùy chọn này để bài học chỉ hiển thị với học viên đã được cấp quyền truy cập.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-extrabold text-[#3c3c3c] dark:text-white" htmlFor="lesson-summary">
                Tóm tắt
              </Label>
              <span className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
                {summary.length}/{MAX_SUMMARY_LENGTH}
              </span>
            </div>
            <Textarea
              className={textareaClassName}
              id="lesson-summary"
              maxLength={MAX_SUMMARY_LENGTH}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Mô tả ngắn gọn mục tiêu của bài học..."
              rows={4}
              value={summary}
            />
          </div>
        </div>

        <div className={panelClassName}>
          <div className="space-y-1">
            <Label className="text-sm font-extrabold text-[#3c3c3c] dark:text-white">
              Nội dung bài học (Markdown)
            </Label>
            <p className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
              Khu vực trình bày chính cho học viên, ưu tiên bố cục rõ ràng và dễ đọc.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border-2 border-[#e5e5e5] bg-white dark:border-[#2b3940] dark:bg-[#131f24]">
            <MarkdownEditor
              value={contentMd}
              onChange={setContentMd}
              onUploadImage={handleMarkdownImageUpload}
              disabled={isSaving}
            />
          </div>
        </div>

        <div className={panelClassName}>
          <div className="space-y-1">
            <Label className="text-sm font-extrabold text-[#3c3c3c] dark:text-white">
              Ảnh bài học (JPEG, PNG, WEBP, AVIF, GIF; tối đa 5MB)
            </Label>
            <p className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
              Hình ảnh đại diện giúp bài học trực quan hơn trong danh sách hiển thị.
            </p>
          </div>
          <input
            accept={IMAGE_INPUT_ACCEPT}
            className="hidden"
            onChange={onImageInputChange}
            ref={imageInputRef}
            type="file"
          />

          <div
            className={`rounded-2xl border-2 border-dashed p-6 transition-all ${
              isDraggingImage
                ? "border-[#58cc02] bg-[#e8f5e1] dark:bg-[#58cc02]/20"
                : "border-[#e5e5e5] bg-[#f7f7f7] dark:border-[#2b3940] dark:bg-[#111b21]"
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDraggingImage(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDraggingImage(false);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDraggingImage(true);
            }}
            onDrop={onImageDrop}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              {imagePreviewUrl ? (
                <div
                  aria-label="Lesson preview"
                  className="h-44 w-full max-w-md rounded-2xl border-2 border-[#e5e5e5] bg-white bg-cover bg-center bg-no-repeat dark:border-[#2b3940] dark:bg-[#131f24]"
                  role="img"
                  style={{ backgroundImage: `url(${imagePreviewUrl})` }}
                />
              ) : (
                <div className="flex h-24 w-full max-w-md items-center justify-center rounded-2xl border-2 border-[#e5e5e5] bg-white dark:border-[#2b3940] dark:bg-[#131f24]">
                  <ImageIcon className="h-6 w-6 text-[#777777] dark:text-slate-400" />
                </div>
              )}

              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-[#3c3c3c] dark:text-white">Kéo thả ảnh vào đây hoặc chọn từ máy</p>
                <p className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
                  Ảnh mới sẽ thay thế ảnh hiện tại khi lưu thay đổi.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <Button
                  className="h-10 rounded-xl border-2 border-[#58cc02] border-b-4 border-b-[#46a302] bg-[#e8f5e1] text-xs font-extrabold text-[#46a302] hover:bg-[#d5f0ca] active:translate-y-0.5 active:border-b-2 dark:bg-[#58cc02]/20 dark:text-[#58cc02]"
                  onClick={() => imageInputRef.current?.click()}
                  type="button"
                  variant="ghost"
                >
                  <UploadCloud className="mr-1.5 h-4 w-4" />
                  Chọn ảnh
                </Button>
                {imageFile ? (
                  <Button
                    className="h-10 rounded-xl border-2 border-[#ff4b4b]/30 border-b-4 border-b-[#e03838] bg-[#ffebee] text-xs font-extrabold text-[#ff4b4b] hover:bg-[#ffdada] active:translate-y-0.5 active:border-b-2 dark:border-[#ff4b4b]/40 dark:border-b-[#ff4b4b]/80 dark:bg-[#ff4b4b]/20"
                    onClick={() => {
                      setImageFile(null);
                      if (imageInputRef.current) {
                        imageInputRef.current.value = "";
                      }
                    }}
                    type="button"
                    variant="ghost"
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    Bỏ ảnh mới
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

          <div className="flex justify-end pt-2">
            <Button
              className="h-12 rounded-2xl border-b-4 border-[#46a302] bg-[#58cc02] px-8 text-sm font-extrabold text-white transition-all hover:bg-[#46a302] active:translate-y-0.5 active:border-b-2 disabled:opacity-50"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : isEditMode ? (
                "Lưu thay đổi"
              ) : (
                "Tạo bài học"
              )}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
