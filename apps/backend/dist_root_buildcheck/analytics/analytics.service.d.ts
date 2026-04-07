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
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getOverview(): Promise<OverviewResponse>;
    getStudentsSummary(): Promise<StudentSummaryItem[]>;
    getStudentDetail(studentId: string): Promise<StudentDetailResponse>;
    deleteStudentAnalytics(studentId: string): Promise<{
        deletedCount: number;
    }>;
}
export {};
