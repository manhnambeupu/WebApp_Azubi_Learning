import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MinioService } from '../files/minio.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

const IMAGE_BUCKET = 'lesson-images';
const LESSON_FILES_BUCKET = 'lesson-files';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_LESSON_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png']);
const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PDF_MIME_TYPE = 'application/pdf';
const LESSON_FILE_MIME_TYPES = new Set([
  DOCX_MIME_TYPE,
  PDF_MIME_TYPE,
]);

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  findAll(categoryId?: string) {
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

  async findById(id: string) {
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
      throw new NotFoundException('Lesson not found');
    }

    return lesson;
  }

  async create(dto: CreateLessonDto, imageFile?: Express.Multer.File) {
    let imageUrl: string | undefined;
    if (imageFile) {
      this.validateImageFile(imageFile);
      imageUrl = await this.minioService.uploadFile(
        IMAGE_BUCKET,
        this.buildObjectName(imageFile.originalname),
        imageFile.buffer,
        imageFile.mimetype,
      );
    }

    return this.prisma.lesson.create({
      data: {
        title: dto.title,
        summary: dto.summary,
        contentMd: dto.contentMd,
        categoryId: dto.categoryId,
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

  async update(
    id: string,
    dto: UpdateLessonDto,
    imageFile?: Express.Multer.File,
  ) {
    const existingLesson = await this.prisma.lesson.findUnique({
      where: { id },
      select: {
        id: true,
        imageUrl: true,
      },
    });

    if (!existingLesson) {
      throw new NotFoundException('Lesson not found');
    }

    let imageUrl: string | undefined;
    if (imageFile) {
      this.validateImageFile(imageFile);

      if (existingLesson.imageUrl) {
        await this.minioService.deleteFile(
          IMAGE_BUCKET,
          this.extractObjectNameFromUrl(IMAGE_BUCKET, existingLesson.imageUrl),
        );
      }

      imageUrl = await this.minioService.uploadFile(
        IMAGE_BUCKET,
        this.buildObjectName(imageFile.originalname),
        imageFile.buffer,
        imageFile.mimetype,
      );
    }

    return this.prisma.lesson.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.summary !== undefined ? { summary: dto.summary } : {}),
        ...(dto.contentMd !== undefined ? { contentMd: dto.contentMd } : {}),
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
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

  async delete(id: string): Promise<{ deleted: true; id: string }> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        files: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.imageUrl) {
      await this.minioService.deleteFile(
        IMAGE_BUCKET,
        this.extractObjectNameFromUrl(IMAGE_BUCKET, lesson.imageUrl),
      );
    }

    for (const lessonFile of lesson.files) {
      await this.minioService.deleteFile(
        LESSON_FILES_BUCKET,
        this.extractObjectNameFromUrl(LESSON_FILES_BUCKET, lessonFile.fileUrl),
      );
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

  async uploadLessonFile(lessonId: string, file: Express.Multer.File) {
    this.validateLessonDocumentFile(file);

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const fileUrl = await this.minioService.uploadFile(
      LESSON_FILES_BUCKET,
      this.buildObjectName(file.originalname),
      file.buffer,
      file.mimetype,
    );

    return this.prisma.lessonFile.create({
      data: {
        lessonId,
        fileName: file.originalname,
        fileUrl,
      },
    });
  }

  async deleteLessonFile(
    lessonId: string,
    fileId: string,
  ): Promise<{ deleted: true; id: string }> {
    const lessonFile = await this.prisma.lessonFile.findFirst({
      where: {
        id: fileId,
        lessonId,
      },
    });

    if (!lessonFile) {
      throw new NotFoundException('Lesson file not found');
    }

    await this.minioService.deleteFile(
      LESSON_FILES_BUCKET,
      this.extractObjectNameFromUrl(LESSON_FILES_BUCKET, lessonFile.fileUrl),
    );

    await this.prisma.lessonFile.delete({
      where: { id: fileId },
    });

    return { deleted: true, id: fileId };
  }

  async getLessonFileDownloadUrl(
    lessonId: string,
    fileId: string,
  ): Promise<{ downloadUrl: string }> {
    const lessonFile = await this.prisma.lessonFile.findFirst({
      where: {
        id: fileId,
        lessonId,
      },
    });

    if (!lessonFile) {
      throw new NotFoundException('Lesson file not found');
    }

    const downloadUrl = await this.minioService.getPresignedUrl(
      LESSON_FILES_BUCKET,
      this.extractObjectNameFromUrl(LESSON_FILES_BUCKET, lessonFile.fileUrl),
    );

    return { downloadUrl };
  }

  private validateImageFile(file: Express.Multer.File): void {
    if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Image must be a .jpg or .png file. Supported file types: .jpg, .jpeg, .png');
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException('Image size must not exceed 5MB');
    }
  }

  private validateLessonDocumentFile(file: Express.Multer.File): void {
    const lowerName = file.originalname.toLowerCase();
    const hasDocxExtension = lowerName.endsWith('.docx');
    const hasPdfExtension = lowerName.endsWith('.pdf');
    const isDocxMime = file.mimetype === DOCX_MIME_TYPE;
    const isPdfMime = file.mimetype === PDF_MIME_TYPE;

    if (!((hasDocxExtension && isDocxMime) || (hasPdfExtension && isPdfMime))) {
      throw new BadRequestException('Lesson file must be a .docx or .pdf document. Supported file types: .docx, .pdf');
    }

    if (file.size > MAX_LESSON_FILE_SIZE_BYTES) {
      throw new BadRequestException('Lesson file size must not exceed 20MB. Supported file types: .docx, .pdf');
    }
  }

  private buildObjectName(originalName: string): string {
    return `${randomUUID()}-${originalName.replace(/\s+/g, '-')}`;
  }

  private extractObjectNameFromUrl(bucketName: string, fileUrl: string): string {
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const parsed = new URL(fileUrl);
      const bucketPrefix = `/${bucketName}/`;
      const bucketPrefixIndex = parsed.pathname.indexOf(bucketPrefix);

      if (bucketPrefixIndex === -1) {
        throw new BadRequestException('Stored file URL is invalid');
      }

      return decodeURIComponent(
        parsed.pathname.slice(bucketPrefixIndex + bucketPrefix.length),
      );
    }

    if (fileUrl.startsWith(`${bucketName}/`)) {
      return fileUrl.slice(`${bucketName}/`.length);
    }

    return fileUrl;
  }
}
