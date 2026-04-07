import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { SubmissionsService } from './submissions.service';
export declare class SubmissionsController {
    private readonly submissionsService;
    constructor(submissionsService: SubmissionsService);
    submitQuiz(lessonId: string, currentUser: Record<string, unknown> | undefined, dto: SubmitQuizDto): Promise<{
        attemptId: string;
        attemptNumber: number;
        totalQuestions: number;
        correctCount: number;
        score: number;
        questions: {
            id: string;
            type: import(".prisma/client").QuestionType;
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
        }[];
    }>;
    getAttemptHistory(lessonId: string, currentUser: Record<string, unknown> | undefined): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        attemptNumber: number;
        score: number | null;
        correctCount: number | null;
        submittedAt: Date;
    }[]>;
    getLatestAttempt(lessonId: string, currentUser: Record<string, unknown> | undefined): Promise<{
        attemptId: string;
        attemptNumber: number;
        totalQuestions: number;
        correctCount: number;
        score: number;
        questions: {
            id: string;
            type: import(".prisma/client").QuestionType;
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
        }[];
    } | null>;
    getAttemptDetail(lessonId: string, attemptId: string, currentUser: Record<string, unknown> | undefined): Promise<{
        attemptId: string;
        attemptNumber: number;
        totalQuestions: number;
        correctCount: number;
        score: number;
        questions: {
            id: string;
            type: import(".prisma/client").QuestionType;
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
        }[];
    }>;
    private extractUserId;
}
