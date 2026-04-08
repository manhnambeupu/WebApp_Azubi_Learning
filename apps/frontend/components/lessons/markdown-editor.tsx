"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import {
  type ChangeEvent,
  type ImgHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from "react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import type { MarkdownImageUploadResponse } from "@/types";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onUploadImage?: (file: File) => Promise<MarkdownImageUploadResponse>;
  disabled?: boolean;
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const normalizeImageAltText = (fileName: string): string => {
  const baseName = fileName.replace(/\.[^/.]+$/, "").trim();
  return baseName || "image";
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(2)} MB`;
};

const buildMarkdownImageTitle = (
  metadata: MarkdownImageUploadResponse,
): string =>
  [
    `w=${metadata.optimizedWidth}`,
    `h=${metadata.optimizedHeight}`,
    `ow=${metadata.originalWidth}`,
    `oh=${metadata.originalHeight}`,
    `ob=${metadata.originalBytes}`,
    `wb=${metadata.optimizedBytes}`,
  ].join(" ");

const normalizePreviewImageSrc = (src?: string): string | null => {
  if (!src) {
    return null;
  }

  const normalizedSrc = src.trim();
  if (!normalizedSrc || normalizedSrc === "#") {
    return null;
  }

  if (normalizedSrc.startsWith("/")) {
    return normalizedSrc;
  }

  try {
    const parsed = new URL(normalizedSrc);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return normalizedSrc;
    }
  } catch {
    return null;
  }

  return null;
};

const PreviewImage = ({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) => {
  const normalizedSrc = normalizePreviewImageSrc(src);
  if (!normalizedSrc) {
    return null;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={alt ?? ""} src={normalizedSrc} />;
};

export function MarkdownEditor({
  value,
  onChange,
  onUploadImage,
  disabled = false,
}: MarkdownEditorProps) {
  const { toast } = useToast();
  const editorWrapperRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const latestValueRef = useRef(value);
  const selectionRef = useRef({ start: value.length, end: value.length });
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  const syncSelectionFromTextarea = (target: HTMLTextAreaElement) => {
    selectionRef.current = {
      start: target.selectionStart ?? 0,
      end: target.selectionEnd ?? 0,
    };
  };

  const insertMarkdownAtSelection = (snippet: string) => {
    const base = latestValueRef.current;
    let { start, end } = selectionRef.current;
    const baseLength = base.length;

    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      start < 0 ||
      end < start ||
      end > baseLength
    ) {
      start = baseLength;
      end = baseLength;
    }

    const needsLeadingSpace = start > 0 && /\S/.test(base[start - 1] ?? "");
    const needsTrailingSpace = end < baseLength && /\S/.test(base[end] ?? "");
    const insertion = `${needsLeadingSpace ? " " : ""}${snippet}${needsTrailingSpace ? " " : ""}`;
    const nextValue = `${base.slice(0, start)}${insertion}${base.slice(end)}`;
    const nextCursor = start + insertion.length;

    latestValueRef.current = nextValue;
    onChange(nextValue);

    requestAnimationFrame(() => {
      const textarea = editorWrapperRef.current?.querySelector("textarea");
      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
      selectionRef.current = { start: nextCursor, end: nextCursor };
    });
  };

  const resetImageInput = () => {
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const validateImageFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      return "Chỉ hỗ trợ ảnh JPEG, PNG, WEBP, AVIF hoặc GIF.";
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return "Ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.";
    }
    return null;
  };

  const handleImageInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUploadImage) {
      resetImageInput();
      return;
    }

    const validationError = validateImageFile(file);
    if (validationError) {
      toast({
        title: "Ảnh không hợp lệ",
        description: validationError,
        variant: "destructive",
      });
      resetImageInput();
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadResult = await onUploadImage(file);
      const normalizedUrl = uploadResult.imageUrl.trim();
      if (!normalizedUrl) {
        throw new Error("Upload ảnh thành công nhưng không nhận được URL hợp lệ.");
      }

      const imageTitle = buildMarkdownImageTitle(uploadResult);
      insertMarkdownAtSelection(
        `![${normalizeImageAltText(file.name)}](${normalizedUrl} "${imageTitle}")`,
      );

      toast({
        title: "Upload ảnh thành công",
        description: `${uploadResult.originalWidth}x${uploadResult.originalHeight}px → ${uploadResult.optimizedWidth}x${uploadResult.optimizedHeight}px • ${formatBytes(uploadResult.originalBytes)} → ${formatBytes(uploadResult.optimizedBytes)}`,
      });
    } catch (error) {
      toast({
        title: "Không thể upload ảnh",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      resetImageInput();
    }
  };

  const isEditorDisabled = disabled || isUploadingImage;

  return (
    <div className="space-y-3">
      {onUploadImage ? (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <input
            ref={imageInputRef}
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={(event) => {
              void handleImageInputChange(event);
            }}
            type="file"
          />
          <Button
            type="button"
            variant="outline"
            disabled={isEditorDisabled}
            onClick={() => imageInputRef.current?.click()}
          >
            {isUploadingImage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang upload ảnh...
              </>
            ) : (
              <>
                <ImagePlus className="mr-2 h-4 w-4" />
                Upload ảnh vào Markdown
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            Hỗ trợ JPEG/PNG/WEBP/AVIF/GIF, tối đa 5MB.
          </span>
        </div>
      ) : null}

      <div ref={editorWrapperRef} data-color-mode="light">
        <MDEditor
          commandsFilter={(command) =>
            command.name === "image" ? false : command
          }
          height={380}
          // Guard preview rendering only; keep markdown input non-destructive for authors.
          previewOptions={{
            components: {
              img: ({ node: _node, ...props }) => <PreviewImage {...props} />,
            },
          }}
          preview="live"
          value={value}
          onChange={(nextValue) => onChange(nextValue ?? "")}
          textareaProps={{
            disabled: isEditorDisabled,
            onSelect: (event) => syncSelectionFromTextarea(event.currentTarget),
            onClick: (event) => syncSelectionFromTextarea(event.currentTarget),
            onKeyUp: (event) => syncSelectionFromTextarea(event.currentTarget),
          }}
        />
      </div>
    </div>
  );
}
