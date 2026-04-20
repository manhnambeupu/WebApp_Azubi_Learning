"use client";

import { arrayMove } from "@dnd-kit/sortable";
import axios from "axios";
import { ChevronDown, ChevronUp, Loader2, Send, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitQuiz } from "@/hooks/use-submissions";
import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { QuizResult, StudentQuestion, SubmitQuizPayload } from "@/types";

type QuizFormProps = {
  lessonId: string;
  questions: StudentQuestion[];
  onSubmitted: (result: QuizResult) => void;
};

type MatchingSelectionsState = Record<string, Record<string, string>>;
type QuizDraft = {
  selectedAnswers: Record<string, string[]>;
  essayInputs: Record<string, string>;
  orderingAnswerIdsByQuestion: Record<string, string[]>;
  matchingSelectionsByQuestion: MatchingSelectionsState;
};

const shuffleArray = <T,>(items: T[]): T[] => {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[randomIndex]] = [
      nextItems[randomIndex],
      nextItems[index],
    ];
  }

  return nextItems;
};

const getQuestionInstruction = (question: StudentQuestion): string => {
  switch (question.type) {
    case "ORDERING":
      return "Bấm nút mũi tên lên để di chuyển thứ tự lên trên, và mũi tên xuống để di chuyển xuống dưới.";
    case "MATCHING":
      return "Chọn vế phải phù hợp cho từng vế trái.";
    case "MULTIPLE_CHOICE":
      return "Chọn tất cả đáp án bạn cho là đúng.";
    case "ESSAY":
      return "Tự suy nghĩ đáp án, sau khi nộp bài bạn sẽ xem được đáp án mẫu.";
    case "IMAGE_ESSAY":
      return "Quan sát hình ảnh và tự suy nghĩ đáp án, sau khi nộp bài sẽ xem được đáp án mẫu.";
    default:
      return "Chọn một đáp án đúng nhất.";
  }
};

const isQuestionAnswered = (
  question: StudentQuestion,
  selectedAnswerIds: string[] | undefined,
  orderingAnswerIds: string[] | undefined,
  matchingSelectionsByAnswerId: Record<string, string> | undefined,
): boolean => {
  if (question.isLocked) {
    return true;
  }

  if (question.type === "ESSAY" || question.type === "IMAGE_ESSAY") {
    return true;
  }

  if (question.type === "ORDERING") {
    return (orderingAnswerIds?.length ?? 0) === question.answers.length;
  }

  if (question.type === "MATCHING") {
    return question.answers.every(
      (answer) =>
        (matchingSelectionsByAnswerId?.[answer.id] ?? "").trim().length > 0,
    );
  }

  return (selectedAnswerIds?.length ?? 0) > 0;
};

