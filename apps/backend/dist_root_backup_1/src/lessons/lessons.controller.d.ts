import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonsService } from './lessons.service';
export declare class LessonsController {
    private readonly lessonsService;
    constructor(lessonsService: LessonsService);
    findAll(categoryId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        category: {
            id: string;
            name: string;
        };
        _count: {
            files: number;
            questions: number;
        };
    } & {
        id: string;
        createdAt: Date;
        summary: string;
        title: string;
        contentMd: string;
        categoryId: string;
        imageUrl: string | null;
        updatedAt: Date;
    })[]>;
    findById(id: string): Promise<{
        category: {
            id: string;
            name: string;
        };
        files: {
            id: string;
            lessonId: string;
            uploadedAt: Date;
            fileName: string;
            fileUrl: string;
        }[];
        questions: ({
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
        })[];
    } & {
        id: string;
        createdAt: Date;
        summary: string;
        title: string;
        contentMd: string;
        categoryId: string;
        imageUrl: string | null;
        updatedAt: Date;
    }>;
    create(dto: CreateLessonDto, imageFile?: Express.Multer.File): Promise<{
        category: {
            id: string;
            name: string;
        };
        _count: {
            files: number;
            questions: number;
        };
    } & {
        id: string;
        createdAt: Date;
        summary: string;
        title: string;
        contentMd: string;
        categoryId: string;
        imageUrl: string | null;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateLessonDto, imageFile?: Express.Multer.File): Promise<{
        category: {
            id: string;
            name: string;
        };
        _count: {
            files: number;
            questions: number;
        };
    } & {
        id: string;
        createdAt: Date;
        summary: string;
        title: string;
        contentMd: string;
        categoryId: string;
        imageUrl: string | null;
        updatedAt: Date;
    }>;
    delete(id: string): Promise<{
        deleted: true;
        id: string;
    }>;
    uploadLessonFile(lessonId: string, file: Express.Multer.File): Promise<{
        id: string;
        lessonId: string;
        uploadedAt: Date;
        fileName: string;
        fileUrl: string;
    }>;
    deleteLessonFile(lessonId: string, fileId: string): Promise<{
        deleted: true;
        id: string;
    }>;
    getLessonFileDownloadUrl(lessonId: string, fileId: string): Promise<{
        downloadUrl: string;
    }>;
}
