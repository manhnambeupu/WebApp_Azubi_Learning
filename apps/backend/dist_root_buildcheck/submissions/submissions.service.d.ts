import { QuestionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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
type AttemptDetailResponse = {
    attemptId: string;
    attemptNumber: number;
    totalQuestions: number;
    correctCount: number;
    score: number;
    questions: QuestionResult[];
};
export declare class SubmissionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    submitQuiz(userId: string, lessonId: string, dto: SubmitQuizDto): Promise<AttemptDetailResponse>;
    getAttemptHistory(userId: string, lessonId: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        attemptNumber: number;
        score: number | null;
        correctCount: number | null;
        submittedAt: Date;
    }[]>;
    getAttemptDetail(userId: string, lessonId: string, attemptId: string): Promise<AttemptDetailResponse>;
    getLatestAttempt(userId: string, lessonId: string): Promise<AttemptDetailResponse | null>;
    private getLessonQuestions;
    private hasLessonAccess;
    private validateSubmittedAnswers;
    private buildQuestionsResult;
    private groupSubmittedAnswersByQuestion;
    private evaluateQuestions;
    private evaluateQuestion;
    private buildSubmissionRows;
    private countGradableQuestions;
    private calculateCorrectCount;
    private calculateScore;
}
export {};
