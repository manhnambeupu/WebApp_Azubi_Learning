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
import { useDeleteLessonFile, useGetLessonFileDownloadUrl, useUploadLessonFile } from "@/hooks/use-lessons";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import type { LessonFile } from "@/types";

const MAX_LESSON_FILE_SIZE_BYTES = 20 * 1024 * 1024;

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

  const validateLessonFile = (file: File): boolean => {
    const allowedExtensions = [".docx", ".pdf"];
    const allowedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/pdf",
    ];
    const extensionIndex = file.name.lastIndexOf(".");
    const ext = extensionIndex >= 0 ? file.name.toLowerCase().slice(extensionIndex) : "";
    const mime = file.type;

    if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(mime)) {
      toast({
        title: "File không hợp lệ",
        description: "Vui lòng chọn file .docx hoặc .pdf.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > MAX_LESSON_FILE_SIZE_BYTES) {
      toast({
        title: "File vượt quá dung lượng",
        description: "Dung lượng tối đa cho file là 20MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleUploadFile = async (file: File) => {
    if (!validateLessonFile(file)) {
      return;
    }

    try {
      await uploadFileMutation.mutateAsync(file);
      toast({
        title: "Upload thành công",
        description: "File tài liệu đã được đính kèm vào bài học.",
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
    <section className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#e5e5e5] pb-4 dark:border-[#2b3940]">
        <div>
          <h2 className="text-xl font-extrabold text-[#3c3c3c] dark:text-white">Tài liệu đính kèm</h2>
          <p className="text-xs font-bold text-[#777777] dark:text-slate-400">
            Tải lên tài liệu bài học định dạng .docx hoặc .pdf (tối đa 20MB).
          </p>
        </div>

        <div>
          <input
            accept=".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
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
            className="h-10 rounded-xl border-2 border-[#58cc02] border-b-4 border-b-[#46a302] bg-[#e8f5e1] text-xs font-extrabold text-[#46a302] hover:bg-[#d5f0ca] active:translate-y-0.5 active:border-b-2 dark:bg-[#58cc02]/20 dark:text-[#58cc02]"
            disabled={uploadFileMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
            type="button"
            variant="ghost"
          >
            {uploadFileMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang upload...
              </>
            ) : (
              <>
                <Upload className="mr-1.5 h-4 w-4" />
                Upload tài liệu
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="pt-4">
        {files.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed border-[#e5e5e5] bg-[#f7f7f7] px-4 py-8 text-center text-xs font-bold text-[#777777] dark:border-[#2b3940] dark:bg-[#111b21] dark:text-slate-400">
            Chưa có file tài liệu nào được đính kèm.
          </p>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                className="flex flex-col gap-3 rounded-2xl border-2 border-[#e5e5e5] bg-[#f7f7f7] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#2b3940] dark:bg-[#111b21]"
                key={file.id}
              >
                <div className="space-y-0.5">
                  <p className="font-extrabold text-[#3c3c3c] dark:text-white">{file.fileName}</p>
                  <p className="text-[11px] font-bold text-[#777777] dark:text-slate-400">
                    Upload lúc: {formatUploadedAt(file.uploadedAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    className="h-9 rounded-xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white px-3 text-xs font-extrabold text-[#3c3c3c] hover:bg-slate-50 active:translate-y-0.5 active:border-b-2 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#18252d] dark:text-white"
                    disabled={downloadingFileId === file.id}
                    onClick={() => {
                      void handleDownloadFile(file.id);
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    {downloadingFileId === file.id ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Đang lấy link...
                      </>
                    ) : (
                      <>
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Download
                      </>
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        className="h-9 rounded-xl border-2 border-[#ff4b4b]/30 border-b-4 border-b-[#e03838] bg-[#ffebee] px-3 text-xs font-extrabold text-[#ff4b4b] hover:bg-[#ffdada] active:translate-y-0.5 active:border-b-2 dark:border-[#ff4b4b]/40 dark:border-b-[#ff4b4b]/80 dark:bg-[#ff4b4b]/20"
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Xóa
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[24px] border-2 border-[#e5e5e5] bg-white p-6 dark:border-[#2b3940] dark:bg-[#131f24]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-extrabold text-[#3c3c3c] dark:text-white">
                          Xóa file đính kèm?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs font-bold text-[#777777] dark:text-slate-400">
                          Hành động này không thể hoàn tác. File tài liệu sẽ bị xóa vĩnh viễn khỏi
                          bài học.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel className="rounded-xl border-2 border-[#e5e5e5] font-extrabold text-[#3c3c3c] dark:border-[#2b3940] dark:text-white">
                          Hủy
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="rounded-xl border-b-4 border-[#e03838] bg-[#ff4b4b] font-extrabold text-white hover:bg-[#e03838]"
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
      </div>
    </section>
  );
}
