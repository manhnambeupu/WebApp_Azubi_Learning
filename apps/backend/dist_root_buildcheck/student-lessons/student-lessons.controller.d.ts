import { StudentLessonsService } from './student-lessons.service';
export declare class StudentLessonsController {
    private readonly studentLessonsService;
    constructor(studentLessonsService: StudentLessonsService);
    findAllForStudent(currentUser: Record<string, unknown> | undefined): Promise<{
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
    findDetailForStudent(lessonId: string, currentUser: Record<string, unknown> | undefined): Promise<{
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
    private extractUserId;
}
