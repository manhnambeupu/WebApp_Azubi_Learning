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
import { Separator } from "@/components/ui/separator";
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
      <p className="text-xs text-muted-foreground">Đang tải hộp thoại câu hỏi...</p>
    ),
  },
);

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
    <section className="kokonut-glass-card space-y-5 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/75">
            Quiz Builder
          </p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Câu hỏi & Đáp án
          </h2>
          <p className="text-sm text-muted-foreground">
            Quản lý câu hỏi trắc nghiệm, tự luận, sắp xếp thứ tự và ghép đôi trong từng thẻ
            accordion để tránh quá tải nội dung.
          </p>
        </div>

        <QuestionFormDialog
          lessonId={lessonId}
          trigger={
            <Button
              className="rounded-xl bg-gradient-to-r from-primary via-blue-600 to-amber-500 text-primary-foreground shadow-[0_14px_32px_-20px_rgba(37,99,235,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-amber-500 hover:shadow-[0_16px_34px_-18px_rgba(245,158,11,0.75)]"
              size="sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm câu hỏi
            </Button>
          }
        />
      </div>

      <Separator />

      {questionsQuery.isLoading ? (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-muted-foreground dark:border-slate-700/70 dark:bg-slate-900/45">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải danh sách câu hỏi...
        </div>
      ) : null}

      {questionsQuery.isError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {getApiErrorMessage(questionsQuery.error)}
        </p>
      ) : null}

      {questionsQuery.data ? (
        questions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300/80 bg-white/70 px-4 py-8 text-center text-sm text-muted-foreground dark:border-slate-700/80 dark:bg-slate-900/45">
            Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên cho bài học.
          </p>
        ) : (
          <Accordion className="w-full space-y-4" collapsible type="single">
            {questions.map((question, index) => (
              <AccordionItem
                className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 px-4 shadow-[0_14px_30px_-26px_rgba(15,23,42,0.65)] transition-all duration-300 data-[state=open]:border-primary/35 data-[state=open]:shadow-[0_20px_40px_-28px_rgba(37,99,235,0.85)] hover:-translate-y-0.5 hover:border-amber-300/65 hover:shadow-[0_20px_40px_-26px_rgba(245,158,11,0.6)] dark:border-slate-700/80 dark:bg-slate-900/55"
                key={question.id}
                value={question.id}
              >
                <div className="flex flex-col gap-2 py-1 sm:flex-row sm:items-start sm:justify-between">
                  <AccordionTrigger className="py-4 hover:no-underline">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="border-primary/30 bg-primary/10 text-primary" variant="outline">
                          #{question.orderIndex}
                        </Badge>
                        <Badge className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                          {QUESTION_TYPE_LABELS[question.type]}
                        </Badge>
                        <Badge className="bg-amber-100/80 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100" variant="secondary">
                          {question.answers.length} đáp án
                        </Badge>
                      </div>
                      <p className="line-clamp-2 text-left text-sm font-medium text-slate-800 dark:text-slate-100">
                        {question.text}
                      </p>
                    </div>
                  </AccordionTrigger>

                  <div className="flex flex-wrap items-center justify-end gap-2 pb-2 sm:pb-0">
                    <Button
                      className="text-slate-600 transition-all hover:bg-primary/10 hover:text-primary dark:text-slate-300 dark:hover:bg-primary/20"
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
                      className="text-slate-600 transition-all hover:bg-primary/10 hover:text-primary dark:text-slate-300 dark:hover:bg-primary/20"
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
                          className="border-primary/25 bg-white/90 text-primary transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/10 hover:text-primary dark:bg-slate-950/70"
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Sửa
                        </Button>
                      }
                    />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className="transition-all hover:-translate-y-0.5"
                          size="sm"
                          type="button"
                          variant="destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xóa câu hỏi?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Xóa câu hỏi sẽ xóa tất cả đáp án và kết quả làm bài liên quan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

                <AccordionContent className="space-y-4 pb-4">
                  {question.explanation ? (
                    <div className="space-y-1 rounded-xl border border-slate-200/80 bg-white p-3 dark:border-slate-700/80 dark:bg-slate-950/75">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Giải thích câu hỏi
                      </p>
                      <p className="text-sm">{question.explanation}</p>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    {(question.type === "ORDERING"
                      ? [...question.answers].sort(
                          (left, right) =>
                            (left.orderIndex ?? Number.MAX_SAFE_INTEGER) -
                            (right.orderIndex ?? Number.MAX_SAFE_INTEGER),
                        )
                      : question.answers
                    ).map((answer, answerIndex) => (
                      <AnswerCard
                        answer={answer}
                        answerIndex={answerIndex}
                        key={answer.id}
                        questionType={question.type}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )
      ) : null}
    </section>
  );
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Chọn 1 đáp án",
  MULTIPLE_CHOICE: "Chọn nhiều đáp án",
  ESSAY: "Tự luận",
  IMAGE_ESSAY: "Câu hỏi Ảnh (Tự luận)",
  ORDERING: "Sắp xếp thứ tự",
  MATCHING: "Ghép đôi",
};

function AnswerCard({
  answer,
  answerIndex,
  questionType,
}: {
  answer: QuestionDetail["answers"][number];
  answerIndex: number;
  questionType: QuestionType;
}) {
  const answerLabel = String.fromCharCode(65 + answerIndex);
  const isEssayQuestion =
    questionType === "ESSAY" || questionType === "IMAGE_ESSAY";
  const isChoiceQuestion =
    questionType === "SINGLE_CHOICE" || questionType === "MULTIPLE_CHOICE";
  const isOrderingQuestion = questionType === "ORDERING";
  const isMatchingQuestion = questionType === "MATCHING";
  const answerText = isMatchingQuestion
    ? `${answer.text} ↔ ${answer.matchText ?? "—"}`
    : answer.text;

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_12px_26px_-24px_rgba(15,23,42,0.7)] dark:border-slate-700/80 dark:bg-slate-950/70",
        isChoiceQuestion && answer.isCorrect
          ? "border-emerald-300/80 bg-emerald-50/80 shadow-[0_16px_28px_-20px_rgba(16,185,129,0.45)] dark:border-emerald-500/60 dark:bg-emerald-500/10"
          : "",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{answerLabel}</Badge>
        {isEssayQuestion ? (
          <Badge className="bg-sky-600 text-white hover:bg-sky-600">Mẫu</Badge>
        ) : isOrderingQuestion ? (
          <Badge variant="outline">Bước</Badge>
        ) : isMatchingQuestion ? (
          <Badge className="bg-indigo-600 text-white hover:bg-indigo-600">Cặp đúng</Badge>
        ) : answer.isCorrect ? (
          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Đúng</Badge>
        ) : (
          <Badge variant="outline">Sai</Badge>
        )}
        <p className="text-sm font-medium">{answerText}</p>
      </div>
      {isOrderingQuestion ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Thứ tự đúng: {answer.orderIndex ?? answerIndex + 1}
        </p>
      ) : null}
      {answer.explanation ? (
        <p className="mt-2 text-xs text-muted-foreground">{answer.explanation}</p>
      ) : null}
    </div>
  );
}
