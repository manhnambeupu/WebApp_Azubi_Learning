"use client";

import { Loader2, Send } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitQuiz } from "@/hooks/use-submissions";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { QuizResult, StudentQuestion } from "@/types";

type QuizFormProps = {
  lessonId: string;
  questions: StudentQuestion[];
  onSubmitted: (result: QuizResult) => void;
};

const getQuestionInstruction = (question: StudentQuestion): string => {
  switch (question.type) {
    case "MULTIPLE_CHOICE":
      return "Chọn tất cả đáp án bạn cho là đúng.";
    case "ESSAY":
      return "Tự suy nghĩ đáp án, sau khi nộp bài bạn sẽ xem được đáp án mẫu.";
    default:
      return "Chọn một đáp án đúng nhất.";
  }
};

const isQuestionAnswered = (
  question: StudentQuestion,
  selectedAnswerIds: string[] | undefined,
): boolean => question.type === "ESSAY" || (selectedAnswerIds?.length ?? 0) > 0;

export function QuizForm({ lessonId, questions, onSubmitted }: QuizFormProps) {
  const { toast } = useToast();
  const submitQuizMutation = useSubmitQuiz(lessonId);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const totalQuestions = questions.length;
  const answeredCount = useMemo(
    () =>
      questions.filter((question) =>
        isQuestionAnswered(question, selectedAnswers[question.id]),
      ).length,
    [questions, selectedAnswers],
  );
  const isFullyAnswered = answeredCount === totalQuestions && totalQuestions > 0;

  const handleSingleChoiceChange = (questionId: string, answerId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerId ? [answerId] : [],
    }));
  };

  const handleMultipleChoiceChange = (
    questionId: string,
    answerId: string,
    checked: boolean,
  ) => {
    setSelectedAnswers((prev) => {
      const currentAnswerIds = prev[questionId] ?? [];
      const nextAnswerIds = checked
        ? currentAnswerIds.includes(answerId)
          ? currentAnswerIds
          : [...currentAnswerIds, answerId]
        : currentAnswerIds.filter((currentAnswerId) => currentAnswerId !== answerId);

      return {
        ...prev,
        [questionId]: nextAnswerIds,
      };
    });
  };

  const handleOpenConfirm = () => {
    if (!isFullyAnswered) {
      toast({
        title: "Bạn chưa hoàn thành bài làm",
        description:
          "Vui lòng chọn đáp án cho tất cả câu hỏi trắc nghiệm trước khi nộp bài.",
        variant: "destructive",
      });
      return;
    }

    setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    if (!isFullyAnswered) {
      return;
    }

    try {
      const result = await submitQuizMutation.mutateAsync({
        answers: questions.map((question) => ({
          questionId: question.id,
          answerIds: selectedAnswers[question.id] ?? [],
        })),
      });
      setConfirmOpen(false);
      onSubmitted(result);
      toast({
        title: "Nộp bài thành công",
        description: `Bạn đã hoàn thành lần nộp #${result.attemptNumber}.`,
      });
    } catch (error) {
      toast({
        title: "Không thể nộp bài",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <section className="space-y-5 rounded-lg border bg-background p-6 shadow-sm transition-all">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Phần làm bài</h2>
        <p className="text-sm text-muted-foreground">
          Tùy loại câu hỏi, bạn có thể chọn một đáp án, nhiều đáp án hoặc tự suy nghĩ
          đáp án cho phần tự luận.
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Đã trả lời {answeredCount}/{totalQuestions} câu
            </span>
            <span>{Math.round((answeredCount / Math.max(totalQuestions, 1)) * 100)}%</span>
          </div>
          <Progress value={(answeredCount / Math.max(totalQuestions, 1)) * 100} />
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question, questionIndex) => {
          const selectedAnswerIds = selectedAnswers[question.id] ?? [];

          return (
            <div className="space-y-3 rounded-lg border p-4" key={question.id}>
              <div className="space-y-1">
                <p className="font-medium">
                  Câu {questionIndex + 1}: {question.text}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getQuestionInstruction(question)}
                </p>
              </div>

              {question.type === "ESSAY" ? (
                <div className="rounded-md border border-dashed bg-muted/20 p-3">
                  <Textarea
                    className="min-h-32 resize-y bg-background/70 text-muted-foreground"
                    placeholder="Hãy tự suy nghĩ đáp án trong đầu. Sau khi nộp bài bạn sẽ xem được đáp án mẫu."
                    readOnly
                    tabIndex={-1}
                    value=""
                  />
                </div>
              ) : question.type === "MULTIPLE_CHOICE" ? (
                <div className="space-y-3">
                  {question.answers.map((answer, answerIndex) => {
                    const answerLabel = String.fromCharCode(65 + answerIndex);
                    const checkboxId = `${question.id}-${answer.id}`;
                    const isSelected = selectedAnswerIds.includes(answer.id);

                    return (
                      <Label
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                          isSelected ? "border-primary bg-primary/5" : "",
                        )}
                        htmlFor={checkboxId}
                        key={answer.id}
                      >
                        <Checkbox
                          checked={isSelected}
                          id={checkboxId}
                          onCheckedChange={(checked) =>
                            handleMultipleChoiceChange(
                              question.id,
                              answer.id,
                              checked === true,
                            )
                          }
                        />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">
                            Đáp án {answerLabel}
                          </p>
                          <p className="text-sm">{answer.text}</p>
                        </div>
                      </Label>
                    );
                  })}
                </div>
              ) : (
                <RadioGroup
                  onValueChange={(answerId) =>
                    handleSingleChoiceChange(question.id, answerId)
                  }
                  value={selectedAnswerIds[0] ?? ""}
                >
                  {question.answers.map((answer, answerIndex) => {
                    const answerLabel = String.fromCharCode(65 + answerIndex);
                    const radioId = `${question.id}-${answer.id}`;
                    const isSelected = selectedAnswerIds[0] === answer.id;

                    return (
                      <Label
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                          isSelected ? "border-primary bg-primary/5" : "",
                        )}
                        htmlFor={radioId}
                        key={answer.id}
                      >
                        <RadioGroupItem id={radioId} value={answer.id} />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">
                            Đáp án {answerLabel}
                          </p>
                          <p className="text-sm">{answer.text}</p>
                        </div>
                      </Label>
                    );
                  })}
                </RadioGroup>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button
          disabled={submitQuizMutation.isPending || totalQuestions === 0}
          onClick={handleOpenConfirm}
          type="button"
        >
          {submitQuizMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang nộp bài...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Nộp bài
            </>
          )}
        </Button>
      </div>

      <AlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn muốn nộp bài ngay bây giờ?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn nộp bài? Sau khi nộp, bạn sẽ thấy kết quả và giải
              thích.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitQuizMutation.isPending}
              onClick={() => {
                void handleSubmit();
              }}
            >
              Xác nhận nộp bài
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
