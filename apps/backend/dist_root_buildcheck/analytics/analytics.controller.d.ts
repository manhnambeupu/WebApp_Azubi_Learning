import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getOverview(): Promise<{
        activeStudentsThisWeek: number;
        avgActiveTimeSeconds: number;
        avgScore: number;
        improvementRate: number;
    }>;
    getStudentsSummary(): Promise<{
        id: string;
        fullName: string;
        email: string;
        lessonsCompleted: number;
        avgActiveTimeSeconds: number;
        avgScore: number;
        lastActiveAt: Date | null;
    }[]>;
    getStudentDetail(id: string): Promise<{
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
    }>;
    deleteStudentAnalytics(id: string): Promise<{
        deletedCount: number;
    }>;
}
