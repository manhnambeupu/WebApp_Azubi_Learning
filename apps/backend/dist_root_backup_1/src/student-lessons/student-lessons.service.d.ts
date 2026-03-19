import { MinioService } from '../files/minio.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class StudentLessonsService {
    private readonly prisma;
    private readonly minioService;
    constructor(prisma: PrismaService, minioService: MinioService);
    findAllForStudent(userId: string): Promise<{
        isCompleted: boolean;
        id: string;
        category: {
            id: string;
            name: string;
        };
        summary: string;
        title: string;
        _count: {
            questions: number;
        };
        imageUrl: string | null;
    }[]>;
    findDetailForStudent(lessonId: string, userId: string): Promise<{
        questions: {
            matchingOptions?: string[] | undefined;
            id: string;
            type: import(".prisma/client").$Enums.QuestionType;
            text: string;
            imageUrl: string | null;
            orderIndex: number;
            answers: {
                id: string;
                text: string;
            }[];
        }[];
        isCompleted: boolean;
        id: string;
        category: {
            id: string;
            name: string;
        };
        summary: string;
        title: string;
        contentMd: string;
        imageUrl: string | null;
        files: {
            id: string;
            lessonId: string;
            uploadedAt: Date;
            fileName: string;
            fileUrl: string;
        }[];
    }>;
    getFileDownloadUrl(lessonId: string, fileId: string): Promise<{
        downloadUrl: string;
    }>;
    private extractObjectNameFromUrl;
}
