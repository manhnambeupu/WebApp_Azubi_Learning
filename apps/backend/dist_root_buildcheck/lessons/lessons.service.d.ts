import { MinioService } from '../files/minio.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
export declare class LessonsService {
    private readonly prisma;
    private readonly minioService;
    constructor(prisma: PrismaService, minioService: MinioService);
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
        summary: string;
        id: string;
        title: string;
        createdAt: Date;
        contentMd: string;
        imageUrl: string | null;
        isPrivate: boolean;
        categoryId: string;
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
        })[];
    } & {
        summary: string;
        id: string;
        title: string;
        createdAt: Date;
        contentMd: string;
        imageUrl: string | null;
        isPrivate: boolean;
        categoryId: string;
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
        summary: string;
        id: string;
        title: string;
        createdAt: Date;
        contentMd: string;
        imageUrl: string | null;
        isPrivate: boolean;
        categoryId: string;
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
        summary: string;
        id: string;
        title: string;
        createdAt: Date;
        contentMd: string;
        imageUrl: string | null;
        isPrivate: boolean;
        categoryId: string;
        updatedAt: Date;
    }>;
    getAccessList(lessonId: string): Promise<({
        user: {
            id: string;
            email: string;
            fullName: string;
        };
    } & {
        id: string;
        userId: string;
        lessonId: string;
        grantedAt: Date;
    })[]>;
    grantAccessByEmail(lessonId: string, email: string): Promise<{
        success: boolean;
    }>;
    revokeAccess(lessonId: string, userId: string): Promise<{
        success: boolean;
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
    private validateImageFile;
    private validateLessonDocumentFile;
    private buildObjectName;
    private buildWebpObjectName;
    private ensureLessonExists;
    private extractObjectNameFromUrl;
}
