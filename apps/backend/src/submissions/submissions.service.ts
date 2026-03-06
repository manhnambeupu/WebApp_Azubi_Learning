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
  text: string;
  explanation: string | null;
  answers: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string | null;
  }[];
  selectedAnswerId: string;
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

const MISSING_ANSWERS_MESSAGE = 'Vui lòng trả lời tất cả câu hỏi.';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitQuiz(
    userId: string,
    lessonId: string,
    dto: SubmitQuizDto,
  ): Promise<AttemptDetailResponse> {
    const lessonQuestions = await this.getLessonQuestions(lessonId);
    const selectedAnswerByQuestion = this.validateSubmittedAnswers(
      lessonQuestions,
      dto.answers,
    );

    const questionsResult = this.buildQuestionsResult(
      lessonQuestions,
      selectedAnswerByQuestion,
    );
    const totalQuestions = questionsResult.length;
    const correctCount = questionsResult.filter((question) => question.isCorrect).length;
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

      await tx.submission.createMany({
        data: questionsResult.map((question) => ({
          attemptId: createdAttempt.id,
          questionId: question.id,
          answerId: question.selectedAnswerId,
          isCorrect: question.isCorrect,
        })),
      });

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
            isCorrect: true,
            question: {
              select: {
                id: true,
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
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    const sortedSubmissions = attempt.submissions
      .slice()
      .sort((a, b) => a.question.orderIndex - b.question.orderIndex);
    const questions = sortedSubmissions.map((submission) => ({
      id: submission.question.id,
      text: submission.question.text,
      explanation: submission.question.explanation,
      answers: submission.question.answers.map((answer) => ({
        id: answer.id,
        text: answer.text,
        isCorrect: answer.isCorrect,
        explanation: answer.explanation,
      })),
      selectedAnswerId: submission.answerId,
      isCorrect: submission.isCorrect,
    }));
    const totalQuestions = questions.length;
    const correctCount =
      attempt.correctCount ?? questions.filter((question) => question.isCorrect).length;
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
  ): Map<string, string> {
    const selectedAnswerByQuestion = new Map<string, string>();
    const questionById = new Map(
      lessonQuestions.map((question) => [question.id, question] as const),
    );

    for (const submittedAnswer of submittedAnswers) {
      if (selectedAnswerByQuestion.has(submittedAnswer.questionId)) {
        throw new UnprocessableEntityException(
          'Mỗi câu hỏi chỉ được chọn một đáp án.',
        );
      }

      const question = questionById.get(submittedAnswer.questionId);
      if (!question) {
        throw new UnprocessableEntityException('Câu hỏi không thuộc bài học này.');
      }

      const answerBelongsToQuestion = question.answers.some(
        (answer) => answer.id === submittedAnswer.answerId,
      );
      if (!answerBelongsToQuestion) {
        throw new UnprocessableEntityException(
          'Đáp án không thuộc câu hỏi tương ứng.',
        );
      }

      selectedAnswerByQuestion.set(submittedAnswer.questionId, submittedAnswer.answerId);
    }

    if (selectedAnswerByQuestion.size !== lessonQuestions.length) {
      throw new UnprocessableEntityException(MISSING_ANSWERS_MESSAGE);
    }

    return selectedAnswerByQuestion;
  }

  private buildQuestionsResult(
    lessonQuestions: LessonQuestionSnapshot[],
    selectedAnswerByQuestion: Map<string, string>,
  ): QuestionResult[] {
    return lessonQuestions.map((question) => {
      const selectedAnswerId = selectedAnswerByQuestion.get(question.id);
      if (!selectedAnswerId) {
        throw new UnprocessableEntityException(MISSING_ANSWERS_MESSAGE);
      }

      const selectedAnswer = question.answers.find(
        (answer) => answer.id === selectedAnswerId,
      );
      if (!selectedAnswer) {
        throw new UnprocessableEntityException(
          'Đáp án không thuộc câu hỏi tương ứng.',
        );
      }

      return {
        id: question.id,
        text: question.text,
        explanation: question.explanation,
        answers: question.answers.map((answer) => ({
          id: answer.id,
          text: answer.text,
          isCorrect: answer.isCorrect,
          explanation: answer.explanation,
        })),
        selectedAnswerId,
        isCorrect: selectedAnswer.isCorrect,
      };
    });
  }

  private calculateScore(correctCount: number, totalQuestions: number): number {
    if (totalQuestions === 0) {
      return 0;
    }

    return Number(((correctCount / totalQuestions) * 100).toFixed(2));
  }
}
