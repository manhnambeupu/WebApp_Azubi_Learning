"use client";

import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { QuizResult } from "@/types";

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
          {result.correctCount}/{result.totalQuestions} câu đúng)
        </h2>
        <Progress className="h-2.5" value={result.score} />
      </div>

      <Separator />

      <div className="space-y-4">
        {result.questions.map((question, questionIndex) => (
          <div className="space-y-3 rounded-lg border p-4" key={question.id}>
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                Câu {questionIndex + 1}: {question.text}
              </p>
              <p
                className={cn(
                  "text-xs font-medium",
                  question.isCorrect ? "text-emerald-700" : "text-rose-700",
                )}
              >
                {question.isCorrect ? "Bạn trả lời đúng" : "Bạn trả lời sai"}
              </p>
            </div>

            <div className="space-y-2">
              {question.answers.map((answer) => {
                const isSelected = answer.id === question.selectedAnswerId;
                return (
                  <div
                    className={cn(
                      "rounded-md border p-3",
                      answer.isCorrect ? "border-emerald-300 bg-emerald-50/80" : "",
                      isSelected && !answer.isCorrect
                        ? "border-rose-300 bg-rose-50/80"
                        : "",
                    )}
                    key={answer.id}
                  >
                    <div className="flex items-start gap-2">
                      {answer.isCorrect ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                      )}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm">{answer.text}</p>
                          {isSelected ? (
                            <Badge variant="outline">Bạn đã chọn</Badge>
                          ) : null}
                          {answer.isCorrect ? (
                            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                              Đáp án đúng
                            </Badge>
                          ) : null}
                        </div>
                        {answer.explanation ? (
                          <p className="text-xs text-muted-foreground">
                            {answer.explanation}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {question.explanation ? (
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Giải thích câu hỏi
                </p>
                <p className="mt-1 text-sm">{question.explanation}</p>
              </div>
            ) : null}
          </div>
        ))}
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
