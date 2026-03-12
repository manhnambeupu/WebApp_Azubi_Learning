import { QuestionType } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionsService } from './questions.service';
import { UnprocessableEntityException } from '@nestjs/common';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let prisma: {
    lesson: {
      findUnique: jest.Mock;
    };
    question: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    submission: {
      deleteMany: jest.Mock;
    };
    answer: {
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const createDto: CreateQuestionDto = {
    text: 'Quy trình setup phòng gồm bước nào đầu tiên?',
    explanation: 'Đọc kỹ SOP trước khi thao tác.',
    type: QuestionType.SINGLE_CHOICE,
    answers: [
      { text: 'Kiểm tra danh sách phòng', isCorrect: true },
      { text: 'Đóng cửa phòng ngay', isCorrect: false },
    ],
  };

  beforeEach(async () => {
    prisma = {
      lesson: {
        findUnique: jest.fn(),
      },
      question: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      submission: {
        deleteMany: jest.fn(),
      },
      answer: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = moduleRef.get(QuestionsService);
  });

  it('Tạo question + answers thành công', async () => {
    prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });
    prisma.question.findFirst.mockResolvedValue({ orderIndex: 2 });
    prisma.question.create.mockResolvedValue({
      id: 'question-1',
        lessonId: 'lesson-1',
        text: createDto.text,
        explanation: createDto.explanation,
        type: QuestionType.SINGLE_CHOICE,
        orderIndex: 3,
        answers: [
          { id: 'answer-1', questionId: 'question-1', ...createDto.answers[0] },
          { id: 'answer-2', questionId: 'question-1', ...createDto.answers[1] },
      ],
    });

    const result = await service.create('lesson-1', createDto);

    expect(prisma.question.create).toHaveBeenCalledWith({
      data: {
        lessonId: 'lesson-1',
        text: createDto.text,
        explanation: createDto.explanation,
        type: QuestionType.SINGLE_CHOICE,
        orderIndex: 3,
        answers: {
          create: [
            { text: createDto.answers[0].text, isCorrect: true },
            { text: createDto.answers[1].text, isCorrect: false },
          ],
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
    expect(result.id).toBe('question-1');
  });

  it('Tạo question <2 answers -> UnprocessableEntityException', async () => {
    prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });

    await expect(
      service.create('lesson-1', {
        text: 'Câu hỏi sai',
        type: QuestionType.SINGLE_CHOICE,
        answers: [{ text: 'Chỉ 1 đáp án', isCorrect: true }],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    await expect(
      service.create('lesson-1', {
        text: 'Câu hỏi sai',
        type: QuestionType.SINGLE_CHOICE,
        answers: [{ text: 'Chỉ 1 đáp án', isCorrect: true }],
      }),
    ).rejects.toThrow('Mỗi câu hỏi phải có ít nhất 2 đáp án.');
  });

  it('Tạo question 0 correct answers -> UnprocessableEntityException', async () => {
    prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });

    await expect(
      service.create('lesson-1', {
        text: 'Câu hỏi sai',
        type: QuestionType.MULTIPLE_CHOICE,
        answers: [
          { text: 'Đáp án 1', isCorrect: false },
          { text: 'Đáp án 2', isCorrect: false },
        ],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    await expect(
      service.create('lesson-1', {
        text: 'Câu hỏi sai',
        type: QuestionType.MULTIPLE_CHOICE,
        answers: [
          { text: 'Đáp án 1', isCorrect: false },
          { text: 'Đáp án 2', isCorrect: false },
        ],
      }),
    ).rejects.toThrow('Mỗi câu hỏi phải có ít nhất 1 đáp án đúng.');
  });

  it('Update question thay thế answers thành công', async () => {
    prisma.question.findUnique.mockResolvedValue({
      id: 'question-1',
      lessonId: 'lesson-1',
      text: 'Old text',
      explanation: null,
      type: QuestionType.SINGLE_CHOICE,
      orderIndex: 1,
      answers: [{ id: 'old-answer', text: 'Old', isCorrect: true }],
    });

    const tx = {
      answer: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      question: {
        update: jest.fn().mockResolvedValue({
          id: 'question-1',
            lessonId: 'lesson-1',
            text: 'New text',
            explanation: 'Giải thích mới',
            type: QuestionType.SINGLE_CHOICE,
            orderIndex: 1,
            answers: [
              { id: 'answer-1', questionId: 'question-1', text: 'A', isCorrect: true },
            {
              id: 'answer-2',
              questionId: 'question-1',
              text: 'B',
              isCorrect: false,
            },
          ],
        }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => Promise<unknown>) =>
        callback(tx),
    );

    const result = await service.update('question-1', {
      text: 'New text',
      explanation: 'Giải thích mới',
      answers: [
        { text: 'A', isCorrect: true },
        { text: 'B', isCorrect: false },
      ],
    });

    expect(tx.answer.deleteMany).toHaveBeenCalledWith({
      where: { questionId: 'question-1' },
    });
    expect(tx.question.update).toHaveBeenCalledWith({
      where: { id: 'question-1' },
      data: {
        text: 'New text',
        explanation: 'Giải thích mới',
        answers: {
          create: [
            { text: 'A', isCorrect: true },
            { text: 'B', isCorrect: false },
          ],
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
    expect(result.text).toBe('New text');
  });

  it('Xóa question -> cascade xóa answers + submissions', async () => {
    prisma.question.findUnique.mockResolvedValue({
      id: 'question-1',
      lessonId: 'lesson-1',
      text: 'Delete me',
      explanation: null,
      type: QuestionType.SINGLE_CHOICE,
      orderIndex: 1,
      answers: [],
    });

    const tx = {
      submission: { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) },
      question: { delete: jest.fn().mockResolvedValue({ id: 'question-1' }) },
    };

    prisma.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => Promise<void>) =>
        callback(tx),
    );

    const result = await service.delete('question-1');

    expect(tx.submission.deleteMany).toHaveBeenCalledWith({
      where: { questionId: 'question-1' },
    });
    expect(tx.question.delete).toHaveBeenCalledWith({
      where: { id: 'question-1' },
    });
    expect(result).toEqual({ deleted: true, id: 'question-1' });
  });

  it('Reorder questions thành công', async () => {
    const questionIds = ['question-3', 'question-1', 'question-2'];
    prisma.question.findMany
      .mockResolvedValueOnce([
        { id: 'question-1' },
        { id: 'question-2' },
        { id: 'question-3' },
      ])
      .mockResolvedValueOnce([
        {
          id: 'question-3',
          lessonId: 'lesson-1',
          text: 'Q3',
          explanation: null,
          type: QuestionType.SINGLE_CHOICE,
          orderIndex: 1,
          answers: [],
        },
        {
          id: 'question-1',
          lessonId: 'lesson-1',
          text: 'Q1',
          explanation: null,
          type: QuestionType.SINGLE_CHOICE,
          orderIndex: 2,
          answers: [],
        },
        {
          id: 'question-2',
          lessonId: 'lesson-1',
          text: 'Q2',
          explanation: null,
          type: QuestionType.SINGLE_CHOICE,
          orderIndex: 3,
          answers: [],
        },
      ]);
    prisma.question.update.mockResolvedValue({});
    prisma.$transaction.mockResolvedValue([]);

    const result = await service.reorder('lesson-1', questionIds);

    expect(prisma.question.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'question-3' },
      data: { orderIndex: 1 },
    });
    expect(prisma.question.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'question-1' },
      data: { orderIndex: 2 },
    });
    expect(prisma.question.update).toHaveBeenNthCalledWith(3, {
      where: { id: 'question-2' },
      data: { orderIndex: 3 },
    });
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('question-3');
  });

  it('Tạo question ESSAY cho phép không có đáp án mẫu', async () => {
    prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });
    prisma.question.findFirst.mockResolvedValue(null);
    prisma.question.create.mockResolvedValue({
      id: 'question-essay-1',
      lessonId: 'lesson-1',
      text: 'Mô tả cách bạn xử lý tình huống này.',
      explanation: null,
      type: QuestionType.ESSAY,
      orderIndex: 1,
      answers: [],
    });

    await service.create('lesson-1', {
      text: 'Mô tả cách bạn xử lý tình huống này.',
      type: QuestionType.ESSAY,
      answers: [],
    });

    expect(prisma.question.create).toHaveBeenCalledWith({
      data: {
        lessonId: 'lesson-1',
        text: 'Mô tả cách bạn xử lý tình huống này.',
        type: QuestionType.ESSAY,
        orderIndex: 1,
        answers: {
          create: [],
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
  });
});
