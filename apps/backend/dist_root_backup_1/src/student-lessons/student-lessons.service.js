"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentLessonsService = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const minio_service_1 = require("../files/minio.service");
const prisma_service_1 = require("../prisma/prisma.service");
const LESSON_FILES_BUCKET = 'lesson-files';
let StudentLessonsService = class StudentLessonsService {
    prisma;
    minioService;
    constructor(prisma, minioService) {
        this.prisma = prisma;
        this.minioService = minioService;
    }
    async findAllForStudent(userId) {
        const lessons = await this.prisma.lesson.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                title: true,
                summary: true,
                imageUrl: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        questions: true,
                    },
                },
                lessonAttempts: {
                    where: {
                        userId,
                        attemptNumber: 1,
                    },
                    select: {
                        id: true,
                    },
                    take: 1,
                },
            },
        });
        return lessons.map(({ lessonAttempts, ...lesson }) => ({
            ...lesson,
            isCompleted: lessonAttempts.length > 0,
        }));
    }
    async findDetailForStudent(lessonId, userId) {
        const [lesson, firstAttempt] = await Promise.all([
            this.prisma.lesson.findUnique({
                where: { id: lessonId },
                select: {
                    id: true,
                    title: true,
                    summary: true,
                    contentMd: true,
                    imageUrl: true,
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    files: {
                        select: {
                            id: true,
                            lessonId: true,
                            fileName: true,
                            fileUrl: true,
                            uploadedAt: true,
                        },
                        orderBy: {
                            uploadedAt: 'desc',
                        },
                    },
                    questions: {
                        orderBy: {
                            orderIndex: 'asc',
                        },
                        select: {
                            id: true,
                            type: true,
                            text: true,
                            imageUrl: true,
                            orderIndex: true,
                            answers: {
                                select: {
                                    id: true,
                                    text: true,
                                    matchText: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.lessonAttempt.findFirst({
                where: {
                    lessonId,
                    userId,
                    attemptNumber: 1,
                },
                select: {
                    id: true,
                },
            }),
        ]);
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        return {
            ...lesson,
            questions: lesson.questions.map((question) => ({
                id: question.id,
                type: question.type,
                text: question.text,
                imageUrl: question.imageUrl,
                orderIndex: question.orderIndex,
                answers: question.type === client_1.QuestionType.ESSAY ||
                    question.type === client_1.QuestionType.IMAGE_ESSAY
                    ? []
                    : question.answers.map((answer) => ({
                        id: answer.id,
                        text: answer.text,
                    })),
                ...(question.type === client_1.QuestionType.MATCHING
                    ? {
                        matchingOptions: [
                            ...new Set(question.answers
                                .map((answer) => answer.matchText)
                                .filter((matchText) => matchText !== null && matchText.trim().length > 0)),
                        ],
                    }
                    : {}),
            })),
            isCompleted: Boolean(firstAttempt),
        };
    }
    async getFileDownloadUrl(lessonId, fileId) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { id: true },
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        const lessonFile = await this.prisma.lessonFile.findFirst({
            where: {
                id: fileId,
                lessonId,
            },
            select: {
                fileUrl: true,
            },
        });
        if (!lessonFile) {
            throw new common_1.NotFoundException('Lesson file not found');
        }
        const objectName = this.extractObjectNameFromUrl(LESSON_FILES_BUCKET, lessonFile.fileUrl);
        const downloadUrl = await this.minioService.getPresignedUrl(LESSON_FILES_BUCKET, objectName);
        return { downloadUrl };
    }
    extractObjectNameFromUrl(bucketName, fileUrl) {
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
            const parsed = new URL(fileUrl);
            const bucketPrefix = `/${bucketName}/`;
            const bucketPrefixIndex = parsed.pathname.indexOf(bucketPrefix);
            if (bucketPrefixIndex === -1) {
                throw new common_1.BadRequestException('Stored file URL is invalid');
            }
            return decodeURIComponent(parsed.pathname.slice(bucketPrefixIndex + bucketPrefix.length));
        }
        if (fileUrl.startsWith(`${bucketName}/`)) {
            return fileUrl.slice(`${bucketName}/`.length);
        }
        return fileUrl;
    }
};
exports.StudentLessonsService = StudentLessonsService;
exports.StudentLessonsService = StudentLessonsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        minio_service_1.MinioService])
], StudentLessonsService);
//# sourceMappingURL=student-lessons.service.js.map