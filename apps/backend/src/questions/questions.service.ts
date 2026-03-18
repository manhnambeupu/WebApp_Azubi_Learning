import { QuestionType } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { MinioService } from '../files/minio.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

const QUESTION_IMAGES_BUCKET = 'lesson-images';
const WEBP_MIME_TYPE = 'image/webp';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  findAllByLesson(lessonId: string) {
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

  async findById(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        answers: {
          orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  async uploadQuestionImage(
    imageFile: Express.Multer.File,
  ): Promise<{ imageUrl: string }> {
    const safeBuffer = await sharp(imageFile.buffer)
      .rotate()
      .resize({ width: 1280, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const imageUrl = await this.minioService.uploadFile(
      QUESTION_IMAGES_BUCKET,
      this.buildImageObjectName(imageFile.originalname),
      safeBuffer,
      WEBP_MIME_TYPE,
    );

    return { imageUrl };
  }

  async create(lessonId: string, dto: CreateQuestionDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const questionType = dto.type ?? QuestionType.SINGLE_CHOICE;
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

  async update(id: string, dto: UpdateQuestionDto) {
    const existingQuestion = await this.findById(id);

    if (dto.answers !== undefined || dto.type !== undefined) {
      this.validateAnswers(
        dto.type ?? existingQuestion.type,
        dto.answers ?? existingQuestion.answers,
      );
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

  async delete(id: string): Promise<{ deleted: true; id: string }> {
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

  async reorder(lessonId: string, questionIds: string[]) {
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
      throw new UnprocessableEntityException(
        'Tất cả câu hỏi phải thuộc về bài học đã chọn.',
      );
    }

    await this.prisma.$transaction(
      questionIds.map((questionId, index) =>
        this.prisma.question.update({
          where: { id: questionId },
          data: {
            orderIndex: index + 1,
          },
        }),
      ),
    );

    return this.findAllByLesson(lessonId);
  }

  private validateAnswers(
    type: QuestionType,
    answers: Array<{ isCorrect: boolean }>,
  ): void {
    if (!Array.isArray(answers)) {
      throw new UnprocessableEntityException('Danh sách đáp án không hợp lệ.');
    }

    if (type === QuestionType.ESSAY || type === QuestionType.IMAGE_ESSAY) {
      if (answers.length > 1) {
        throw new UnprocessableEntityException(
          'Câu hỏi tự luận chỉ được có tối đa 1 đáp án mẫu.',
        );
      }

      return;
    }

    if (answers.length < 2) {
      throw new UnprocessableEntityException(
        'Mỗi câu hỏi phải có ít nhất 2 đáp án.',
      );
    }

    const hasCorrectAnswer = answers.some((answer) => answer.isCorrect);
    if (!hasCorrectAnswer) {
      throw new UnprocessableEntityException(
        'Mỗi câu hỏi phải có ít nhất 1 đáp án đúng.',
      );
    }
  }

  private mapAnswersForCreate(answers: CreateAnswerDto[]) {
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

  private buildImageObjectName(originalName: string): string {
    const normalizedName = originalName.replace(/\s+/g, '-');
    const baseName = normalizedName.replace(/\.[^/.]+$/, '');
    return `questions/${randomUUID()}-${baseName}.webp`;
  }
}
