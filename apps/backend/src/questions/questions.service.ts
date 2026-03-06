import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAllByLesson(lessonId: string) {
    return this.prisma.question.findMany({
      where: { lessonId },
      include: {
        answers: {
          orderBy: {
            id: 'asc',
          },
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
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  async create(lessonId: string, dto: CreateQuestionDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    this.validateAnswers(dto.answers);

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
        ...(dto.explanation !== undefined ? { explanation: dto.explanation } : {}),
        orderIndex: nextOrderIndex,
        answers: {
          create: this.mapAnswersForCreate(dto.answers),
        },
      },
      include: {
        answers: {
          orderBy: {
            id: 'asc',
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateQuestionDto) {
    await this.findById(id);

    if (dto.answers !== undefined) {
      this.validateAnswers(dto.answers);
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
          ...(dto.explanation !== undefined ? { explanation: dto.explanation } : {}),
          ...(dto.orderIndex !== undefined ? { orderIndex: dto.orderIndex } : {}),
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
            orderBy: {
              id: 'asc',
            },
          },
        },
      });
    });
  }

  async delete(id: string): Promise<{ deleted: true; id: string }> {
    await this.findById(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.submission.deleteMany({
        where: {
          questionId: id,
        },
      });

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

  private validateAnswers(answers: CreateAnswerDto[]): void {
    if (!Array.isArray(answers) || answers.length < 2) {
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
      ...(answer.explanation !== undefined
        ? { explanation: answer.explanation }
        : {}),
    }));
  }
}
