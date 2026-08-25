"use client";

import dynamic from "next/dynamic";
import { ArrowDown, ArrowUp, Loader2, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useDeleteQuestion,
  useGetQuestions,
  useReorderQuestions,
} from "@/hooks/use-questions";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { QuestionDetail, QuestionType } from "@/types";

type QuestionListProps = {
  lessonId: string;
};

const QuestionFormDialog = dynamic(
  () => import("./question-form-dialog").then((mod) => mod.QuestionFormDialog),
  {
    ssr: false,
    loading: () => (
      <p className="text-xs font-bold text-[#777777] dark:text-slate-400">Đang tải hộp thoại câu hỏi...</p>
    ),
  },
);

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Chọn 1 đáp án",
  MULTIPLE_CHOICE: "Chọn nhiều đáp án",
  ESSAY: "Tự luận",
  IMAGE_ESSAY: "Ảnh (Tự luận)",
  ORDERING: "Sắp xếp",
  MATCHING: "Ghép đôi",
};

export function QuestionList({ lessonId }: QuestionListProps) {
  const { toast } = useToast();
  const questionsQuery = useGetQuestions(lessonId);
  const deleteQuestionMutation = useDeleteQuestion(lessonId);
  const reorderQuestionsMutation = useReorderQuestions(lessonId);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingReorderId, setPendingReorderId] = useState<string | null>(null);

  const questions = useMemo(
    () => (questionsQuery.data ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex),
    [questionsQuery.data],
  );

  const handleDeleteQuestion = async (questionId: string) => {
    setPendingDeleteId(questionId);
    try {
      await deleteQuestionMutation.mutateAsync(questionId);
      toast({
        title: "Đã xóa câu hỏi",
      });
    } catch (error) {
      toast({
        title: "Không thể xóa câu hỏi",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleReorderQuestion = async (questionId: string, direction: "up" | "down") => {
    const currentIndex = questions.findIndex((question) => question.id === questionId);
    if (currentIndex === -1) {
      return;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) {
      return;
    }

    const reorderedIds = questions.map((question) => question.id);
    const [movedQuestionId] = reorderedIds.splice(currentIndex, 1);
    reorderedIds.splice(targetIndex, 0, movedQuestionId);

    setPendingReorderId(questionId);
    try {
      await reorderQuestionsMutation.mutateAsync(reorderedIds);
      toast({
        title: "Cập nhật thứ tự câu hỏi thành công",
      });
    } catch (error) {
      toast({
        title: "Không thể thay đổi thứ tự câu hỏi",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setPendingReorderId(null);
    }
  };

  return (
    <section className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-6 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#e5e5e5] pb-4 dark:border-[#2b3940]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#58cc02]/30 bg-[#e8f5e1] px-3 py-1 text-xs font-extrabold text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]">
            Quiz Builder
          </div>
          <h2 className="text-xl font-extrabold text-[#3c3c3c] dark:text-white">
            Ngân hàng câu hỏi & Đáp án
          </h2>
          <p className="text-xs font-bold text-[#777777] dark:text-slate-400">
            Quản lý câu hỏi trắc nghiệm, tự luận, sắp xếp thứ tự và ghép đôi.
          </p>
        </div>

        <QuestionFormDialog
          lessonId={lessonId}
          trigger={
            <Button
              className="h-10 rounded-xl border-b-4 border-[#46a302] bg-[#58cc02] px-4 text-xs font-extrabold text-white transition-all hover:bg-[#46a302] active:translate-y-0.5 active:border-b-2"
              size="sm"
            >
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Thêm câu hỏi
            </Button>
          }
        />
      </div>

      <div className="pt-4">
        {questionsQuery.isLoading ? (
          <div className="flex items-center gap-2 rounded-2xl border-2 border-[#58cc02]/30 bg-[#e8f5e1] p-4 text-xs font-extrabold text-[#46a302]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải danh sách câu hỏi...
          </div>
        ) : null}

        {questionsQuery.isError ? (
          <p className="rounded-2xl border-2 border-[#ff4b4b]/40 bg-[#ffebee] p-3 text-xs font-extrabold text-[#ff4b4b] dark:bg-[#ff4b4b]/15">
            {getApiErrorMessage(questionsQuery.error)}
          </p>
        ) : null}

        {questionsQuery.data ? (
          questions.length === 0 ? (
            <p className="rounded-2xl border-2 border-dashed border-[#e5e5e5] bg-[#f7f7f7] px-4 py-8 text-center text-xs font-bold text-[#777777] dark:border-[#2b3940] dark:bg-[#111b21] dark:text-slate-400">
              Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên cho bài học.
            </p>
          ) : (
            <Accordion className="w-full space-y-3" collapsible type="single">
              {questions.map((question, index) => (
                <AccordionItem
                  className="overflow-hidden rounded-2xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-[#f7f7f7] px-4 transition-all data-[state=open]:border-[#58cc02] data-[state=open]:bg-white dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#111b21] dark:data-[state=open]:bg-[#131f24]"
                  key={question.id}
                  value={question.id}
                >
                  <div className="flex flex-col gap-2 py-1 sm:flex-row sm:items-start sm:justify-between">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="space-y-1.5 text-left">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge className="rounded-full border-2 border-[#58cc02]/30 bg-[#e8f5e1] px-2 py-0.5 text-[11px] font-extrabold text-[#46a302]" variant="outline">
                            #{question.orderIndex}
                          </Badge>
                          <Badge className="rounded-full border-2 border-[#0284c7]/30 bg-[#e0f2fe] px-2 py-0.5 text-[11px] font-extrabold text-[#0284c7]">
                            {QUESTION_TYPE_LABELS[question.type]}
                          </Badge>
                          <Badge className="rounded-full border-2 border-[#ffc800]/30 bg-[#fef9e7] px-2 py-0.5 text-[11px] font-extrabold text-[#d97706]" variant="secondary">
                            {question.answers.length} đáp án
                          </Badge>
                          {question.isPrivate ? (
                            <Badge className="rounded-full border-2 border-[#ff4b4b]/30 bg-[#ffebee] px-2 py-0.5 text-[11px] font-extrabold text-[#ff4b4b]">
                              🔒 VIP
                            </Badge>
                          ) : null}
                        </div>
                        <p className="line-clamp-2 text-xs font-extrabold text-[#3c3c3c] dark:text-white">
                          {question.text}
                        </p>
                      </div>
                    </AccordionTrigger>

                    <div className="flex flex-wrap items-center justify-end gap-1.5 pb-2 sm:pb-0 sm:pt-2">
                      <Button
                        className="h-8 w-8 rounded-xl border-2 border-[#e5e5e5] bg-white text-[#777777] hover:border-[#58cc02] hover:text-[#46a302] dark:border-[#2b3940] dark:bg-[#18252d]"
                        disabled={index === 0 || pendingReorderId === question.id}
                        onClick={() => {
                          void handleReorderQuestion(question.id, "up");
                        }}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <ArrowUp className="h-4 w-4" />
                        <span className="sr-only">Di chuyển lên</span>
                      </Button>
                      <Button
                        className="h-8 w-8 rounded-xl border-2 border-[#e5e5e5] bg-white text-[#777777] hover:border-[#58cc02] hover:text-[#46a302] dark:border-[#2b3940] dark:bg-[#18252d]"
                        disabled={index === questions.length - 1 || pendingReorderId === question.id}
                        onClick={() => {
                          void handleReorderQuestion(question.id, "down");
                        }}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <ArrowDown className="h-4 w-4" />
                        <span className="sr-only">Di chuyển xuống</span>
                      </Button>

                      <QuestionFormDialog
                        initialData={question}
                        lessonId={lessonId}
                        trigger={
                          <Button
                            className="h-8 rounded-xl border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white px-2.5 text-xs font-extrabold text-[#3c3c3c] hover:border-[#58cc02] hover:text-[#46a302] active:translate-y-0.5 active:border-b-2 dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#18252d] dark:text-white"
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Sửa
                          </Button>
                        }
                      />

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            className="h-8 rounded-xl border-2 border-[#ff4b4b]/30 border-b-4 border-b-[#e03838] bg-[#ffebee] px-2.5 text-xs font-extrabold text-[#ff4b4b] hover:bg-[#ffdada] active:translate-y-0.5 active:border-b-2 dark:border-[#ff4b4b]/40 dark:border-b-[#ff4b4b]/80 dark:bg-[#ff4b4b]/20"
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Xóa
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[24px] border-2 border-[#e5e5e5] bg-white p-6 dark:border-[#2b3940] dark:bg-[#131f24]">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg font-extrabold text-[#3c3c3c] dark:text-white">
                              Xóa câu hỏi này?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-xs font-bold text-[#777777] dark:text-slate-400">
                              Hành động này sẽ xóa câu hỏi cùng toàn bộ đáp án liên quan. Bạn có chắc chắn?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-4 gap-2">
                            <AlertDialogCancel className="rounded-xl border-2 border-[#e5e5e5] font-extrabold text-[#3c3c3c] dark:border-[#2b3940] dark:text-white">
                              Hủy
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="rounded-xl border-b-4 border-[#e03838] bg-[#ff4b4b] font-extrabold text-white hover:bg-[#e03838]"
                              disabled={pendingDeleteId === question.id}
                              onClick={() => {
                                void handleDeleteQuestion(question.id);
                              }}
                            >
                              {pendingDeleteId === question.id ? "Đang xóa..." : "Xác nhận xóa"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <AccordionContent className="border-t-2 border-[#e5e5e5] pt-3 text-xs dark:border-[#2b3940]">
                    <div className="space-y-2">
                      <p className="font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                        Danh sách đáp án:
                      </p>
                      <div className="grid gap-2">
                        {question.answers.map((answer) => (
                          <div
                            className={cn(
                              "flex items-start justify-between rounded-xl border-2 p-3 font-bold",
                              answer.isCorrect
                                ? "border-[#58cc02]/40 bg-[#e8f5e1] text-[#46a302] dark:bg-[#58cc02]/20 dark:text-[#58cc02]"
                                : "border-[#e5e5e5] bg-white text-[#3c3c3c] dark:border-[#2b3940] dark:bg-[#131f24] dark:text-white",
                            )}
                            key={answer.id}
                          >
                            <div className="space-y-1">
                              <p>{answer.text}</p>
                              {answer.explanation ? (
                                <p className="text-[11px] font-medium text-[#777777] dark:text-slate-400">
                                  Giải thích: {answer.explanation}
                                </p>
                              ) : null}
                            </div>
                            {answer.isCorrect ? (
                              <Badge className="rounded-full bg-[#58cc02] text-white">Đúng</Badge>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )
        ) : null}
      </div>
    </section>
  );
}