export function QuizForm({ lessonId, questions, onSubmitted }: QuizFormProps) {
  const { toast } = useToast();
  const submitQuizMutation = useSubmitQuiz(lessonId);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});
  const [essayInputs, setEssayInputs] = useState<Record<string, string>>({});
  const [orderingAnswerIdsByQuestion, setOrderingAnswerIdsByQuestion] = useState<
    Record<string, string[]>
  >({});
  const [matchingSelectionsByQuestion, setMatchingSelectionsByQuestion] =
    useState<MatchingSelectionsState>({});
  const [matchingOptionsByQuestion, setMatchingOptionsByQuestion] = useState<
    Record<string, string[]>
  >({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDraftReady, setIsDraftReady] = useState(false);
  const draftKey = `quiz_draft_${lessonId}`;

  useEffect(() => {
    setIsDraftReady(false);
    const nextOrderingAnswerIdsByQuestion: Record<string, string[]> = {};
    const nextMatchingOptionsByQuestion: Record<string, string[]> = {};
    const validQuestionIds = new Set(questions.map((question) => question.id));
    let restoredDraft: Partial<QuizDraft> | null = null;

    try {
      const draftRaw = localStorage.getItem(draftKey);
      if (draftRaw) {
        const parsedDraft = JSON.parse(draftRaw) as unknown;
        if (parsedDraft && typeof parsedDraft === "object") {
          restoredDraft = parsedDraft as Partial<QuizDraft>;
        }
      }
    } catch {
      localStorage.removeItem(draftKey);
    }

    for (const question of questions) {
      if (question.type === "ORDERING") {
        const fallbackOrdering = shuffleArray(question.answers.map((answer) => answer.id));
        const restoredOrdering =
          restoredDraft?.orderingAnswerIdsByQuestion?.[question.id];
        const answerIds = new Set(question.answers.map((answer) => answer.id));

        if (
          Array.isArray(restoredOrdering) &&
          restoredOrdering.length === question.answers.length &&
          restoredOrdering.every((answerId) => answerIds.has(answerId))
        ) {
          nextOrderingAnswerIdsByQuestion[question.id] = restoredOrdering;
        } else {
          nextOrderingAnswerIdsByQuestion[question.id] = fallbackOrdering;
        }
      }

      if (question.type === "MATCHING") {
        nextMatchingOptionsByQuestion[question.id] = shuffleArray(
          question.matchingOptions ?? [],
        );
      }
    }

    const nextSelectedAnswers: Record<string, string[]> = {};
    const restoredSelectedAnswers = restoredDraft?.selectedAnswers ?? {};

    if (restoredSelectedAnswers && typeof restoredSelectedAnswers === "object") {
      for (const [questionId, answerIds] of Object.entries(restoredSelectedAnswers)) {
        if (
          validQuestionIds.has(questionId) &&
          Array.isArray(answerIds) &&
          answerIds.every((answerId) => typeof answerId === "string")
        ) {
          nextSelectedAnswers[questionId] = answerIds;
        }
      }
    }

    const nextEssayInputs: Record<string, string> = {};
    const restoredEssayInputs = restoredDraft?.essayInputs ?? {};

    if (restoredEssayInputs && typeof restoredEssayInputs === "object") {
      for (const [questionId, essayValue] of Object.entries(restoredEssayInputs)) {
        if (validQuestionIds.has(questionId) && typeof essayValue === "string") {
          nextEssayInputs[questionId] = essayValue;
        }
      }
    }

    const nextMatchingSelectionsByQuestion: MatchingSelectionsState = {};
    const restoredMatchingSelections = restoredDraft?.matchingSelectionsByQuestion ?? {};

    if (restoredMatchingSelections && typeof restoredMatchingSelections === "object") {
      for (const question of questions) {
        if (question.type !== "MATCHING") {
          continue;
        }

        const answerIdSet = new Set(question.answers.map((answer) => answer.id));
        const restoredSelections = restoredMatchingSelections[question.id];
        if (!restoredSelections || typeof restoredSelections !== "object") {
          continue;
        }

        const nextSelection: Record<string, string> = {};
        for (const [answerId, matchText] of Object.entries(restoredSelections)) {
          if (answerIdSet.has(answerId) && typeof matchText === "string") {
            nextSelection[answerId] = matchText;
          }
        }

        if (Object.keys(nextSelection).length > 0) {
          nextMatchingSelectionsByQuestion[question.id] = nextSelection;
        }
      }
    }

    setSelectedAnswers(nextSelectedAnswers);
    setEssayInputs(nextEssayInputs);
    setOrderingAnswerIdsByQuestion(nextOrderingAnswerIdsByQuestion);
    setMatchingSelectionsByQuestion(nextMatchingSelectionsByQuestion);
    setMatchingOptionsByQuestion(nextMatchingOptionsByQuestion);
    setIsDraftReady(true);
  }, [draftKey, questions]);

  useEffect(() => {
    if (!isDraftReady) {
      return;
    }

    try {
      const draftPayload: QuizDraft = {
        selectedAnswers,
        essayInputs,
        orderingAnswerIdsByQuestion,
        matchingSelectionsByQuestion,
      };

      localStorage.setItem(draftKey, JSON.stringify(draftPayload));
    } catch {
      // localStorage is unavailable or full, keep runtime state only.
    }
  }, [
    draftKey,
    essayInputs,
    isDraftReady,
    matchingSelectionsByQuestion,
    orderingAnswerIdsByQuestion,
    selectedAnswers,
  ]);

  const gradableQuestions = useMemo(
    () => questions.filter((question) => !question.isLocked),
    [questions],
  );
  const totalQuestions = gradableQuestions.length;
  const answeredCount = useMemo(
    () =>
      gradableQuestions.filter((question) =>
        isQuestionAnswered(
          question,
          selectedAnswers[question.id],
          orderingAnswerIdsByQuestion[question.id],
          matchingSelectionsByQuestion[question.id],
        ),
      ).length,
    [
      gradableQuestions,
      matchingSelectionsByQuestion,
      orderingAnswerIdsByQuestion,
      selectedAnswers,
    ],
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

  const moveAnswer = (questionId: string, fromIndex: number, toIndex: number) => {
    setOrderingAnswerIdsByQuestion((prev) => {
      const currentAnswerIds = prev[questionId] ?? [];

      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= currentAnswerIds.length ||
        toIndex >= currentAnswerIds.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }

      return {
        ...prev,
        [questionId]: arrayMove(currentAnswerIds, fromIndex, toIndex),
      };
    });
  };

  const handleMatchingSelect = (
    questionId: string,
    answerId: string,
    matchText: string,
  ) => {
    setMatchingSelectionsByQuestion((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] ?? {}),
        [answerId]: matchText,
      },
    }));
  };

  const handleOpenConfirm = () => {
    if (!isFullyAnswered) {
      toast({
        title: "Bạn chưa hoàn thành bài làm",
        description: "Vui lòng hoàn thành tất cả câu hỏi trước khi nộp bài.",
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
      if (!navigator.onLine) {
        toast({
          title: "⚠️ Không có kết nối mạng",
          description:
            "Đáp án của bạn vẫn được giữ nguyên trên màn hình. Hãy kiểm tra mạng rồi nộp lại nhé!",
          variant: "destructive",
          duration: 10000,
        });
        return;
      }

      const payload: SubmitQuizPayload = {
        answers: gradableQuestions.map((question) => {
          if (question.type === "ORDERING") {
            return {
              questionId: question.id,
              answerIds: orderingAnswerIdsByQuestion[question.id] ?? [],
            };
          }

          if (question.type === "MATCHING") {
            return {
              questionId: question.id,
              answerIds: [],
              matches: question.answers.map((answer) => ({
                answerId: answer.id,
                matchText:
                  matchingSelectionsByQuestion[question.id]?.[answer.id] ?? "",
              })),
            };
          }

          if (question.type === "ESSAY" || question.type === "IMAGE_ESSAY") {
            return {
              questionId: question.id,
              answerIds: [],
            };
          }

          return {
            questionId: question.id,
            answerIds: selectedAnswers[question.id] ?? [],
          };
        }),
      };

      const result = await submitQuizMutation.mutateAsync(payload);
      setConfirmOpen(false);
      localStorage.removeItem(draftKey);
      onSubmitted(result);
      toast({
        title: "Nộp bài thành công",
        description: `Bạn đã hoàn thành lần nộp #${result.attemptNumber}.`,
      });
    } catch (error) {
      const isAxiosNetworkError =
        axios.isAxiosError(error) &&
        !error.response &&
        (error.code === "ERR_NETWORK" || Boolean(error.request));
      const isServerUnavailable =
        axios.isAxiosError(error) &&
        typeof error.response?.status === "number" &&
        error.response.status >= 500;

      toast({
        title: "Không thể nộp bài",
        description: isAxiosNetworkError
          ? "Mất kết nối mạng. Đáp án của bạn vẫn an toàn trên màn hình, hãy kiểm tra mạng rồi thử lại."
          : isServerUnavailable
            ? "Máy chủ đang bận hoặc bảo trì. Đáp án vẫn an toàn, hãy thử lại sau ít phút."
            : getApiErrorMessage(error),
        variant: "destructive",
        duration: 10000,
      });
    }
  };

  return (
    <section className="kokonut-glass-card kokonut-glow-border space-y-6 border-primary/15 bg-white/70 p-6 shadow-glass transition-all dark:bg-slate-900/70">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold sm:text-xl">📚BÀI TẬP</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Tùy loại câu hỏi, bạn có thể chọn đáp án, sắp xếp thứ tự, ghép đôi hoặc
              tự suy nghĩ đáp án cho phần tự luận.
            </p>
          </div>
          <Badge className="rounded-full border border-accent/40 bg-accent/15 text-foreground shadow-[0_8px_20px_-14px_hsl(var(--accent)/0.9)] hover:bg-accent/15">
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-accent-foreground" />
            🎓Chúc bạn hoàn thành bài tập một cách xuất sắc💯
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Đã trả lời {answeredCount}/{totalQuestions} câu
            </span>
            <span>{Math.round((answeredCount / Math.max(totalQuestions, 1)) * 100)}%</span>
          </div>
          <Progress
            className="h-2.5 overflow-hidden rounded-full bg-primary/10 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent"
            value={(answeredCount / Math.max(totalQuestions, 1)) * 100}
          />
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question, questionIndex) => {
          const selectedAnswerIds = selectedAnswers[question.id] ?? [];
          const orderingAnswerIds = orderingAnswerIdsByQuestion[question.id] ?? [];
          const matchingOptions = matchingOptionsByQuestion[question.id] ?? [];
          const matchingSelections = matchingSelectionsByQuestion[question.id] ?? {};
          const answerById = new Map(
            question.answers.map((answer) => [answer.id, answer] as const),
          );
          const orderedAnswers = orderingAnswerIds
            .map((answerId) => answerById.get(answerId))
            .filter(
              (answer): answer is StudentQuestion["answers"][number] =>
                answer !== undefined,
            );
          const questionAnswered = isQuestionAnswered(
            question,
            selectedAnswerIds,
            orderingAnswerIds,
            matchingSelections,
          );
          const isLocked = question.isLocked === true;

          return (
            <article
              aria-labelledby={`question-title-${question.id}`}
              className={cn(
                "relative overflow-hidden space-y-4 rounded-2xl border border-primary/15 bg-white/80 p-4 shadow-sm transition-all duration-300 dark:bg-slate-900/80",
                questionAnswered
                  ? "shadow-glow-soft ring-1 ring-accent/20"
                  : "hover:border-primary/35 hover:shadow-glow-soft",
              )}
              data-ai-question-index={questionIndex + 1}
              data-ai-question-text={question.text}
              data-ai-question-type={question.type}
              key={question.id}
            >
              <div
                className={cn(
                  isLocked
                    ? "pointer-events-none select-none opacity-30 blur-[4px]"
                    : "",
                )}
              >
                <header className="space-y-1">
                  <h3
                    className="font-medium leading-7 whitespace-pre-wrap"
                    id={`question-title-${question.id}`}
                  >
                    Câu {questionIndex + 1}: {question.text}
                  </h3>
                  {question.imageUrl ? (
                    <div className="mt-4 overflow-hidden rounded-xl border border-primary/15 shadow-sm">
                      <Image
                        alt={`Hình ảnh đi kèm câu hỏi ${questionIndex + 1}`}
                        className="max-h-[400px] h-auto w-full object-contain bg-slate-50/50"
                        height={720}
                        sizes="(max-width: 768px) 100vw, 768px"
                        src={question.imageUrl}
                        unoptimized
                        width={1280}
                      />
                    </div>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {getQuestionInstruction(question)}
                  </p>
                </header>

                {question.type === "ESSAY" || question.type === "IMAGE_ESSAY" ? (
                  <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-3">
                    <Textarea
                      className="min-h-32 resize-y rounded-xl border-primary/15 bg-white/85 text-foreground placeholder:text-muted-foreground/70 dark:bg-slate-950/85"
                      onChange={(event) =>
                        setEssayInputs((prev) => ({
                          ...prev,
                          [question.id]: event.target.value,
                        }))
                      }
                      placeholder={
                        question.type === "IMAGE_ESSAY"
                          ? "Mời bạn nhập câu trả lời / suy luận của mình vào đây..."
                          : "Hãy tự suy nghĩ đáp án trong đầu. Sau khi nộp bài bạn sẽ xem được đáp án mẫu."
                      }
                      value={essayInputs[question.id] ?? ""}
                    />
                  </div>
                ) : question.type === "ORDERING" ? (
                  <ol className="space-y-2" data-ai-question-options="ordering">
                    {orderedAnswers.map((answer, answerIndex) => (
                      <li
                        data-ai-answer-index={answerIndex + 1}
                        data-ai-answer-text={answer.text}
                        data-ai-answer-type="ordering-item"
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/15 bg-white/85 p-3 shadow-sm transition-all hover:shadow-glow-soft dark:bg-slate-900/85"
                        key={answer.id}
                      >
                        <div className="flex flex-1 items-center gap-3">
                          <Badge variant="secondary">#{answerIndex + 1}</Badge>
                          <p className="text-sm">{answer.text}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            className="h-8 w-8 rounded-full border-primary/20"
                            disabled={answerIndex === 0}
                            onClick={() =>
                              moveAnswer(question.id, answerIndex, answerIndex - 1)
                            }
                            size="icon"
                            type="button"
                            variant="outline"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            className="h-8 w-8 rounded-full border-primary/20"
                            disabled={answerIndex === orderedAnswers.length - 1}
                            onClick={() =>
                              moveAnswer(question.id, answerIndex, answerIndex + 1)
                            }
                            size="icon"
                            type="button"
                            variant="outline"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : question.type === "MATCHING" ? (
                  <div className="space-y-3" data-ai-question-options="matching">
                    {question.answers.map((answer) => (
                      <div
                        data-ai-answer-text={answer.text}
                        data-ai-answer-type="matching-left"
                        className="grid gap-3 rounded-xl border border-primary/15 bg-white/85 p-3 md:grid-cols-[1fr_1fr] dark:bg-slate-900/85"
                        key={answer.id}
                      >
                        <div className="space-y-1 rounded-md border border-primary/10 bg-primary/5 px-3 py-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Vế trái
                          </p>
                          <p className="text-sm">{answer.text}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Vế phải
                          </p>
                          <Select
                            onValueChange={(matchText) =>
                              handleMatchingSelect(question.id, answer.id, matchText)
                            }
                            value={matchingSelections[answer.id]}
                          >
                            <SelectTrigger className="max-w-[calc(100vw-4rem)] border-primary/20 bg-white/80 [&>span]:truncate dark:bg-slate-950/80">
                              <SelectValue placeholder="Chọn vế phải phù hợp" />
                            </SelectTrigger>
                            <SelectContent className="max-w-[calc(100vw-2rem)]">
                              {matchingOptions.map((option, optionIndex) => (
                                <SelectItem
                                  className="max-w-[calc(100vw-2rem)] shrink-0"
                                  key={`${question.id}-${answer.id}-${optionIndex}`}
                                  value={option}
                                >
                                  <span className="break-words whitespace-normal text-left">
                                    {option}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : question.type === "MULTIPLE_CHOICE" ? (
                  <ol className="space-y-3" data-ai-question-options="multiple-choice">
                    {question.answers.map((answer, answerIndex) => {
                      const answerLabel = String.fromCharCode(65 + answerIndex);
                      const checkboxId = `${question.id}-${answer.id}`;
                      const isSelected = selectedAnswerIds.includes(answer.id);

                      return (
                        <li key={answer.id}>
                          <Label
                            data-ai-answer-index={answerIndex + 1}
                            data-ai-answer-text={answer.text}
                            data-ai-answer-type="multiple-choice"
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-xl border border-primary/15 bg-white/85 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-glow-soft dark:bg-slate-900/85",
                              isSelected
                                ? "border-accent/55 bg-gradient-to-br from-primary/10 via-background to-accent/20 shadow-[0_0_0_1px_hsl(var(--accent)/0.3),0_16px_30px_-20px_hsl(var(--accent)/0.95)] hover:border-accent/60"
                                : "",
                            )}
                            htmlFor={checkboxId}
                          >
                            <Checkbox
                              checked={isSelected}
                              className="mt-0.5 border-primary/40 data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
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
                              <p className={cn("text-sm leading-6", isSelected ? "font-medium" : "")}>
                                {answer.text}
                              </p>
                            </div>
                          </Label>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <RadioGroup
                    aria-label={`Danh sach dap an cho cau ${questionIndex + 1}`}
                    data-ai-question-options="single-choice"
                    onValueChange={(answerId) =>
                      handleSingleChoiceChange(question.id, answerId)
                    }
                    value={selectedAnswerIds[0] ?? ""}
                  >
                    <ol className="space-y-3">
                      {question.answers.map((answer, answerIndex) => {
                        const answerLabel = String.fromCharCode(65 + answerIndex);
                        const radioId = `${question.id}-${answer.id}`;
                        const isSelected = selectedAnswerIds[0] === answer.id;

                        return (
                          <li key={answer.id}>
                            <Label
                              data-ai-answer-index={answerIndex + 1}
                              data-ai-answer-text={answer.text}
                              data-ai-answer-type="single-choice"
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-xl border border-primary/15 bg-white/85 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-glow-soft dark:bg-slate-900/85",
                                isSelected
                                  ? "border-accent/55 bg-gradient-to-br from-primary/10 via-background to-accent/20 shadow-[0_0_0_1px_hsl(var(--accent)/0.3),0_16px_30px_-20px_hsl(var(--accent)/0.95)] hover:border-accent/60"
                                  : "",
                              )}
                              htmlFor={radioId}
                            >
                              <RadioGroupItem
                                className="mt-0.5 border-primary/40 text-accent data-[state=checked]:border-accent"
                                id={radioId}
                                value={answer.id}
                              />
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground">
                                  Đáp án {answerLabel}
                                </p>
                                <p className={cn("text-sm leading-6", isSelected ? "font-medium" : "")}>
                                  {answer.text}
                                </p>
                              </div>
                            </Label>
                          </li>
                        );
                      })}
                    </ol>
                  </RadioGroup>
                )}
              </div>
              {isLocked ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                  <div className="max-w-md rounded-2xl border border-white/35 bg-white/80 px-5 py-4 text-center shadow-glass backdrop-blur-md dark:border-slate-200/20 dark:bg-slate-900/75">
                    <p className="text-2xl">🔒</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      Câu hỏi dành cho học viên tham gia khóa học kèm 1-1. Liên hệ với Jason để mở khóa toàn bộ bài tập!
                    </p>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          className="kokonut-hover-lift h-12 rounded-xl border border-white/30 bg-gradient-to-r from-primary to-amber-600 px-8 text-base font-semibold text-slate-950 shadow-glow-soft transition-all duration-300 hover:brightness-110 hover:shadow-glow-strong"
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
              className="bg-gradient-to-r from-primary to-amber-600 text-slate-950 hover:brightness-105"
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
