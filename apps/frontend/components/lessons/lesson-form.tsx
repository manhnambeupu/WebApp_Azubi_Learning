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
      <div className="flex h-[380px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
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
    "space-y-4 rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-[0_16px_40px_-30px_rgba(12,24,60,0.5)] backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/60";
  const fieldClassName =
    "border-slate-300/80 bg-white/90 transition-all duration-300 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-0 dark:border-slate-700/80 dark:bg-slate-950/75";
  const textareaClassName =
    "resize-y border-slate-300/80 bg-white/90 leading-7 transition-all duration-300 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-0 dark:border-slate-700/80 dark:bg-slate-950/75";

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
    <section className="kokonut-glass-card space-y-6 rounded-2xl p-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/75">
          Biên soạn nội dung
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {isEditMode ? "Chỉnh sửa bài học" : "Tạo bài học mới"}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Chia bài học thành từng khối rõ ràng để quản lý thông tin chung, nội dung markdown và
          hình ảnh đại diện mạch lạc hơn.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className={panelClassName}>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Thông tin chung
            </h2>
            <p className="text-xs text-muted-foreground">
              Điền tiêu đề, danh mục và tóm tắt để học viên nắm rõ trọng tâm bài học.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="lesson-title">
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
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="lesson-category">
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

          <div className="rounded-xl border border-slate-300/80 bg-white/80 p-4 dark:border-slate-700/80 dark:bg-slate-950/55">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={isPrivate}
                className="mt-0.5 h-5 w-5"
                id="lesson-private-mode"
                onCheckedChange={(checked) => setIsPrivate(checked === true)}
              />
              <div className="space-y-1">
                <Label
                  className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200"
                  htmlFor="lesson-private-mode"
                >
                  Chế độ Riêng tư (Kèm 1-1, ẩn với học sinh thường)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Bật tùy chọn này để bài học chỉ hiển thị với học viên đã được cấp quyền truy cập.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="lesson-summary">
                Tóm tắt
              </Label>
              <span className="text-xs text-muted-foreground">
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
            <Label className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Nội dung bài học (Markdown)
            </Label>
            <p className="text-xs text-muted-foreground">
              Khu vực trình bày chính cho học viên, ưu tiên bố cục rõ ràng và dễ đọc.
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 dark:border-slate-800/80 dark:bg-slate-950/70">
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
            <Label className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Ảnh bài học (JPEG, PNG, WEBP, AVIF, GIF; tối đa 5MB)
            </Label>
            <p className="text-xs text-muted-foreground">
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
            className={`rounded-2xl border border-dashed p-5 transition-all duration-300 ${
              isDraggingImage
                ? "border-primary/70 bg-primary/10 shadow-[0_0_0_1px_rgba(29,78,216,0.25),0_14px_30px_-20px_rgba(29,78,216,0.6)]"
                : "border-slate-300/80 bg-slate-50/75 dark:border-slate-700/80 dark:bg-slate-900/45"
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
                  className="h-44 w-full max-w-md rounded-xl border border-slate-200/80 bg-white bg-cover bg-center bg-no-repeat dark:border-slate-700/70 dark:bg-slate-950/80"
                  role="img"
                  style={{ backgroundImage: `url(${imagePreviewUrl})` }}
                />
              ) : (
                <div className="flex h-24 w-full max-w-md items-center justify-center rounded-xl border border-slate-200/80 bg-white dark:border-slate-700/70 dark:bg-slate-950/80">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}

              <div className="space-y-1">
                <p className="text-sm font-medium">Kéo thả ảnh vào đây hoặc chọn từ máy</p>
                <p className="text-xs text-muted-foreground">
                  Ảnh mới sẽ thay thế ảnh hiện tại khi lưu thay đổi.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  className="border-primary/30 bg-white/90 text-primary transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/10 hover:text-primary dark:bg-slate-950/70"
                  onClick={() => imageInputRef.current?.click()}
                  type="button"
                  variant="outline"
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Chọn ảnh
                </Button>
                {imageFile ? (
                  <Button
                    className="text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-slate-200/70 hover:text-foreground dark:hover:bg-slate-800/70"
                    onClick={() => {
                      setImageFile(null);
                      if (imageInputRef.current) {
                        imageInputRef.current.value = "";
                      }
                    }}
                    type="button"
                    variant="ghost"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Bỏ ảnh mới
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            className="h-11 rounded-xl bg-gradient-to-r from-primary to-amber-500 px-6 text-sm font-semibold text-slate-950 shadow-[0_14px_34px_-18px_hsl(var(--primary) / 0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:from-primary/90 hover:to-amber-500 hover:shadow-[0_18px_36px_-18px_rgba(245,158,11,0.75)]"
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
    </section>
  );
}
