"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Send, Sparkles } from "lucide-react";
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
      return "Kéo thả các bước để sắp xếp lại theo đúng thứ tự.";
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

type SortableAnswerItemProps = {
  answer: StudentQuestion["answers"][number];
  index: number;
};

function SortableAnswerItem({ answer, index }: SortableAnswerItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({ id: answer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/15 bg-white/85 p-3 transition-all duration-300",
        isDragging
          ? "scale-[1.01] shadow-glow-soft ring-1 ring-accent/45"
          : "shadow-sm hover:shadow-glow-soft",
      )}
      ref={setNodeRef}
      style={style}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="rounded-md border border-primary/20 bg-primary/5 p-1.5 text-muted-foreground transition-colors hover:bg-primary/10"
        >
          <GripVertical className="h-4 w-4 cursor-grab active:cursor-grabbing" />
          <span className="sr-only">Kéo để thay đổi vị trí</span>
        </div>
        <Badge variant="secondary">#{index + 1}</Badge>
        <p className="text-sm">{answer.text}</p>
      </div>
    </div>
  );
}

const isQuestionAnswered = (
  question: StudentQuestion,
  selectedAnswerIds: string[] | undefined,
  orderingAnswerIds: string[] | undefined,
  matchingSelectionsByAnswerId: Record<string, string> | undefined,
): boolean => {
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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const nextOrderingAnswerIdsByQuestion: Record<string, string[]> = {};
    const nextMatchingOptionsByQuestion: Record<string, string[]> = {};

    for (const question of questions) {
      if (question.type === "ORDERING") {
        nextOrderingAnswerIdsByQuestion[question.id] = shuffleArray(
          question.answers.map((answer) => answer.id),
        );
      }

      if (question.type === "MATCHING") {
        nextMatchingOptionsByQuestion[question.id] = shuffleArray(
          question.matchingOptions ?? [],
        );
      }
    }

    setSelectedAnswers({});
    setEssayInputs({});
    setOrderingAnswerIdsByQuestion(nextOrderingAnswerIdsByQuestion);
    setMatchingSelectionsByQuestion({});
    setMatchingOptionsByQuestion(nextMatchingOptionsByQuestion);
  }, [questions]);

  const totalQuestions = questions.length;
  const answeredCount = useMemo(
    () =>
      questions.filter((question) =>
        isQuestionAnswered(
          question,
          selectedAnswers[question.id],
          orderingAnswerIdsByQuestion[question.id],
          matchingSelectionsByQuestion[question.id],
        ),
      ).length,
    [matchingSelectionsByQuestion, orderingAnswerIdsByQuestion, questions, selectedAnswers],
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

  const handleDragEnd = (event: DragEndEvent, questionId: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setOrderingAnswerIdsByQuestion((prev) => {
      const currentAnswerIds = prev[questionId] ?? [];
      const activeId = String(active.id);
      const overId = String(over.id);
      const oldIndex = currentAnswerIds.findIndex((answerId) => answerId === activeId);
      const newIndex = currentAnswerIds.findIndex((answerId) => answerId === overId);

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return prev;
      }

      return {
        ...prev,
        [questionId]: arrayMove(currentAnswerIds, oldIndex, newIndex),
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
      const payload: SubmitQuizPayload = {
        answers: questions.map((question) => {
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
    <section className="kokonut-glass-card kokonut-glow-border space-y-6 border-primary/15 bg-white/70 p-6 shadow-glass transition-all">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold sm:text-xl">Phần làm bài</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Tùy loại câu hỏi, bạn có thể chọn đáp án, sắp xếp thứ tự, ghép đôi hoặc
              tự suy nghĩ đáp án cho phần tự luận.
            </p>
          </div>
          <Badge className="rounded-full border border-accent/40 bg-accent/15 text-foreground shadow-[0_8px_20px_-14px_hsl(var(--accent)/0.9)] hover:bg-accent/15">
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-accent-foreground" />
            Focus mode
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

          return (
            <div
              className={cn(
                "space-y-4 rounded-2xl border border-primary/15 bg-white/80 p-4 shadow-sm transition-all duration-300",
                questionAnswered
                  ? "shadow-glow-soft ring-1 ring-accent/20"
                  : "hover:border-primary/35 hover:shadow-glow-soft",
              )}
              key={question.id}
            >
              <div className="space-y-1">
                <p className="font-medium leading-7">
                  Câu {questionIndex + 1}: {question.text}
                </p>
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
              </div>

              {question.type === "ESSAY" || question.type === "IMAGE_ESSAY" ? (
                <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-3">
                  <Textarea
                    className="min-h-32 resize-y rounded-xl border-primary/15 bg-white/85 text-foreground placeholder:text-muted-foreground/70"
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
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, question.id)}
                  sensors={sensors}
                >
                  <SortableContext
                    items={orderedAnswers.map((answer) => answer.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {orderedAnswers.map((answer, answerIndex) => (
                        <SortableAnswerItem
                          answer={answer}
                          index={answerIndex}
                          key={answer.id}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : question.type === "MATCHING" ? (
                <div className="space-y-3">
                  {question.answers.map((answer) => (
                    <div
                      className="grid gap-3 rounded-xl border border-primary/15 bg-white/85 p-3 md:grid-cols-[1fr_1fr]"
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
                          <SelectTrigger className="max-w-full border-primary/20 bg-white/80 [&>span]:truncate">
                            <SelectValue placeholder="Chọn vế phải phù hợp" />
                          </SelectTrigger>
                          <SelectContent className="max-w-[calc(100vw-2rem)]">
                            {matchingOptions.map((option, optionIndex) => (
                              <SelectItem
                                className="max-w-[calc(100vw-6rem)]"
                                key={`${question.id}-${answer.id}-${optionIndex}`}
                                value={option}
                              >
                                <span className="break-words whitespace-normal">{option}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
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
                          "flex cursor-pointer items-start gap-3 rounded-xl border border-primary/15 bg-white/85 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-glow-soft",
                          isSelected
                            ? "border-accent/55 bg-gradient-to-br from-primary/10 via-background to-accent/20 shadow-[0_0_0_1px_hsl(var(--accent)/0.3),0_16px_30px_-20px_hsl(var(--accent)/0.95)] hover:border-accent/60"
                            : "",
                        )}
                        htmlFor={checkboxId}
                        key={answer.id}
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
                          "flex cursor-pointer items-start gap-3 rounded-xl border border-primary/15 bg-white/85 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-glow-soft",
                          isSelected
                            ? "border-accent/55 bg-gradient-to-br from-primary/10 via-background to-accent/20 shadow-[0_0_0_1px_hsl(var(--accent)/0.3),0_16px_30px_-20px_hsl(var(--accent)/0.95)] hover:border-accent/60"
                            : "",
                        )}
                        htmlFor={radioId}
                        key={answer.id}
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
                    );
                  })}
                </RadioGroup>
              )}
            </div>
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
