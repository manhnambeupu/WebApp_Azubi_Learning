import { QuestionType } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

type QuestionResult = {
  id: string;
  type: QuestionType;
  text: string;
  imageUrl: string | null;
  explanation: string | null;
  answers: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string | null;
    orderIndex: number | null;
    matchText: string | null;
  }[];
  selectedAnswerIds: string[];
  selectedAnswerId: string | null;
  selectedMatches: {
    answerId: string;
    matchText: string;
  }[];
  isCorrect: boolean;
};

type SubmittedQuestionAnswer = {
  answerIds: string[];
  matchesByAnswerId: Map<string, string>;
};

type AttemptDetailResponse = {
  attemptId: string;
  attemptNumber: number;
  totalQuestions: number;
  correctCount: number;
  score: number;
  questions: QuestionResult[];
};

type LessonQuestionSnapshot = {
  id: string;
  type: QuestionType;
  text: string;
  imageUrl: string | null;
  explanation: string | null;
  orderIndex: number;
  answers: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string | null;
    orderIndex: number | null;
    matchText: string | null;
  }[];
};

type QuestionEvaluation = {
  earnedCorrectCount: number;
  isCorrect: boolean;
};

const MISSING_ANSWERS_MESSAGE = 'Vui lòng trả lời tất cả câu hỏi.';
const SINGLE_CHOICE_LIMIT_MESSAGE = 'Mỗi câu hỏi chỉ được chọn một đáp án.';
const ESSAY_CHOICE_LIMIT_MESSAGE =
  'Câu hỏi tự luận chỉ chấp nhận tối đa 1 đáp án tham chiếu.';
const ORDERING_REQUIRED_ALL_ANSWERS_MESSAGE =
  'Câu hỏi sắp xếp phải gửi đủ tất cả đáp án theo thứ tự.';
const MATCHING_REQUIRED_ALL_PAIRS_MESSAGE =
  'Câu hỏi ghép đôi phải gửi đầy đủ các cặp ghép.';
