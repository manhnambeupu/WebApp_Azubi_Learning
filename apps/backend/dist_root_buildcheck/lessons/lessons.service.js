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
exports.LessonsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const sharp_1 = __importDefault(require("sharp"));
const minio_service_1 = require("../files/minio.service");
const prisma_service_1 = require("../prisma/prisma.service");
const IMAGE_BUCKET = 'lesson-images';
const LESSON_FILES_BUCKET = 'lesson-files';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_LESSON_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
]);
const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PDF_MIME_TYPE = 'application/pdf';
const LESSON_FILE_MIME_TYPES = new Set([
    DOCX_MIME_TYPE,
    PDF_MIME_TYPE,
]);
let LessonsService = class LessonsService {
    prisma;
    minioService;
    constructor(prisma, minioService) {
        this.prisma = prisma;
        this.minioService = minioService;
    }
    findAll(categoryId) {
        return this.prisma.lesson.findMany({
            where: categoryId ? { categoryId } : undefined,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        questions: true,
                        files: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findById(id) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                files: {
                    orderBy: {
                        uploadedAt: 'desc',
                    },
                },
                questions: {
                    include: {
                        answers: true,
                    },
                    orderBy: {
                        orderIndex: 'asc',
                    },
                },
            },
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        return lesson;
    }
    async create(dto, imageFile) {
        let imageUrl;
        if (imageFile) {
            this.validateImageFile(imageFile);
            const safeBuffer = await (0, sharp_1.default)(imageFile.buffer)
                .rotate()
                .resize({ width: 1280, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();
            imageUrl = await this.minioService.uploadFile(IMAGE_BUCKET, this.buildWebpObjectName(imageFile.originalname), safeBuffer, 'image/webp');
        }
        return this.prisma.lesson.create({
            data: {
                title: dto.title,
                summary: dto.summary,
                contentMd: dto.contentMd,
                categoryId: dto.categoryId,
                isPrivate: dto.isPrivate ?? false,
                ...(imageUrl ? { imageUrl } : {}),
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        questions: true,
                        files: true,
                    },
                },
            },
        });
    }
    async update(id, dto, imageFile) {
        const existingLesson = await this.prisma.lesson.findUnique({
            where: { id },
            select: {
                id: true,
                imageUrl: true,
            },
        });
        if (!existingLesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        let imageUrl;
        if (imageFile) {
            this.validateImageFile(imageFile);
            const safeBuffer = await (0, sharp_1.default)(imageFile.buffer)
                .rotate()
                .resize({ width: 1280, withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();
            if (existingLesson.imageUrl) {
                await this.minioService.deleteFile(IMAGE_BUCKET, this.extractObjectNameFromUrl(IMAGE_BUCKET, existingLesson.imageUrl));
            }
            imageUrl = await this.minioService.uploadFile(IMAGE_BUCKET, this.buildWebpObjectName(imageFile.originalname), safeBuffer, 'image/webp');
        }
        return this.prisma.lesson.update({
            where: { id },
            data: {
                ...(dto.title !== undefined ? { title: dto.title } : {}),
                ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
                ...(dto.contentMd !== undefined ? { contentMd: dto.contentMd } : {}),
                ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
                ...(dto.isPrivate !== undefined ? { isPrivate: dto.isPrivate } : {}),
                ...(imageUrl ? { imageUrl } : {}),
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        questions: true,
                        files: true,
                    },
                },
            },
        });
    }
    async getAccessList(lessonId) {
        await this.ensureLessonExists(lessonId);
        return this.prisma.studentLessonAccess.findMany({
            where: { lessonId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                    },
                },
            },
            orderBy: { grantedAt: 'desc' },
        });
    }
    async grantAccessByEmail(lessonId, email) {
        await this.ensureLessonExists(lessonId);
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('Học viên không tồn tại theo email này');
        }
        await this.prisma.studentLessonAccess.upsert({
            where: {
                userId_lessonId: {
                    userId: user.id,
                    lessonId,
                },
            },
            create: { lessonId, userId: user.id },
            update: {},
        });
        return { success: true };
    }
    async revokeAccess(lessonId, userId) {
        await this.ensureLessonExists(lessonId);
        await this.prisma.studentLessonAccess.deleteMany({
            where: { lessonId, userId },
        });
        return { success: true };
    }
    async delete(id) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id },
            include: {
                files: true,
            },
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        if (lesson.imageUrl) {
            await this.minioService.deleteFile(IMAGE_BUCKET, this.extractObjectNameFromUrl(IMAGE_BUCKET, lesson.imageUrl));
        }
        for (const lessonFile of lesson.files) {
            await this.minioService.deleteFile(LESSON_FILES_BUCKET, this.extractObjectNameFromUrl(LESSON_FILES_BUCKET, lessonFile.fileUrl));
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.submission.deleteMany({
                where: {
                    attempt: {
                        lessonId: id,
                    },
                },
            });
            await tx.submission.deleteMany({
                where: {
                    question: {
                        lessonId: id,
                    },
                },
            });
            await tx.lessonAttempt.deleteMany({
                where: { lessonId: id },
            });
            await tx.lessonFile.deleteMany({
                where: { lessonId: id },
            });
            await tx.answer.deleteMany({
                where: {
                    question: {
                        lessonId: id,
                    },
                },
            });
            await tx.question.deleteMany({
                where: {
                    lessonId: id,
                },
            });
            await tx.lesson.delete({
                where: { id },
            });
        });
        return { deleted: true, id };
    }
    async uploadLessonFile(lessonId, file) {
        this.validateLessonDocumentFile(file);
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { id: true },
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        const fileUrl = await this.minioService.uploadFile(LESSON_FILES_BUCKET, this.buildObjectName(file.originalname), file.buffer, file.mimetype);
        return this.prisma.lessonFile.create({
            data: {
                lessonId,
                fileName: file.originalname,
                fileUrl,
            },
        });
    }
    async deleteLessonFile(lessonId, fileId) {
        const lessonFile = await this.prisma.lessonFile.findFirst({
            where: {
                id: fileId,
                lessonId,
            },
        });
        if (!lessonFile) {
            throw new common_1.NotFoundException('Lesson file not found');
        }
        await this.minioService.deleteFile(LESSON_FILES_BUCKET, this.extractObjectNameFromUrl(LESSON_FILES_BUCKET, lessonFile.fileUrl));
        await this.prisma.lessonFile.delete({
            where: { id: fileId },
        });
        return { deleted: true, id: fileId };
    }
    async getLessonFileDownloadUrl(lessonId, fileId) {
        const lessonFile = await this.prisma.lessonFile.findFirst({
            where: {
                id: fileId,
                lessonId,
            },
        });
        if (!lessonFile) {
            throw new common_1.NotFoundException('Lesson file not found');
        }
        const downloadUrl = await this.minioService.getPresignedUrl(LESSON_FILES_BUCKET, this.extractObjectNameFromUrl(LESSON_FILES_BUCKET, lessonFile.fileUrl));
        return { downloadUrl };
    }
    validateImageFile(file) {
        if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
            throw new common_1.BadRequestException('Image must be a .jpg, .jpeg, .png, or .webp file. Supported file types: .jpg, .jpeg, .png, .webp');
        }
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
            throw new common_1.BadRequestException('Image size must not exceed 5MB');
        }
    }
    validateLessonDocumentFile(file) {
        const lowerName = file.originalname.toLowerCase();
        const hasDocxExtension = lowerName.endsWith('.docx');
        const hasPdfExtension = lowerName.endsWith('.pdf');
        const isDocxMime = file.mimetype === DOCX_MIME_TYPE;
        const isPdfMime = file.mimetype === PDF_MIME_TYPE;
        if (!((hasDocxExtension && isDocxMime) || (hasPdfExtension && isPdfMime))) {
            throw new common_1.BadRequestException('Lesson file must be a .docx or .pdf document. Supported file types: .docx, .pdf');
        }
        if (file.size > MAX_LESSON_FILE_SIZE_BYTES) {
            throw new common_1.BadRequestException('Lesson file size must not exceed 20MB. Supported file types: .docx, .pdf');
        }
    }
    buildObjectName(originalName) {
        return `${(0, crypto_1.randomUUID)()}-${originalName.replace(/\s+/g, '-')}`;
    }
    buildWebpObjectName(originalName) {
        return `${this.buildObjectName(originalName).replace(/\.[^/.]+$/, '')}.webp`;
    }
    async ensureLessonExists(lessonId) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { id: true },
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
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
exports.LessonsService = LessonsService;
exports.LessonsService = LessonsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        minio_service_1.MinioService])
], LessonsService);
//# sourceMappingURL=lessons.service.js.map