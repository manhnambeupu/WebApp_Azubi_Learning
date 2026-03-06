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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

export function QuizForm({ lessonId, questions, onSubmitted }: QuizFormProps) {
  const { toast } = useToast();
  const submitQuizMutation = useSubmitQuiz(lessonId);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const totalQuestions = questions.length;
  const answeredCount = useMemo(
    () =>
      questions.filter((question) => Boolean(selectedAnswers[question.id])).length,
    [questions, selectedAnswers],
  );
  const isFullyAnswered = answeredCount === totalQuestions && totalQuestions > 0;

  const handleOpenConfirm = () => {
    if (!isFullyAnswered) {
      toast({
        title: "Bạn chưa hoàn thành bài làm",
        description: "Vui lòng chọn đáp án cho tất cả câu hỏi trước khi nộp bài.",
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
          answerId: selectedAnswers[question.id],
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
          Mỗi câu chỉ chọn một đáp án. Bạn có thể làm lại sau khi xem kết quả.
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
        {questions.map((question, questionIndex) => (
          <div className="space-y-3 rounded-lg border p-4" key={question.id}>
            <p className="font-medium">
              Câu {questionIndex + 1}: {question.text}
            </p>
            <RadioGroup
              onValueChange={(answerId) =>
                setSelectedAnswers((prev) => ({
                  ...prev,
                  [question.id]: answerId,
                }))
              }
              value={selectedAnswers[question.id] ?? ""}
            >
              {question.answers.map((answer, answerIndex) => {
                const answerLabel = String.fromCharCode(65 + answerIndex);
                const radioId = `${question.id}-${answer.id}`;
                const isSelected = selectedAnswers[question.id] === answer.id;

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
          </div>
        ))}
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
