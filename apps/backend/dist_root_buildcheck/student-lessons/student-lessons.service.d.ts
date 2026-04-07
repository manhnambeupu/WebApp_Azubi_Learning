import { MinioService } from '../files/minio.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class StudentLessonsService {
    private readonly prisma;
    private readonly minioService;
    constructor(prisma: PrismaService, minioService: MinioService);
    findAllForStudent(userId: string): Promise<{
        isCompleted: boolean;
        id: string;
        title: string;
        summary: string;
        imageUrl: string | null;
        category: {
            id: string;
            name: string;
        };
        _count: {
            questions: number;
        };
    }[]>;
    findDetailForStudent(lessonId: string, userId: string): Promise<{
        questions: {
            matchingOptions?: string[] | undefined;
            id: string;
            type: import(".prisma/client").$Enums.QuestionType;
            text: string;
            imageUrl: string | null;
            orderIndex: number;
            isLocked: boolean;
            answers: {
                id: string;
                text: string;
            }[];
        }[];
        isCompleted: boolean;
        id: string;
        title: string;
        summary: string;
        contentMd: string;
        imageUrl: string | null;
        category: {
            id: string;
            name: string;
        };
        files: {
            id: string;
            lessonId: string;
            fileName: string;
            fileUrl: string;
            uploadedAt: Date;
        }[];
    }>;
    getFileDownloadUrl(lessonId: string, fileId: string): Promise<{
        downloadUrl: string;
    }>;
    private extractObjectNameFromUrl;
}