const MATCHING_DUPLICATED_PAIR_MESSAGE = 'Mỗi đáp án chỉ được ghép một lần.';
const MATCHING_EMPTY_TEXT_MESSAGE = 'Nội dung ghép không được để trống.';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitQuiz(
    userId: string,
    lessonId: string,
    dto: SubmitQuizDto,
  ): Promise<AttemptDetailResponse> {
    const lessonQuestions = await this.getLessonQuestions(lessonId);
    const submittedAnswersByQuestion = this.validateSubmittedAnswers(
      lessonQuestions,
      dto.answers,
    );
    const evaluationsByQuestion = this.evaluateQuestions(
      lessonQuestions,
      submittedAnswersByQuestion,
    );

    const questionsResult = this.buildQuestionsResult(
      lessonQuestions,
      submittedAnswersByQuestion,
      evaluationsByQuestion,
    );
    const totalQuestions = this.countGradableQuestions(lessonQuestions);
    const correctCount = this.calculateCorrectCount(evaluationsByQuestion);
    const score = this.calculateScore(correctCount, totalQuestions);

    const lastAttempt = await this.prisma.lessonAttempt.findFirst({
      where: {
        userId,
        lessonId,
      },
      orderBy: {
        attemptNumber: 'desc',
      },
      select: {
        attemptNumber: true,
      },
    });
    const attemptNumber = (lastAttempt?.attemptNumber ?? 0) + 1;

    const attempt = await this.prisma.$transaction(async (tx) => {
      const rollingAttempts = await tx.lessonAttempt.findMany({
        where: {
          userId,
          lessonId,
          attemptNumber: {
            gt: 2,
          },
        },
        orderBy: {
          attemptNumber: 'asc',
        },
        select: {
          id: true,
        },
      });

      if (rollingAttempts.length >= 3) {
        const attemptsToDelete = rollingAttempts.slice(
          0,
          rollingAttempts.length - 2,
        );

        if (attemptsToDelete.length > 0) {
          await tx.lessonAttempt.deleteMany({
            where: {
              id: {
                in: attemptsToDelete.map((attempt) => attempt.id),
              },
            },
          });
        }
      }

      const createdAttempt = await tx.lessonAttempt.create({
        data: {
          userId,
          lessonId,
          attemptNumber,
          score,
          correctCount,
        },
      });

      const submissionRows = this.buildSubmissionRows(
        createdAttempt.id,
        questionsResult,
        submittedAnswersByQuestion,
      );

      if (submissionRows.length > 0) {
        await tx.submission.createMany({
          data: submissionRows,
        });
      }

      return createdAttempt;
    });

    return {
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      totalQuestions,
      correctCount,
      score,
      questions: questionsResult,
    };
  }

  getAttemptHistory(userId: string, lessonId: string) {
    return this.prisma.lessonAttempt.findMany({
      where: {
        userId,
        lessonId,
      },
      select: {
        id: true,
        attemptNumber: true,
        score: true,
        correctCount: true,
        submittedAt: true,
      },
      orderBy: {
        attemptNumber: 'desc',
      },
    });
  }

  async getAttemptDetail(
    userId: string,
    lessonId: string,
    attemptId: string,
  ): Promise<AttemptDetailResponse> {
    const attempt = await this.prisma.lessonAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
        lessonId,
      },
      select: {
        id: true,
        attemptNumber: true,
        score: true,
        correctCount: true,
        submissions: {
          orderBy: [
            {
              orderIndex: 'asc',
            },
            {
              answerId: 'asc',
            },
          ],
          select: {
            questionId: true,
            answerId: true,
            orderIndex: true,
            matchText: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    const lessonQuestions = await this.getLessonQuestions(lessonId);
    const submittedAnswersByQuestion = this.groupSubmittedAnswersByQuestion(
      attempt.submissions,
    );
    const evaluationsByQuestion = this.evaluateQuestions(
      lessonQuestions,
      submittedAnswersByQuestion,
    );
    const questions = this.buildQuestionsResult(
      lessonQuestions,
      submittedAnswersByQuestion,
      evaluationsByQuestion,
    );
    const totalQuestions = this.countGradableQuestions(lessonQuestions);
    const correctCount =
      attempt.correctCount ?? this.calculateCorrectCount(evaluationsByQuestion);
    const score = attempt.score ?? this.calculateScore(correctCount, totalQuestions);

    return {
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      totalQuestions,
      correctCount,
      score,
      questions,
    };
  }

  async getLatestAttempt(userId: string, lessonId: string) {
    const latestAttempt = await this.prisma.lessonAttempt.findFirst({
      where: {
        userId,
        lessonId,
      },
      orderBy: {
        attemptNumber: 'desc',
      },
      select: {
        id: true,
      },
    });

    if (!latestAttempt) {
      return null;
    }

    return this.getAttemptDetail(userId, lessonId, latestAttempt.id);
  }

  private async getLessonQuestions(lessonId: string): Promise<LessonQuestionSnapshot[]> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        questions: {
          orderBy: {
            orderIndex: 'asc',
          },
          select: {
            id: true,
            type: true,
            text: true,
            imageUrl: true,
            explanation: true,
            orderIndex: true,
            answers: {
              orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
              select: {
                id: true,
                text: true,
                isCorrect: true,
                explanation: true,
                orderIndex: true,
                matchText: true,
              },
            },
          },
        },
      },
    });

    if (!lesson || lesson.questions.length === 0) {
      throw new NotFoundException('Lesson not found');
    }

    return lesson.questions;
  }

  private validateSubmittedAnswers(
    lessonQuestions: LessonQuestionSnapshot[],
    submittedAnswers: SubmitAnswerDto[],
  ): Map<string, SubmittedQuestionAnswer> {
    const submittedAnswersByQuestion = new Map<string, SubmittedQuestionAnswer>();
    const questionById = new Map(
      lessonQuestions.map((question) => [question.id, question] as const),
    );

    for (const submittedAnswer of submittedAnswers) {
      if (submittedAnswersByQuestion.has(submittedAnswer.questionId)) {
        throw new UnprocessableEntityException(
          'Mỗi câu hỏi chỉ được gửi một lần.',
        );
      }

      const question = questionById.get(submittedAnswer.questionId);
      if (!question) {
        throw new UnprocessableEntityException('Câu hỏi không thuộc bài học này.');
      }

      const submittedAnswerIds = submittedAnswer.answerIds;
      const submittedMatches = submittedAnswer.matches ?? [];
      const questionAnswerIds = new Set(question.answers.map((answer) => answer.id));

      if (
        question.type === QuestionType.SINGLE_CHOICE &&
        submittedAnswerIds.length > 1
      ) {
        throw new UnprocessableEntityException(SINGLE_CHOICE_LIMIT_MESSAGE);
      }

      if (
        (question.type === QuestionType.ESSAY ||
          question.type === QuestionType.IMAGE_ESSAY) &&
        submittedAnswerIds.length > 1
      ) {
        throw new UnprocessableEntityException(ESSAY_CHOICE_LIMIT_MESSAGE);
      }

      if (
        question.type !== QuestionType.ESSAY &&
        question.type !== QuestionType.IMAGE_ESSAY &&
        question.type !== QuestionType.MATCHING &&
        submittedAnswerIds.length === 0
      ) {
        throw new UnprocessableEntityException(MISSING_ANSWERS_MESSAGE);
      }

      for (const answerId of submittedAnswerIds) {
        if (!questionAnswerIds.has(answerId)) {
          throw new UnprocessableEntityException(
            'Đáp án không thuộc câu hỏi tương ứng.',
          );
        }
      }

      if (question.type === QuestionType.ORDERING) {
        if (submittedAnswerIds.length !== question.answers.length) {
          throw new UnprocessableEntityException(
            ORDERING_REQUIRED_ALL_ANSWERS_MESSAGE,
          );
        }

        for (const answer of question.answers) {
          if (!submittedAnswerIds.includes(answer.id)) {
            throw new UnprocessableEntityException(
              ORDERING_REQUIRED_ALL_ANSWERS_MESSAGE,
            );
          }
        }
      }

      const matchesByAnswerId = new Map<string, string>();
      if (question.type === QuestionType.MATCHING) {
        if (submittedMatches.length !== question.answers.length) {
          throw new UnprocessableEntityException(MATCHING_REQUIRED_ALL_PAIRS_MESSAGE);
        }

        for (const match of submittedMatches) {
          if (!questionAnswerIds.has(match.answerId)) {
            throw new UnprocessableEntityException(
              'Đáp án không thuộc câu hỏi tương ứng.',
            );
          }

          if (matchesByAnswerId.has(match.answerId)) {
            throw new UnprocessableEntityException(MATCHING_DUPLICATED_PAIR_MESSAGE);
          }

          if (match.matchText.trim().length === 0) {
            throw new UnprocessableEntityException(MATCHING_EMPTY_TEXT_MESSAGE);
          }

          matchesByAnswerId.set(match.answerId, match.matchText);
        }

        if (matchesByAnswerId.size !== question.answers.length) {
          throw new UnprocessableEntityException(MATCHING_REQUIRED_ALL_PAIRS_MESSAGE);
        }
      }

      submittedAnswersByQuestion.set(submittedAnswer.questionId, {
        answerIds:
          question.type === QuestionType.MATCHING
            ? submittedMatches.map((match) => match.answerId)
            : submittedAnswerIds,
        matchesByAnswerId,
      });
    }

    if (submittedAnswersByQuestion.size !== lessonQuestions.length) {
      throw new UnprocessableEntityException(MISSING_ANSWERS_MESSAGE);
    }

    return submittedAnswersByQuestion;
  }

  private buildQuestionsResult(
    lessonQuestions: LessonQuestionSnapshot[],
    submittedAnswersByQuestion: Map<string, SubmittedQuestionAnswer>,
    evaluationsByQuestion: Map<string, QuestionEvaluation>,
  ): QuestionResult[] {
    return lessonQuestions.map((question) => {
      const submittedAnswer = submittedAnswersByQuestion.get(question.id);
      const selectedAnswerIds = submittedAnswer?.answerIds ?? [];
      const evaluation = evaluationsByQuestion.get(question.id) ?? {
        earnedCorrectCount: 0,
        isCorrect: false,
      };

      return {
        id: question.id,
        type: question.type,
        text: question.text,
        imageUrl: question.imageUrl,
        explanation: question.explanation,
        answers: question.answers.map((answer) => ({
          id: answer.id,
          text: answer.text,
          isCorrect: answer.isCorrect,
          explanation: answer.explanation,
          orderIndex: answer.orderIndex,
          matchText: answer.matchText,
        })),
        selectedAnswerIds,
        selectedAnswerId: selectedAnswerIds[0] ?? null,
        selectedMatches: Array.from(
          submittedAnswer?.matchesByAnswerId.entries() ?? [],
        ).map(([answerId, matchText]) => ({ answerId, matchText })),
        isCorrect: evaluation.isCorrect,
      };
    });
  }

  private groupSubmittedAnswersByQuestion(
    submissions: Array<{
      questionId: string;
      answerId: string;
      orderIndex: number | null;
      matchText: string | null;
    }>,
  ): Map<string, SubmittedQuestionAnswer> {
    const submittedAnswersByQuestion = new Map<string, SubmittedQuestionAnswer>();
    const submissionsByQuestion = new Map<
      string,
      Array<{ answerId: string; orderIndex: number | null; matchText: string | null }>
    >();

    for (const submission of submissions) {
      const existingSubmissions = submissionsByQuestion.get(submission.questionId) ?? [];
      existingSubmissions.push({
        answerId: submission.answerId,
        orderIndex: submission.orderIndex,
        matchText: submission.matchText,
      });
      submissionsByQuestion.set(submission.questionId, existingSubmissions);
    }

    for (const [questionId, groupedSubmissions] of submissionsByQuestion.entries()) {
      groupedSubmissions.sort((left, right) => {
        if (left.orderIndex === null && right.orderIndex === null) {
          return 0;
        }

        if (left.orderIndex === null) {
          return 1;
        }

        if (right.orderIndex === null) {
          return -1;
        }

        return left.orderIndex - right.orderIndex;
      });

      const matchesByAnswerId = new Map<string, string>();
      for (const groupedSubmission of groupedSubmissions) {
        if (groupedSubmission.matchText !== null) {
          matchesByAnswerId.set(groupedSubmission.answerId, groupedSubmission.matchText);
        }
      }

      submittedAnswersByQuestion.set(questionId, {
        answerIds: groupedSubmissions.map(
          (groupedSubmission) => groupedSubmission.answerId,
        ),
        matchesByAnswerId,
      });
    }

    return submittedAnswersByQuestion;
  }

  private evaluateQuestions(
    lessonQuestions: LessonQuestionSnapshot[],
    submittedAnswersByQuestion: Map<string, SubmittedQuestionAnswer>,
  ): Map<string, QuestionEvaluation> {
    const evaluationsByQuestion = new Map<string, QuestionEvaluation>();

    for (const question of lessonQuestions) {
      evaluationsByQuestion.set(
        question.id,
        this.evaluateQuestion(
          question,
          submittedAnswersByQuestion.get(question.id) ?? {
            answerIds: [],
            matchesByAnswerId: new Map<string, string>(),
          },
        ),
      );
    }

    return evaluationsByQuestion;
  }

  private evaluateQuestion(
    question: LessonQuestionSnapshot,
    submittedAnswer: SubmittedQuestionAnswer,
  ): QuestionEvaluation {
    const selectedAnswerIds = submittedAnswer.answerIds;

    if (
      question.type === QuestionType.ESSAY ||
      question.type === QuestionType.IMAGE_ESSAY
    ) {
      return {
        earnedCorrectCount: 0,
        isCorrect: false,
      };
    }

    if (question.type === QuestionType.SINGLE_CHOICE) {
      const isCorrect = question.answers.some(
        (answer) => answer.id === selectedAnswerIds[0] && answer.isCorrect,
      );

      return {
        earnedCorrectCount: isCorrect ? 1 : 0,
        isCorrect,
      };
    }

    if (question.type === QuestionType.ORDERING) {
      const expectedAnswerIds = [...question.answers]
        .sort(
          (left, right) =>
            (left.orderIndex ?? Number.MAX_SAFE_INTEGER) -
            (right.orderIndex ?? Number.MAX_SAFE_INTEGER),
        )
        .map((answer) => answer.id);
      const isCorrect =
        expectedAnswerIds.length === selectedAnswerIds.length &&
        expectedAnswerIds.every(
          (expectedAnswerId, index) => expectedAnswerId === selectedAnswerIds[index],
        );

      return {
        earnedCorrectCount: isCorrect ? 1 : 0,
        isCorrect,
      };
    }

    if (question.type === QuestionType.MATCHING) {
      if (question.answers.length === 0) {
        return {
          earnedCorrectCount: 0,
          isCorrect: false,
        };
      }

      let correctPairCount = 0;
      for (const answer of question.answers) {
        const selectedMatchText = submittedAnswer.matchesByAnswerId.get(answer.id);
        if (
          selectedMatchText !== undefined &&
          answer.matchText !== null &&
          selectedMatchText === answer.matchText
        ) {
          correctPairCount += 1;
        }
      }

      const earnedCorrectCount = correctPairCount / question.answers.length;

      return {
        earnedCorrectCount,
        isCorrect: correctPairCount === question.answers.length,
      };
    }

    const correctAnswers = question.answers.filter((answer) => answer.isCorrect);
    if (correctAnswers.length === 0 || selectedAnswerIds.length === 0) {
      return {
        earnedCorrectCount: 0,
        isCorrect: false,
      };
    }

    const selectedAnswers = question.answers.filter((answer) =>
      selectedAnswerIds.includes(answer.id),
    );
    const hasWrongSelection = selectedAnswers.some((answer) => !answer.isCorrect);
    if (hasWrongSelection) {
      return {
        earnedCorrectCount: 0,
        isCorrect: false,
      };
    }

    const earnedCorrectCount = selectedAnswers.length / correctAnswers.length;

    return {
      earnedCorrectCount,
      isCorrect: selectedAnswers.length === correctAnswers.length,
    };
  }

  private buildSubmissionRows(
    attemptId: string,
    questions: QuestionResult[],
    submittedAnswersByQuestion: Map<string, SubmittedQuestionAnswer>,
  ) {
    const submissionRows: Array<{
      attemptId: string;
      questionId: string;
      answerId: string;
      orderIndex: number | null;
      matchText: string | null;
      isCorrect: boolean;
    }> = [];

    for (const question of questions) {
      const matchesByAnswerId =
        submittedAnswersByQuestion.get(question.id)?.matchesByAnswerId ??
        new Map<string, string>();
      for (const [index, answerId] of question.selectedAnswerIds.entries()) {
        submissionRows.push({
          attemptId,
          questionId: question.id,
          answerId,
          orderIndex: question.type === QuestionType.ORDERING ? index : null,
          matchText:
            question.type === QuestionType.MATCHING
              ? matchesByAnswerId.get(answerId) ?? null
              : null,
          isCorrect: question.isCorrect,
        });
      }
    }

    return submissionRows;
  }

  private countGradableQuestions(lessonQuestions: LessonQuestionSnapshot[]): number {
    return lessonQuestions.filter(
      (question) =>
        question.type !== QuestionType.ESSAY &&
        question.type !== QuestionType.IMAGE_ESSAY,
    ).length;
  }

  private calculateCorrectCount(
    evaluationsByQuestion: Map<string, QuestionEvaluation>,
  ): number {
    let correctCount = 0;

    for (const evaluation of evaluationsByQuestion.values()) {
      correctCount += evaluation.earnedCorrectCount;
    }

    return Number(correctCount.toFixed(4));
  }

  private calculateScore(correctCount: number, totalQuestions: number): number {
    if (totalQuestions === 0) {
      return 0;
    }

    return Number(((correctCount / totalQuestions) * 100).toFixed(2));
  }
}
