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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionsService = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const sharp_1 = __importDefault(require("sharp"));
const minio_service_1 = require("../files/minio.service");
const prisma_service_1 = require("../prisma/prisma.service");
const QUESTION_IMAGES_BUCKET = 'lesson-images';
const WEBP_MIME_TYPE = 'image/webp';
let QuestionsService = class QuestionsService {
    prisma;
    minioService;
    constructor(prisma, minioService) {
        this.prisma = prisma;
        this.minioService = minioService;
    }
    findAllByLesson(lessonId) {
        return this.prisma.question.findMany({
            where: { lessonId },
            include: {
                answers: {
                    orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
                },
            },
            orderBy: {
                orderIndex: 'asc',
            },
        });
    }
    async findById(id) {
        const question = await this.prisma.question.findUnique({
            where: { id },
            include: {
                answers: {
                    orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
                },
            },
        });
        if (!question) {
            throw new common_1.NotFoundException('Question not found');
        }
        return question;
    }
    async uploadQuestionImage(imageFile) {
        const safeBuffer = await (0, sharp_1.default)(imageFile.buffer)
            .rotate()
            .resize({ width: 1280, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
        const imageUrl = await this.minioService.uploadFile(QUESTION_IMAGES_BUCKET, this.buildImageObjectName(imageFile.originalname), safeBuffer, WEBP_MIME_TYPE);
        return { imageUrl };
    }
    async create(lessonId, dto) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { id: true },
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        const questionType = dto.type ?? client_1.QuestionType.SINGLE_CHOICE;
        this.validateAnswers(questionType, dto.answers);
        const latestQuestion = await this.prisma.question.findFirst({
            where: { lessonId },
            orderBy: {
                orderIndex: 'desc',
            },
            select: {
                orderIndex: true,
            },
        });
        const nextOrderIndex = (latestQuestion?.orderIndex ?? 0) + 1;
        return this.prisma.question.create({
            data: {
                lessonId,
                text: dto.text,
                ...(dto.explanation !== undefined
                    ? { explanation: dto.explanation }
                    : {}),
                ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
                type: questionType,
                orderIndex: nextOrderIndex,
                answers: {
                    create: this.mapAnswersForCreate(dto.answers),
                },
            },
            include: {
                answers: {
                    orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
                },
            },
        });
    }
    async update(id, dto) {
        const existingQuestion = await this.findById(id);
        if (dto.answers !== undefined || dto.type !== undefined) {
            this.validateAnswers(dto.type ?? existingQuestion.type, dto.answers ?? existingQuestion.answers);
        }
        return this.prisma.$transaction(async (tx) => {
            if (dto.answers !== undefined) {
                await tx.answer.deleteMany({
                    where: { questionId: id },
                });
            }
            return tx.question.update({
                where: { id },
                data: {
                    ...(dto.text !== undefined ? { text: dto.text } : {}),
                    ...(dto.explanation !== undefined
                        ? { explanation: dto.explanation }
                        : {}),
                    ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
                    ...(dto.type !== undefined ? { type: dto.type } : {}),
                    ...(dto.orderIndex !== undefined
                        ? { orderIndex: dto.orderIndex }
                        : {}),
                    ...(dto.answers !== undefined
                        ? {
                            answers: {
                                create: this.mapAnswersForCreate(dto.answers),
                            },
                        }
                        : {}),
                },
                include: {
                    answers: {
                        orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
                    },
                },
            });
        });
    }
    async delete(id) {
        await this.findById(id);
        await this.prisma.$transaction(async (tx) => {
            await tx.question.delete({
                where: { id },
            });
        });
        return {
            deleted: true,
            id,
        };
    }
    async reorder(lessonId, questionIds) {
        const matchedQuestions = await this.prisma.question.findMany({
            where: {
                lessonId,
                id: {
                    in: questionIds,
                },
            },
            select: {
                id: true,
            },
        });
        if (matchedQuestions.length !== questionIds.length) {
            throw new common_1.UnprocessableEntityException('Tất cả câu hỏi phải thuộc về bài học đã chọn.');
        }
        await this.prisma.$transaction(questionIds.map((questionId, index) => this.prisma.question.update({
            where: { id: questionId },
            data: {
                orderIndex: index + 1,
            },
        })));
        return this.findAllByLesson(lessonId);
    }
    validateAnswers(type, answers) {
        if (!Array.isArray(answers)) {
            throw new common_1.UnprocessableEntityException('Danh sách đáp án không hợp lệ.');
        }
        if (type === client_1.QuestionType.ESSAY || type === client_1.QuestionType.IMAGE_ESSAY) {
            if (answers.length > 1) {
                throw new common_1.UnprocessableEntityException('Câu hỏi tự luận chỉ được có tối đa 1 đáp án mẫu.');
            }
            return;
        }
        if (answers.length < 2) {
            throw new common_1.UnprocessableEntityException('Mỗi câu hỏi phải có ít nhất 2 đáp án.');
        }
        const hasCorrectAnswer = answers.some((answer) => answer.isCorrect);
        if (!hasCorrectAnswer) {
            throw new common_1.UnprocessableEntityException('Mỗi câu hỏi phải có ít nhất 1 đáp án đúng.');
        }
    }
    mapAnswersForCreate(answers) {
        return answers.map((answer) => ({
            text: answer.text,
            isCorrect: answer.isCorrect,
            ...(answer.orderIndex !== undefined
                ? { orderIndex: answer.orderIndex }
                : {}),
            ...(answer.matchText !== undefined
                ? { matchText: answer.matchText }
                : {}),
            ...(answer.explanation !== undefined
                ? { explanation: answer.explanation }
                : {}),
        }));
    }
    buildImageObjectName(originalName) {
        const normalizedName = originalName.replace(/\s+/g, '-');
        const baseName = normalizedName.replace(/\.[^/.]+$/, '');
        return `questions/${(0, crypto_1.randomUUID)()}-${baseName}.webp`;
    }
};
exports.QuestionsService = QuestionsService;
exports.QuestionsService = QuestionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        minio_service_1.MinioService])
], QuestionsService);
//# sourceMappingURL=questions.service.js.map