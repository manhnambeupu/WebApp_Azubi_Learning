"use client";

import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { QuizResult, QuizResultQuestion } from "@/types";

type QuizResultProps = {
  result: QuizResult;
  onRetry?: () => void;
  showActions?: boolean;
};

const scoreBadgeClass = (score: number): string => {
  if (score >= 70) {
    return "bg-emerald-600 text-white hover:bg-emerald-600";
  }

  if (score >= 40) {
    return "bg-amber-500 text-white hover:bg-amber-500";
  }

  return "bg-rose-600 text-white hover:bg-rose-600";
};

const formatScore = (score: number): string =>
  Number.isInteger(score) ? score.toString() : score.toFixed(2);

const formatCorrectCount = (count: number): string =>
  Number.isInteger(count) ? count.toString() : count.toFixed(2);

const getNormalizedSelectedAnswerIds = (question: QuizResultQuestion): string[] => {
  if (question.selectedAnswerIds.length > 0) {
    return [...new Set(question.selectedAnswerIds)];
  }

  return question.selectedAnswerId ? [question.selectedAnswerId] : [];
};

const getQuestionStatus = (
  question: QuizResultQuestion,
): { className: string; label: string } => {
  if (question.type === "ESSAY") {
    return {
      className: "text-amber-700",
      label: "Câu tự luận không được chấm điểm tự động",
    };
  }

  if (question.isCorrect) {
    return {
      className: "text-emerald-700",
      label: "Bạn trả lời đúng",
    };
  }

  if (question.type === "MULTIPLE_CHOICE") {
    const normalizedSelectedAnswerIds = getNormalizedSelectedAnswerIds(question);
    const correctAnswerIds = new Set(
      question.answers.filter((answer) => answer.isCorrect).map((answer) => answer.id),
    );
    const hasWrongSelection = normalizedSelectedAnswerIds.some(
      (answerId) => !correctAnswerIds.has(answerId),
    );
    const selectedCorrectCount = normalizedSelectedAnswerIds.filter((answerId) =>
      correctAnswerIds.has(answerId),
    ).length;

    if (!hasWrongSelection && selectedCorrectCount > 0) {
      return {
        className: "text-amber-700",
        label: "Bạn trả lời đúng một phần",
      };
    }
  }

  return {
    className: "text-rose-700",
    label: "Bạn trả lời sai",
  };
};

const getAnswerContainerClass = (isCorrect: boolean, isSelected: boolean): string =>
  cn(
    "rounded-md border p-3",
    isCorrect ? "border-emerald-300 bg-emerald-50/80" : "",
    isSelected && !isCorrect ? "border-rose-300 bg-rose-50/80" : "",
  );

type ObjectiveAnswerRowProps = {
  answer: QuizResultQuestion["answers"][number];
  control: ReactNode;
  isSelected: boolean;
};

function ObjectiveAnswerRow({ answer, control, isSelected }: ObjectiveAnswerRowProps) {
  return (
    <div className={getAnswerContainerClass(answer.isCorrect, isSelected)}>
      <div className="flex items-start gap-3">
        <div className="pt-0.5">{control}</div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm">{answer.text}</p>
            {isSelected ? <Badge variant="outline">Bạn đã chọn</Badge> : null}
            {answer.isCorrect ? (
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                Đáp án đúng
              </Badge>
            ) : null}
          </div>
          {answer.explanation ? (
            <p className="text-xs text-muted-foreground">{answer.explanation}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function QuizResult({ result, onRetry, showActions = true }: QuizResultProps) {
  return (
    <section className="space-y-5 rounded-lg border bg-background p-6 shadow-sm transition-all">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={scoreBadgeClass(result.score)}>
            {formatScore(result.score)}/100
          </Badge>
          <Badge variant="secondary">Lần nộp #{result.attemptNumber}</Badge>
        </div>
        <h2 className="text-lg font-semibold">
          Kết quả lần {result.attemptNumber}: {formatScore(result.score)}/100 (
          {formatCorrectCount(result.correctCount)}/{result.totalQuestions} câu đúng)
        </h2>
        <p className="text-xs text-muted-foreground">
          Điểm số này chỉ tính trên phần câu hỏi trắc nghiệm khách quan.
        </p>
        <Progress className="h-2.5" value={result.score} />
      </div>

      <Separator />

      <div className="space-y-4">
        {result.questions.map((question, questionIndex) => {
          const status = getQuestionStatus(question);
          const normalizedSelectedAnswerIds = getNormalizedSelectedAnswerIds(question);
          const selectedAnswerIds = new Set(normalizedSelectedAnswerIds);

          return (
            <div className="space-y-3 rounded-lg border p-4" key={question.id}>
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  Câu {questionIndex + 1}: {question.text}
                </p>
                <p className={cn("text-xs font-medium", status.className)}>{status.label}</p>
              </div>

              {question.type === "ESSAY" ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50/80 p-4">
                  <p className="text-xs font-semibold uppercase text-amber-700">
                    Đáp án tự luận mẫu
                  </p>
                  <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                    {question.answers.find((answer) => answer.isCorrect)?.text ??
                      question.answers[0]?.text ??
                      "Chưa có đáp án mẫu."}
                  </div>
                </div>
              ) : question.type === "MULTIPLE_CHOICE" ? (
                <div className="space-y-2">
                  {question.answers.map((answer) => {
                    const isSelected = selectedAnswerIds.has(answer.id);

                    return (
                      <ObjectiveAnswerRow
                        answer={answer}
                        control={
                          <Checkbox
                            checked={isSelected}
                            className="disabled:opacity-100"
                            disabled
                          />
                        }
                        key={answer.id}
                        isSelected={isSelected}
                      />
                    );
                  })}
                </div>
              ) : (
                <RadioGroup value={normalizedSelectedAnswerIds[0] ?? ""}>
                  {question.answers.map((answer) => {
                    const isSelected = selectedAnswerIds.has(answer.id);

                    return (
                      <ObjectiveAnswerRow
                        answer={answer}
                        control={
                          <RadioGroupItem
                            className="disabled:opacity-100"
                            disabled
                            value={answer.id}
                          />
                        }
                        key={answer.id}
                        isSelected={isSelected}
                      />
                    );
                  })}
                </RadioGroup>
              )}

              {question.explanation ? (
                <div className="rounded-md bg-muted/40 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Giải thích câu hỏi
                  </p>
                  <p className="mt-1 text-sm">{question.explanation}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {showActions ? (
        <div className="flex flex-wrap gap-2 pt-2">
          {onRetry ? (
            <Button
              onClick={onRetry}
              type="button"
              variant="outline"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Làm lại
            </Button>
          ) : null}

          <Button asChild type="button">
            <Link href="/student/lessons">Quay lại danh sách bài học</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
