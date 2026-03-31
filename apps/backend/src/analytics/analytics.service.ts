import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type OverviewResponse = {
  activeStudentsThisWeek: number;
  avgActiveTimeSeconds: number;
  avgScore: number;
  improvementRate: number;
};

type StudentSummaryItem = {
  id: string;
  fullName: string;
  email: string;
  lessonsCompleted: number;
  avgActiveTimeSeconds: number;
  avgScore: number;
  lastActiveAt: Date | null;
};

type StudentDetailResponse = {
  student: {
    id: string;
    fullName: string;
    email: string;
  };
  lessons: Array<{
    lessonId: string;
    lessonTitle: string;
    totalAttempts: number;
    bestScore: number;
    latestScore: number;
    firstScore: number;
    improvementDelta: number;
    totalActiveSeconds: number;
    totalIdleSeconds: number;
  }>;
  weakQuestions: Array<{
    questionId: string;
    questionText: string;
    lessonTitle: string;
    orderIndex: number;
    incorrectRate: number;
  }>;
  scoreTrend: Array<{
    lessonId: string;
    lessonTitle: string;
    attempts: Array<{
      attemptNumber: number;
      score: number;
    }>;
  }>;
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<OverviewResponse> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [activeStudentsThisWeek, activityAggregate, attemptAggregate, attempts] =
      await Promise.all([
        this.prisma.activitySession.groupBy({
          by: ['userId'],
          where: {
            startedAt: {
              gte: sevenDaysAgo,
            },
          },
        }),
        this.prisma.activitySession.aggregate({
          _avg: {
            activeDurationSeconds: true,
          },
        }),
        this.prisma.lessonAttempt.aggregate({
          where: {
            score: { not: null },
          },
          _avg: {
            score: true,
          },
        }),
        this.prisma.lessonAttempt.findMany({
          where: {
            score: { not: null },
          },
          select: {
            userId: true,
            lessonId: true,
            attemptNumber: true,
            score: true,
          },
          orderBy: [
            { userId: 'asc' },
            { lessonId: 'asc' },
            { attemptNumber: 'asc' },
          ],
        }),
      ]);

    const attemptsByStudentLesson = new Map<
      string,
      Array<{ userId: string; score: number }>
    >();
    for (const attempt of attempts) {
      if (attempt.score === null) {
        continue;
      }
      const key = `${attempt.userId}:${attempt.lessonId}`;
      const list = attemptsByStudentLesson.get(key) ?? [];
      list.push({ userId: attempt.userId, score: attempt.score });
      attemptsByStudentLesson.set(key, list);
    }

    const studentsWithTwoOrMoreAttempts = new Set<string>();
    const studentsWithImprovement = new Set<string>();
    for (const lessonAttempts of attemptsByStudentLesson.values()) {
      if (lessonAttempts.length < 2) {
        continue;
      }
      const userId = lessonAttempts[0]?.userId;
      if (!userId) {
        continue;
      }
      studentsWithTwoOrMoreAttempts.add(userId);
      const firstScore = lessonAttempts[0]?.score;
      const latestScore = lessonAttempts[lessonAttempts.length - 1]?.score;
      if (firstScore !== undefined && latestScore !== undefined && latestScore > firstScore) {
        studentsWithImprovement.add(userId);
      }
    }

    return {
      activeStudentsThisWeek: activeStudentsThisWeek.length,
      avgActiveTimeSeconds: Number(activityAggregate._avg.activeDurationSeconds ?? 0),
      avgScore: Number(attemptAggregate._avg.score ?? 0),
      improvementRate:
        studentsWithTwoOrMoreAttempts.size === 0
          ? 0
          : (studentsWithImprovement.size / studentsWithTwoOrMoreAttempts.size) *
            100,
    };
  }

  async getStudentsSummary(): Promise<StudentSummaryItem[]> {
    const students = await this.prisma.user.findMany({
      where: { role: Role.STUDENT },
      select: {
        id: true,
        fullName: true,
        email: true,
        lessonAttempts: {
          select: {
            lessonId: true,
            score: true,
          },
        },
        activitySessions: {
          select: {
            startedAt: true,
            activeDurationSeconds: true,
          },
        },
      },
    });

    const summary = students.map((student) => {
      const distinctLessonIds = new Set(
        student.lessonAttempts.map((attempt) => attempt.lessonId),
      );

      const scores = student.lessonAttempts
        .map((attempt) => attempt.score)
        .filter((score): score is number => score !== null);

      const avgScore =
        scores.length === 0
          ? 0
          : scores.reduce((sum, score) => sum + score, 0) / scores.length;

      const activeDurations = student.activitySessions.map(
        (session) => session.activeDurationSeconds,
      );
      const avgActiveTimeSeconds =
        activeDurations.length === 0
          ? 0
          : activeDurations.reduce((sum, duration) => sum + duration, 0) /
            activeDurations.length;

      const lastActiveAt = student.activitySessions.reduce<Date | null>(
        (latest, session) => {
          if (!latest || session.startedAt > latest) {
            return session.startedAt;
          }
          return latest;
        },
        null,
      );

      return {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        lessonsCompleted: distinctLessonIds.size,
        avgActiveTimeSeconds,
        avgScore,
        lastActiveAt,
      };
    });

    summary.sort((left, right) => {
      const leftTime = left.lastActiveAt?.getTime() ?? 0;
      const rightTime = right.lastActiveAt?.getTime() ?? 0;
      return rightTime - leftTime;
    });

    return summary;
  }

  async getStudentDetail(studentId: string): Promise<StudentDetailResponse> {
    const student = await this.prisma.user.findFirst({
      where: {
        id: studentId,
        role: Role.STUDENT,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const [attempts, sessions, submissions] = await Promise.all([
      this.prisma.lessonAttempt.findMany({
        where: {
          userId: studentId,
        },
        select: {
          id: true,
          lessonId: true,
          attemptNumber: true,
          score: true,
          lesson: {
            select: {
              title: true,
            },
          },
        },
        orderBy: [{ lessonId: 'asc' }, { attemptNumber: 'asc' }],
      }),
      this.prisma.activitySession.findMany({
        where: {
          userId: studentId,
        },
        select: {
          lessonId: true,
          activeDurationSeconds: true,
          idleDurationSeconds: true,
        },
      }),
      this.prisma.submission.findMany({
        where: {
          attempt: {
            userId: studentId,
          },
        },
        select: {
          questionId: true,
          isCorrect: true,
          question: {
            select: {
              text: true,
              orderIndex: true,
              lesson: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const attemptsByLesson = new Map<
      string,
      Array<{ attemptNumber: number; score: number | null; lessonTitle: string }>
    >();
    for (const attempt of attempts) {
      const list = attemptsByLesson.get(attempt.lessonId) ?? [];
      list.push({
        attemptNumber: attempt.attemptNumber,
        score: attempt.score,
        lessonTitle: attempt.lesson.title,
      });
      attemptsByLesson.set(attempt.lessonId, list);
    }

    const sessionTotalsByLesson = new Map<
      string,
      { totalActiveSeconds: number; totalIdleSeconds: number }
    >();
    for (const session of sessions) {
      const current = sessionTotalsByLesson.get(session.lessonId) ?? {
        totalActiveSeconds: 0,
        totalIdleSeconds: 0,
      };
      current.totalActiveSeconds += session.activeDurationSeconds;
      current.totalIdleSeconds += session.idleDurationSeconds;
      sessionTotalsByLesson.set(session.lessonId, current);
    }

    const lessons = Array.from(attemptsByLesson.entries()).map(
      ([lessonId, lessonAttempts]) => {
        const sortedAttempts = [...lessonAttempts].sort(
          (left, right) => left.attemptNumber - right.attemptNumber,
        );
        const scoreAttempts = sortedAttempts.filter(
          (attempt): attempt is { attemptNumber: number; score: number; lessonTitle: string } =>
            attempt.score !== null,
        );

        const firstScore = scoreAttempts[0]?.score ?? 0;
        const latestScore = scoreAttempts[scoreAttempts.length - 1]?.score ?? 0;
        const bestScore = scoreAttempts.reduce(
          (max, attempt) => Math.max(max, attempt.score),
          0,
        );
        const durationTotals = sessionTotalsByLesson.get(lessonId) ?? {
          totalActiveSeconds: 0,
          totalIdleSeconds: 0,
        };

        return {
          lessonId,
          lessonTitle: sortedAttempts[0]?.lessonTitle ?? '',
          totalAttempts: sortedAttempts.length,
          bestScore,
          latestScore,
          firstScore,
          improvementDelta: latestScore - firstScore,
          totalActiveSeconds: durationTotals.totalActiveSeconds,
          totalIdleSeconds: durationTotals.totalIdleSeconds,
        };
      },
    );

    const questionStats = new Map<
      string,
      {
        questionText: string;
        lessonTitle: string;
        orderIndex: number;
        total: number;
        incorrect: number;
      }
    >();

    for (const submission of submissions) {
      const current = questionStats.get(submission.questionId) ?? {
        questionText: submission.question.text,
        lessonTitle: submission.question.lesson.title,
        orderIndex: submission.question.orderIndex,
        total: 0,
        incorrect: 0,
      };
      current.total += 1;
      if (!submission.isCorrect) {
        current.incorrect += 1;
      }
      questionStats.set(submission.questionId, current);
    }

    const weakQuestions = Array.from(questionStats.entries())
      .map(([questionId, stats]) => ({
        questionId,
        questionText: stats.questionText,
        lessonTitle: stats.lessonTitle,
        orderIndex: stats.orderIndex,
        incorrectRate: stats.total === 0 ? 0 : (stats.incorrect / stats.total) * 100,
      }))
      .filter((item) => item.incorrectRate > 50)
      .sort((left, right) => right.incorrectRate - left.incorrectRate);

    const scoreTrend = Array.from(attemptsByLesson.entries()).map(
      ([lessonId, lessonAttempts]) => ({
        lessonId,
        lessonTitle: lessonAttempts[0]?.lessonTitle ?? '',
        attempts: lessonAttempts
          .filter(
            (attempt): attempt is { attemptNumber: number; score: number; lessonTitle: string } =>
              attempt.score !== null,
          )
          .sort((left, right) => left.attemptNumber - right.attemptNumber)
          .map((attempt) => ({
            attemptNumber: attempt.attemptNumber,
            score: attempt.score,
          })),
      }),
    );

    return {
      student,
      lessons,
      weakQuestions,
      scoreTrend,
    };
  }

  async deleteStudentAnalytics(studentId: string): Promise<{ deletedCount: number }> {
    const deleted = await this.prisma.activitySession.deleteMany({
      where: {
        userId: studentId,
      },
    });

    return { deletedCount: deleted.count };
  }
}
