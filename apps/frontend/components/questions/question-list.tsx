"use client";

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
import { QuestionFormDialog } from "./question-form-dialog";

type QuestionListProps = {
  lessonId: string;
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
    <section className="space-y-5 rounded-lg border bg-background p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Câu hỏi & Đáp án</h2>
          <p className="text-sm text-muted-foreground">
            Quản lý câu hỏi trắc nghiệm và tự luận cho bài học hiện tại.
          </p>
        </div>

        <QuestionFormDialog
          lessonId={lessonId}
          trigger={
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Thêm câu hỏi
            </Button>
          }
        />
      </div>

      <Separator />

      {questionsQuery.isLoading ? (
        <div className="flex items-center gap-2 rounded-md border px-4 py-3 text-sm text-muted-foreground">
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
          <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Chưa có câu hỏi nào. Hãy thêm câu hỏi đầu tiên cho bài học.
          </p>
        ) : (
          <Accordion className="w-full" collapsible type="single">
            {questions.map((question, index) => (
              <AccordionItem key={question.id} value={question.id}>
                <div className="flex flex-col gap-2 py-1 sm:flex-row sm:items-start sm:justify-between">
                  <AccordionTrigger className="py-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">#{question.orderIndex}</Badge>
                        <Badge>{QUESTION_TYPE_LABELS[question.type]}</Badge>
                        <Badge variant="secondary">{question.answers.length} đáp án</Badge>
                      </div>
                      <p className="line-clamp-2 text-left text-sm font-medium">
                        {question.text}
                      </p>
                    </div>
                  </AccordionTrigger>

                  <div className="flex flex-wrap items-center justify-end gap-2 pb-2 sm:pb-0">
                    <Button
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
                        <Button size="sm" type="button" variant="outline">
                          <Pencil className="mr-2 h-4 w-4" />
                          Sửa
                        </Button>
                      }
                    />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" type="button" variant="destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xóa câu hỏi?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Xóa câu hỏi sẽ xóa tất cả đáp án và kết quả làm bài liên quan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
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

                <AccordionContent className="space-y-4">
                  {question.explanation ? (
                    <div className="space-y-1 rounded-md bg-muted/40 p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Giải thích câu hỏi
                      </p>
                      <p className="text-sm">{question.explanation}</p>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    {question.answers.map((answer, answerIndex) => (
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

  return (
    <div
      className={cn(
        "rounded-md border p-3",
        answer.isCorrect ? "border-emerald-300 bg-emerald-50/70" : "",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{answerLabel}</Badge>
        {questionType === "ESSAY" ? (
          <Badge className="bg-sky-600 text-white hover:bg-sky-600">Mẫu</Badge>
        ) : answer.isCorrect ? (
          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Đúng</Badge>
        ) : (
          <Badge variant="outline">Sai</Badge>
        )}
        <p className="text-sm font-medium">{answer.text}</p>
      </div>
      {answer.explanation ? (
        <p className="mt-2 text-xs text-muted-foreground">{answer.explanation}</p>
      ) : null}
    </div>
  );
}
