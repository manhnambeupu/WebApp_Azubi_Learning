"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  useUpdateLesson,
} from "@/hooks/use-lessons";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import type { LessonDetail } from "@/types";

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
  const updateLessonMutation = useUpdateLesson();

  const [title, setTitle] = useState(lesson?.title ?? "");
  const [summary, setSummary] = useState(lesson?.summary ?? "");
  const [contentMd, setContentMd] = useState(lesson?.contentMd ?? "");
  const [categoryId, setCategoryId] = useState(lesson?.categoryId ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const isEditMode = mode === "edit";
  const isSaving = createLessonMutation.isPending || updateLessonMutation.isPending;

  useEffect(() => {
    if (!lesson) {
      return;
    }

    setTitle(lesson.title);
    setSummary(lesson.summary);
    setContentMd(lesson.contentMd);
    setCategoryId(lesson.categoryId);
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

  const handleImageFile = (file: File) => {
    if (!validateImageFile(file)) {
      return;
    }

    setImageFile(file);
  };

  const onImageInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    handleImageFile(selectedFile);
  };

  const onImageDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingImage(false);

    const droppedFile = event.dataTransfer.files?.[0];
    if (!droppedFile) {
      return;
    }

    handleImageFile(droppedFile);
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

  return (
    <section className="space-y-6 rounded-lg border bg-background p-6 shadow-sm">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEditMode ? "Chỉnh sửa bài học" : "Tạo bài học mới"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Quản lý nội dung markdown, hình ảnh và danh mục cho bài học.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Tiêu đề</Label>
            <Input
              id="lesson-title"
              maxLength={255}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ví dụ: Quy trình setup phòng tiêu chuẩn"
              value={title}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lesson-category">Danh mục</Label>
            <Select onValueChange={setCategoryId} value={categoryId}>
              <SelectTrigger id="lesson-category">
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="lesson-summary">Tóm tắt</Label>
            <span className="text-xs text-muted-foreground">
              {summary.length}/{MAX_SUMMARY_LENGTH}
            </span>
          </div>
          <Textarea
            id="lesson-summary"
            maxLength={MAX_SUMMARY_LENGTH}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Mô tả ngắn gọn mục tiêu của bài học..."
            rows={4}
            value={summary}
          />
        </div>

        <div className="space-y-2">
          <Label>Nội dung bài học (Markdown)</Label>
          <MarkdownEditor value={contentMd} onChange={setContentMd} />
        </div>

        <div className="space-y-3">
          <Label>Ảnh bài học (JPEG, PNG, WEBP, AVIF, GIF; tối đa 5MB)</Label>
          <input
            accept={IMAGE_INPUT_ACCEPT}
            className="hidden"
            onChange={onImageInputChange}
            ref={imageInputRef}
            type="file"
          />

          <div
            className={`rounded-lg border border-dashed p-5 transition-colors ${
              isDraggingImage ? "border-primary bg-primary/5" : "border-border"
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
                  className="h-44 w-full max-w-md rounded-md border bg-cover bg-center bg-no-repeat"
                  role="img"
                  style={{ backgroundImage: `url(${imagePreviewUrl})` }}
                />
              ) : (
                <div className="flex h-24 w-full max-w-md items-center justify-center rounded-md border bg-muted/40">
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
                  onClick={() => imageInputRef.current?.click()}
                  type="button"
                  variant="outline"
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Chọn ảnh
                </Button>
                {imageFile ? (
                  <Button
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
          <Button disabled={isSaving} type="submit">
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
