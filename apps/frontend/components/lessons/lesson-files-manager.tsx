"use client";

import { Download, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useDeleteLessonFile, useGetLessonFileDownloadUrl, useUploadLessonFile } from "@/hooks/use-lessons";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import type { LessonFile } from "@/types";

const MAX_DOCX_SIZE_BYTES = 20 * 1024 * 1024;

type LessonFilesManagerProps = {
  lessonId: string;
  files: LessonFile[];
};

const formatUploadedAt = (value: string): string =>
  new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function LessonFilesManager({ lessonId, files }: LessonFilesManagerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingDeleteFileId, setPendingDeleteFileId] = useState<string | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  const uploadFileMutation = useUploadLessonFile(lessonId);
  const deleteFileMutation = useDeleteLessonFile(lessonId);
  const downloadFileMutation = useGetLessonFileDownloadUrl(lessonId);

  const validateDocxFile = (file: File): boolean => {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      toast({
        title: "File không hợp lệ",
        description: "Vui lòng chọn file Word định dạng .docx.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > MAX_DOCX_SIZE_BYTES) {
      toast({
        title: "File vượt quá dung lượng",
        description: "Dung lượng tối đa cho file Word là 20MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleUploadFile = async (file: File) => {
    if (!validateDocxFile(file)) {
      return;
    }

    try {
      await uploadFileMutation.mutateAsync(file);
      toast({
        title: "Upload thành công",
        description: "File Word đã được đính kèm vào bài học.",
      });
    } catch (error) {
      toast({
        title: "Không thể upload file",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    setPendingDeleteFileId(fileId);
    try {
      await deleteFileMutation.mutateAsync(fileId);
      toast({
        title: "Đã xóa file",
        description: "File đính kèm đã được xóa khỏi bài học.",
      });
    } catch (error) {
      toast({
        title: "Không thể xóa file",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setPendingDeleteFileId(null);
    }
  };

  const handleDownloadFile = async (fileId: string) => {
    setDownloadingFileId(fileId);
    try {
      const response = await downloadFileMutation.mutateAsync(fileId);
      window.open(response.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({
        title: "Không thể tải file",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setDownloadingFileId(null);
    }
  };

  return (
    <section className="space-y-5 rounded-lg border bg-background p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">File Word đính kèm</h2>
          <p className="text-sm text-muted-foreground">
            Upload tài liệu bài học định dạng .docx (tối đa 20MB).
          </p>
        </div>

        <div>
          <input
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleUploadFile(file);
              }
              event.currentTarget.value = "";
            }}
            ref={fileInputRef}
            type="file"
          />
          <Button
            disabled={uploadFileMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
            type="button"
            variant="outline"
          >
            {uploadFileMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang upload...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload file Word
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator />

      {files.length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Chưa có file Word nào được đính kèm.
        </p>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
              key={file.id}
            >
              <div className="space-y-1">
                <p className="font-medium">{file.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  Upload lúc: {formatUploadedAt(file.uploadedAt)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  disabled={downloadingFileId === file.id}
                  onClick={() => {
                    void handleDownloadFile(file.id);
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {downloadingFileId === file.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lấy link...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </>
                  )}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" type="button" variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xóa file đính kèm?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Hành động này không thể hoàn tác. File Word sẽ bị xóa vĩnh viễn khỏi
                        bài học.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={pendingDeleteFileId === file.id}
                        onClick={() => {
                          void handleDeleteFile(file.id);
                        }}
                      >
                        {pendingDeleteFileId === file.id ? "Đang xóa..." : "Xóa file"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
