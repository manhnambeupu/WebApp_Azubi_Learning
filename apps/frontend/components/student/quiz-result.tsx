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
  if (question.type === "ESSAY" || question.type === "IMAGE_ESSAY") {
    return {
      className: "text-amber-800",
      label: "Câu tự luận không được chấm điểm tự động",
    };
  }

  if (question.isCorrect) {
    return {
      className: "text-emerald-800",
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
        className: "text-amber-800",
        label: "Bạn trả lời đúng một phần",
      };
    }
  }

  if (question.type === "MATCHING") {
    const selectedMatchesByAnswerId = new Map(
      question.selectedMatches.map((selectedMatch) => [
        selectedMatch.answerId,
        selectedMatch.matchText,
      ]),
    );
    const correctPairCount = question.answers.reduce((count, answer) => {
      if (
        answer.matchText !== null &&
        selectedMatchesByAnswerId.get(answer.id) === answer.matchText
      ) {
        return count + 1;
      }

      return count;
    }, 0);

    if (correctPairCount > 0) {
      return {
        className: "text-amber-800",
        label: "Bạn ghép đúng một phần",
      };
    }
  }

  if (question.type === "ORDERING") {
    const normalizedSelectedAnswerIds = getNormalizedSelectedAnswerIds(question);
    const orderedCorrectAnswers = [...question.answers].sort(
      (left, right) =>
        (left.orderIndex ?? Number.MAX_SAFE_INTEGER) -
        (right.orderIndex ?? Number.MAX_SAFE_INTEGER),
    );
    const correctPositionCount = orderedCorrectAnswers.reduce(
      (count, answer, index) =>
        normalizedSelectedAnswerIds[index] === answer.id ? count + 1 : count,
      0,
    );

    if (correctPositionCount > 0) {
      return {
        className: "text-amber-800",
        label: "Bạn sắp xếp đúng một phần vị trí",
      };
    }
  }

  return {
    className: "text-rose-800",
    label: "Bạn trả lời sai",
  };
};

const getAnswerContainerClass = (isCorrect: boolean, isSelected: boolean): string =>
  cn(
    "rounded-lg border border-slate-200/80 bg-white p-3",
    isCorrect ? "border-emerald-300 bg-emerald-50/90" : "",
    isSelected && !isCorrect ? "border-rose-300 bg-rose-50/90" : "",
  );

const getQuestionExplanationText = (question: QuizResultQuestion): string | null => {
  const normalizedQuestionExplanation = question.explanation?.trim();
  if (normalizedQuestionExplanation) {
    return normalizedQuestionExplanation;
  }

  if (question.type === "ORDERING") {
    const orderedCorrectAnswers = [...question.answers].sort(
      (left, right) =>
        (left.orderIndex ?? Number.MAX_SAFE_INTEGER) -
        (right.orderIndex ?? Number.MAX_SAFE_INTEGER),
    );

    if (orderedCorrectAnswers.length === 0) {
      return null;
    }

    return `Thứ tự đúng: ${orderedCorrectAnswers
      .map((answer, index) => `${index + 1}. ${answer.text}`)
      .join(" → ")}`;
  }

  if (question.type === "MATCHING") {
    const correctPairs = question.answers
      .filter(
        (answer): answer is QuizResultQuestion["answers"][number] & { matchText: string } =>
          answer.matchText !== null && answer.matchText.trim().length > 0,
      )
      .map((answer) => `${answer.text} → ${answer.matchText}`);

    if (correctPairs.length === 0) {
      return null;
    }

    return `Cặp ghép đúng:\n- ${correctPairs.join("\n- ")}`;
  }

  return null;
};

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

