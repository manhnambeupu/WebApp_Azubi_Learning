import { MinioService } from '../files/minio.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
export declare class QuestionsService {
    private readonly prisma;
    private readonly minioService;
    constructor(prisma: PrismaService, minioService: MinioService);
    findAllByLesson(lessonId: string): import(".prisma/client").Prisma.PrismaPromise<({
        answers: {
            id: string;
            questionId: string;
            orderIndex: number | null;
            matchText: string | null;
            isCorrect: boolean;
            text: string;
            explanation: string | null;
        }[];
    } & {
        id: string;
        lessonId: string;
        type: import(".prisma/client").$Enums.QuestionType;
        imageUrl: string | null;
        isPrivate: boolean;
        orderIndex: number;
        text: string;
        explanation: string | null;
    })[]>;
    findById(id: string): Promise<{
        answers: {
            id: string;
            questionId: string;
            orderIndex: number | null;
            matchText: string | null;
            isCorrect: boolean;
            text: string;
            explanation: string | null;
        }[];
    } & {
        id: string;
        lessonId: string;
        type: import(".prisma/client").$Enums.QuestionType;
        imageUrl: string | null;
        isPrivate: boolean;
        orderIndex: number;
        text: string;
        explanation: string | null;
    }>;
    uploadQuestionImage(imageFile: Express.Multer.File): Promise<{
        imageUrl: string;
    }>;
    create(lessonId: string, dto: CreateQuestionDto): Promise<{
        answers: {
            id: string;
            questionId: string;
            orderIndex: number | null;
            matchText: string | null;
            isCorrect: boolean;
            text: string;
            explanation: string | null;
        }[];
    } & {
        id: string;
        lessonId: string;
        type: import(".prisma/client").$Enums.QuestionType;
        imageUrl: string | null;
        isPrivate: boolean;
        orderIndex: number;
        text: string;
        explanation: string | null;
    }>;
    update(id: string, dto: UpdateQuestionDto): Promise<{
        answers: {
            id: string;
            questionId: string;
            orderIndex: number | null;
            matchText: string | null;
            isCorrect: boolean;
            text: string;
            explanation: string | null;
        }[];
    } & {
        id: string;
        lessonId: string;
        type: import(".prisma/client").$Enums.QuestionType;
        imageUrl: string | null;
        isPrivate: boolean;
        orderIndex: number;
        text: string;
        explanation: string | null;
    }>;
    delete(id: string): Promise<{
        deleted: true;
        id: string;
    }>;
    reorder(lessonId: string, questionIds: string[]): Promise<({
        answers: {
            id: string;
            questionId: string;
            orderIndex: number | null;
            matchText: string | null;
            isCorrect: boolean;
            text: string;
            explanation: string | null;
        }[];
    } & {
        id: string;
        lessonId: string;
        type: import(".prisma/client").$Enums.QuestionType;
        imageUrl: string | null;
        isPrivate: boolean;
        orderIndex: number;
        text: string;
        explanation: string | null;
    })[]>;
    private validateAnswers;
    private mapAnswersForCreate;
    private buildImageObjectName;
}
