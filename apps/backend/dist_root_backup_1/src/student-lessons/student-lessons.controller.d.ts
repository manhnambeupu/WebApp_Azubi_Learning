import { StudentLessonsService } from './student-lessons.service';
export declare class StudentLessonsController {
    private readonly studentLessonsService;
    constructor(studentLessonsService: StudentLessonsService);
    findAllForStudent(currentUser: Record<string, unknown> | undefined): Promise<{
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
    findDetailForStudent(lessonId: string, currentUser: Record<string, unknown> | undefined): Promise<{
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
    private extractUserId;
}
