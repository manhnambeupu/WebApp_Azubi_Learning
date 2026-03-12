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
  explanation: string | null;
  answers: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string | null;
  }[];
  selectedAnswerIds: string[];
  selectedAnswerId: string | null;
  isCorrect: boolean;
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
  explanation: string | null;
  orderIndex: number;
  answers: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string | null;
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

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitQuiz(
    userId: string,
    lessonId: string,
    dto: SubmitQuizDto,
  ): Promise<AttemptDetailResponse> {
    const lessonQuestions = await this.getLessonQuestions(lessonId);
    const selectedAnswerIdsByQuestion = this.validateSubmittedAnswers(
      lessonQuestions,
      dto.answers,
    );
    const evaluationsByQuestion = this.evaluateQuestions(
      lessonQuestions,
      selectedAnswerIdsByQuestion,
    );

    const questionsResult = this.buildQuestionsResult(
      lessonQuestions,
      selectedAnswerIdsByQuestion,
      evaluationsByQuestion,
    );
    const totalQuestions = this.countGradableQuestions(lessonQuestions);
    const correctCount = this.calculateCorrectCount(evaluationsByQuestion);
    const score = this.calculateScore(correctCount, totalQuestions);

    const currentAttempts = await this.prisma.lessonAttempt.count({
      where: {
        userId,
        lessonId,
      },
    });
    const attemptNumber = currentAttempts + 1;

    const attempt = await this.prisma.$transaction(async (tx) => {
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
          select: {
            questionId: true,
            answerId: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    const lessonQuestions = await this.getLessonQuestions(lessonId);
    const selectedAnswerIdsByQuestion = this.groupSelectedAnswerIdsByQuestion(
      attempt.submissions,
    );
    const evaluationsByQuestion = this.evaluateQuestions(
      lessonQuestions,
      selectedAnswerIdsByQuestion,
    );
    const questions = this.buildQuestionsResult(
      lessonQuestions,
      selectedAnswerIdsByQuestion,
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
            explanation: true,
            orderIndex: true,
            answers: {
              orderBy: {
                id: 'asc',
              },
              select: {
                id: true,
                text: true,
                isCorrect: true,
                explanation: true,
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
  ): Map<string, string[]> {
    const selectedAnswerIdsByQuestion = new Map<string, string[]>();
    const questionById = new Map(
      lessonQuestions.map((question) => [question.id, question] as const),
    );

    for (const submittedAnswer of submittedAnswers) {
      if (selectedAnswerIdsByQuestion.has(submittedAnswer.questionId)) {
        throw new UnprocessableEntityException(
          'Mỗi câu hỏi chỉ được gửi một lần.',
        );
      }

      const question = questionById.get(submittedAnswer.questionId);
      if (!question) {
        throw new UnprocessableEntityException('Câu hỏi không thuộc bài học này.');
      }

      if (
        question.type === QuestionType.SINGLE_CHOICE &&
        submittedAnswer.answerIds.length > 1
      ) {
        throw new UnprocessableEntityException(SINGLE_CHOICE_LIMIT_MESSAGE);
      }

      if (
        question.type === QuestionType.ESSAY &&
        submittedAnswer.answerIds.length > 1
      ) {
        throw new UnprocessableEntityException(ESSAY_CHOICE_LIMIT_MESSAGE);
      }

      if (question.type !== QuestionType.ESSAY && submittedAnswer.answerIds.length === 0) {
        throw new UnprocessableEntityException(MISSING_ANSWERS_MESSAGE);
      }

      for (const answerId of submittedAnswer.answerIds) {
        const answerBelongsToQuestion = question.answers.some(
          (answer) => answer.id === answerId,
        );
        if (!answerBelongsToQuestion) {
          throw new UnprocessableEntityException(
            'Đáp án không thuộc câu hỏi tương ứng.',
          );
        }
      }

      selectedAnswerIdsByQuestion.set(
        submittedAnswer.questionId,
        submittedAnswer.answerIds,
      );
    }

    if (selectedAnswerIdsByQuestion.size !== lessonQuestions.length) {
      throw new UnprocessableEntityException(MISSING_ANSWERS_MESSAGE);
    }

    return selectedAnswerIdsByQuestion;
  }

  private buildQuestionsResult(
    lessonQuestions: LessonQuestionSnapshot[],
    selectedAnswerIdsByQuestion: Map<string, string[]>,
    evaluationsByQuestion: Map<string, QuestionEvaluation>,
  ): QuestionResult[] {
    return lessonQuestions.map((question) => {
      const selectedAnswerIds = selectedAnswerIdsByQuestion.get(question.id) ?? [];
      const evaluation = evaluationsByQuestion.get(question.id) ?? {
        earnedCorrectCount: 0,
        isCorrect: false,
      };

      return {
        id: question.id,
        type: question.type,
        text: question.text,
        explanation: question.explanation,
        answers: question.answers.map((answer) => ({
          id: answer.id,
          text: answer.text,
          isCorrect: answer.isCorrect,
          explanation: answer.explanation,
        })),
        selectedAnswerIds,
        selectedAnswerId: selectedAnswerIds[0] ?? null,
        isCorrect: evaluation.isCorrect,
      };
    });
  }

  private groupSelectedAnswerIdsByQuestion(
    submissions: Array<{ questionId: string; answerId: string }>,
  ): Map<string, string[]> {
    const selectedAnswerIdsByQuestion = new Map<string, string[]>();

    for (const submission of submissions) {
      const existingAnswerIds =
        selectedAnswerIdsByQuestion.get(submission.questionId) ?? [];
      existingAnswerIds.push(submission.answerId);
      selectedAnswerIdsByQuestion.set(submission.questionId, existingAnswerIds);
    }

    return selectedAnswerIdsByQuestion;
  }

  private evaluateQuestions(
    lessonQuestions: LessonQuestionSnapshot[],
    selectedAnswerIdsByQuestion: Map<string, string[]>,
  ): Map<string, QuestionEvaluation> {
    const evaluationsByQuestion = new Map<string, QuestionEvaluation>();

    for (const question of lessonQuestions) {
      evaluationsByQuestion.set(
        question.id,
        this.evaluateQuestion(
          question,
          selectedAnswerIdsByQuestion.get(question.id) ?? [],
        ),
      );
    }

    return evaluationsByQuestion;
  }

  private evaluateQuestion(
    question: LessonQuestionSnapshot,
    selectedAnswerIds: string[],
  ): QuestionEvaluation {
    if (question.type === QuestionType.ESSAY) {
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

  private buildSubmissionRows(attemptId: string, questions: QuestionResult[]) {
    const submissionRows: Array<{
      attemptId: string;
      questionId: string;
      answerId: string;
      isCorrect: boolean;
    }> = [];

    for (const question of questions) {
      for (const answerId of question.selectedAnswerIds) {
        submissionRows.push({
          attemptId,
          questionId: question.id,
          answerId,
          isCorrect: question.isCorrect,
        });
      }
    }

    return submissionRows;
  }

  private countGradableQuestions(lessonQuestions: LessonQuestionSnapshot[]): number {
    return lessonQuestions.filter((question) => question.type !== QuestionType.ESSAY)
      .length;
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