function OrderingResultRows({ question }: { question: QuizResultQuestion }) {
  const normalizedSelectedAnswerIds = getNormalizedSelectedAnswerIds(question);
  const answerById = new Map(question.answers.map((answer) => [answer.id, answer] as const));
  const orderedCorrectAnswers = [...question.answers].sort(
    (left, right) =>
      (left.orderIndex ?? Number.MAX_SAFE_INTEGER) -
      (right.orderIndex ?? Number.MAX_SAFE_INTEGER),
  );

  return (
    <div className="space-y-2">
      {orderedCorrectAnswers.map((correctAnswer, index) => {
        const selectedAnswerId = normalizedSelectedAnswerIds[index];
        const selectedAnswer =
          selectedAnswerId !== undefined ? answerById.get(selectedAnswerId) : undefined;
        const isPositionCorrect = selectedAnswerId === correctAnswer.id;

        return (
          <div
            className={cn(
              "rounded-lg border p-3",
              isPositionCorrect
                ? "border-emerald-300 bg-emerald-50/90"
                : "border-rose-300 bg-rose-50/90",
            )}
            key={correctAnswer.id}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Vị trí #{index + 1}</Badge>
              <p className="text-sm">
                Bạn xếp: {selectedAnswer?.text ?? "Chưa có đáp án"}
              </p>
              <Badge
                className={
                  isPositionCorrect
                    ? "bg-emerald-600 text-white hover:bg-emerald-600"
                    : "bg-rose-600 text-white hover:bg-rose-600"
                }
              >
                {isPositionCorrect ? "Đúng" : "Sai"}
              </Badge>
            </div>
            {!isPositionCorrect ? (
              <p className="mt-1 text-xs text-rose-800">
                Đáp án đúng là: {correctAnswer.text}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function MatchingResultRows({ question }: { question: QuizResultQuestion }) {
  const selectedMatchesByAnswerId = new Map(
    question.selectedMatches.map((selectedMatch) => [
      selectedMatch.answerId,
      selectedMatch.matchText,
    ]),
  );

  return (
    <div className="space-y-2">
      {question.answers.map((answer) => {
        const selectedMatchText = selectedMatchesByAnswerId.get(answer.id) ?? "Chưa chọn";
        const correctMatchText = answer.matchText ?? "Không có đáp án chuẩn";
        const isPairCorrect =
          answer.matchText !== null && selectedMatchText === answer.matchText;

        return (
          <div
            className={cn(
              "rounded-lg border p-3",
              isPairCorrect
                ? "border-emerald-300 bg-emerald-50/90"
                : "border-rose-300 bg-rose-50/90",
            )}
            key={answer.id}
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm">
                <span className="font-medium">{answer.text}</span> {"->"} {selectedMatchText}
              </p>
              <Badge
                className={
                  isPairCorrect
                    ? "bg-emerald-600 text-white hover:bg-emerald-600"
                    : "bg-rose-600 text-white hover:bg-rose-600"
                }
              >
                {isPairCorrect ? "Đúng" : "Sai"}
              </Badge>
            </div>
            {!isPairCorrect ? (
              <p className="mt-1 text-xs text-rose-800">
                Đáp án đúng là: {correctMatchText}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function QuizResult({ result, onRetry, showActions = true }: QuizResultProps) {
  return (
    <section className="space-y-6 rounded-2xl border border-border/70 bg-white p-6 shadow-sm transition-all">
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
        <Progress className="h-3" value={result.score} />
      </div>

      <Separator />

      <div className="space-y-4">
        {result.questions.map((question, questionIndex) => {
          const status = getQuestionStatus(question);
          const normalizedSelectedAnswerIds = getNormalizedSelectedAnswerIds(question);
          const selectedAnswerIds = new Set(normalizedSelectedAnswerIds);
          const explanationText = getQuestionExplanationText(question);

          return (
            <div
              className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 shadow-sm"
              key={question.id}
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  Câu {questionIndex + 1}: {question.text}
                </p>
                {question.imageUrl ? (
                  <div className="mt-4 overflow-hidden rounded-xl border border-primary/15 shadow-sm">
                    <img
                      alt="Question"
                      className="max-h-[400px] w-full object-contain bg-slate-50/50"
                      src={question.imageUrl}
                    />
                  </div>
                ) : null}
                <p className={cn("text-xs font-medium", status.className)}>{status.label}</p>
              </div>

              {question.type === "ESSAY" || question.type === "IMAGE_ESSAY" ? (
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
              ) : question.type === "ORDERING" ? (
                <OrderingResultRows question={question} />
              ) : question.type === "MATCHING" ? (
                <MatchingResultRows question={question} />
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

              {explanationText ? (
                <div className="rounded-lg bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Giải thích câu hỏi
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{explanationText}</p>
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
