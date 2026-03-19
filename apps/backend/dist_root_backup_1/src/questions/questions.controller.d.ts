import { CreateQuestionDto } from './dto/create-question.dto';
import { ReorderQuestionsDto } from './dto/reorder-questions.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionsService } from './questions.service';
export declare class QuestionsController {
    private readonly questionsService;
    constructor(questionsService: QuestionsService);
    findAllByLesson(lessonId: string): import(".prisma/client").Prisma.PrismaPromise<({
        answers: {
            id: string;
            orderIndex: number | null;
            text: string;
            explanation: string | null;
            isCorrect: boolean;
            matchText: string | null;
            questionId: string;
        }[];
    } & {
        id: string;
        type: import(".prisma/client").$Enums.QuestionType;
        lessonId: string;
        imageUrl: string | null;
        orderIndex: number;
        text: string;
        explanation: string | null;
    })[]>;
    findById(lessonId: string, id: string): Promise<{
        answers: {
            id: string;
            orderIndex: number | null;
            text: string;
            explanation: string | null;
            isCorrect: boolean;
            matchText: string | null;
            questionId: string;
        }[];
    } & {
        id: string;
        type: import(".prisma/client").$Enums.QuestionType;
        lessonId: string;
        imageUrl: string | null;
        orderIndex: number;
        text: string;
        explanation: string | null;
    }>;
    create(lessonId: string, dto: CreateQuestionDto): Promise<{
        answers: {
            id: string;
            orderIndex: number | null;
            text: string;
            explanation: string | null;
            isCorrect: boolean;
            matchText: string | null;
            questionId: string;
        }[];
    } & {
        id: string;
        type: import(".prisma/client").$Enums.QuestionType;
        lessonId: string;
        imageUrl: string | null;
        orderIndex: number;
        text: string;
        explanation: string | null;
    }>;
    reorder(lessonId: string, dto: ReorderQuestionsDto): Promise<({
        answers: {
            id: string;
            orderIndex: number | null;
            text: string;
            explanation: string | null;
            isCorrect: boolean;
            matchText: string | null;
            questionId: string;
        }[];
    } & {
        id: string;
        type: import(".prisma/client").$Enums.QuestionType;
        lessonId: string;
        imageUrl: string | null;
        orderIndex: number;
        text: string;
        explanation: string | null;
    })[]>;
    update(lessonId: string, id: string, dto: UpdateQuestionDto): Promise<{
        answers: {
            id: string;
            orderIndex: number | null;
            text: string;
            explanation: string | null;
            isCorrect: boolean;
            matchText: string | null;
            questionId: string;
        }[];
    } & {
        id: string;
        type: import(".prisma/client").$Enums.QuestionType;
        lessonId: string;
        imageUrl: string | null;
        orderIndex: number;
        text: string;
        explanation: string | null;
    }>;
    delete(lessonId: string, id: string): Promise<{
        deleted: true;
        id: string;
    }>;
    private getQuestionInLesson;
}
export declare class QuestionsUploadController {
    private readonly questionsService;
    constructor(questionsService: QuestionsService);
    uploadImage(imageFile: Express.Multer.File): Promise<{
        imageUrl: string;
    }>;
}
