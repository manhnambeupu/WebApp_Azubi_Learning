import { QuestionType } from '@prisma/client';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MinioService } from '../files/minio.service';
import { PrismaService } from '../prisma/prisma.service';

const LESSON_FILES_BUCKET = 'lesson-files';

@Injectable()
export class StudentLessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  async findAllForStudent(userId: string) {
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

  async findDetailForStudent(lessonId: string, userId: string) {
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
                orderIndex: true,
                answers: {
                  select: {
                    id: true,
                  text: true,
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
      throw new NotFoundException('Lesson not found');
    }

    return {
      ...lesson,
      questions: lesson.questions.map((question) => ({
        id: question.id,
        type: question.type,
        text: question.text,
        orderIndex: question.orderIndex,
        answers:
          question.type === QuestionType.ESSAY
            ? []
            : question.answers.map((answer) => ({
                id: answer.id,
                text: answer.text,
              })),
      })),
      isCompleted: Boolean(firstAttempt),
    };
  }

  async getFileDownloadUrl(
    lessonId: string,
    fileId: string,
  ): Promise<{ downloadUrl: string }> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
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
      throw new NotFoundException('Lesson file not found');
    }

    const objectName = this.extractObjectNameFromUrl(
      LESSON_FILES_BUCKET,
      lessonFile.fileUrl,
    );
    const downloadUrl = await this.minioService.getPresignedUrl(
      LESSON_FILES_BUCKET,
      objectName,
    );

    return { downloadUrl };
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
