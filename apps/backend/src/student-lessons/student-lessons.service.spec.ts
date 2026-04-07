import { QuestionType } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MinioService } from '../files/minio.service';
import { PrismaService } from '../prisma/prisma.service';
import { StudentLessonsService } from './student-lessons.service';

describe('StudentLessonsService', () => {
  let service: StudentLessonsService;
  let prisma: {
    lesson: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
    };
    lessonAttempt: {
      findFirst: jest.Mock;
    };
    lessonFile: {
      findFirst: jest.Mock;
    };
  };
  let minioService: {
    getPresignedUrl: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      lesson: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      lessonAttempt: {
        findFirst: jest.fn(),
      },
      lessonFile: {
        findFirst: jest.fn(),
      },
    };

    minioService = {
      getPresignedUrl: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        StudentLessonsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: MinioService,
          useValue: minioService,
        },
      ],
    }).compile();

    service = moduleRef.get(StudentLessonsService);
  });

  it('Lesson chưa có attempt -> isCompleted = false', async () => {
    prisma.lesson.findMany.mockResolvedValue([
      {
        id: 'lesson-1',
        title: 'Buồng phòng cơ bản',
        summary: 'Tổng quan quy trình dọn phòng',
        imageUrl: null,
        category: { id: 'cat-1', name: 'Buồng phòng' },
        _count: { questions: 5 },
        lessonAttempts: [],
      },
    ]);

    const result = await service.findAllForStudent('student-1');

    expect(result).toEqual([
      {
        id: 'lesson-1',
        title: 'Buồng phòng cơ bản',
        summary: 'Tổng quan quy trình dọn phòng',
        imageUrl: null,
        category: { id: 'cat-1', name: 'Buồng phòng' },
        _count: { questions: 5 },
        isCompleted: false,
      },
    ]);
  });

  it('Lesson có attempt_number = 1 -> isCompleted = true', async () => {
    prisma.lesson.findMany.mockResolvedValue([
      {
        id: 'lesson-2',
        title: 'Lễ tân nâng cao',
        summary: 'Tình huống thực tế tại quầy',
        imageUrl: 'https://example.com/img.png',
        category: { id: 'cat-2', name: 'Lễ tân' },
        _count: { questions: 3 },
        lessonAttempts: [{ id: 'attempt-1' }],
      },
    ]);

    const result = await service.findAllForStudent('student-1');

    expect(result[0].isCompleted).toBe(true);
  });

  it('Lesson có attempt_number = 2 nhưng không có attempt_number = 1 -> isCompleted = false', async () => {
    prisma.lesson.findMany.mockResolvedValue([
      {
        id: 'lesson-3',
        title: 'Ẩm thực dịch vụ',
        summary: 'Tiêu chuẩn phục vụ bàn',
        imageUrl: null,
        category: { id: 'cat-3', name: 'Ẩm thực' },
        _count: { questions: 4 },
        lessonAttempts: [],
      },
    ]);

    const result = await service.findAllForStudent('student-1');

    expect(prisma.lesson.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ isPrivate: false }, { studentAccesses: { some: { userId: 'student-1' } } }],
        },
        select: expect.objectContaining({
          lessonAttempts: expect.objectContaining({
            where: {
              userId: 'student-1',
              attemptNumber: 1,
            },
          }),
        }),
      }),
    );
    expect(result[0].isCompleted).toBe(false);
  });

  it('findDetail trả question type, imageUrl và vẫn ẩn đáp án essay/image essay + metadata chấm điểm', async () => {
    prisma.lesson.findFirst.mockResolvedValue({
      id: 'lesson-1',
      title: 'Buồng phòng cơ bản',
      summary: 'Tổng quan quy trình dọn phòng',
      contentMd: '# Nội dung',
      imageUrl: null,
      category: { id: 'cat-1', name: 'Buồng phòng' },
      files: [
        {
          fileName: 'lesson.docx',
          fileUrl: 'https://example.com/lesson.docx',
          uploadedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
      studentAccesses: [{ id: 'access-1' }],
      questions: [
        {
          id: 'question-1',
          type: QuestionType.SINGLE_CHOICE,
          text: 'Bước đầu tiên khi vào phòng là gì?',
          imageUrl: 'https://example.com/question-1.png',
          isPrivate: false,
          orderIndex: 1,
          explanation: 'Không nên lộ cho student trước khi nộp bài',
          answers: [
            {
              id: 'answer-1',
              text: 'Chào khách và xác nhận yêu cầu',
              isCorrect: true,
              explanation: 'Không nên lộ cho student trước khi nộp bài',
              matchText: null,
            },
          ],
        },
        {
          id: 'question-2',
          type: QuestionType.ESSAY,
          text: 'Mô tả quy trình xử lý khi khách báo thiếu khăn tắm.',
          imageUrl: null,
          isPrivate: false,
          orderIndex: 2,
          answers: [
            {
              id: 'answer-2',
              text: 'Bình tĩnh xin lỗi khách, xác nhận nhu cầu và phối hợp bổ sung khăn ngay.',
              isCorrect: true,
              explanation: 'Không nên lộ cho student trước khi nộp bài',
              matchText: null,
            },
          ],
        },
        {
          id: 'question-3',
          type: QuestionType.MATCHING,
          text: 'Ghép khái niệm với định nghĩa phù hợp.',
          imageUrl: null,
          isPrivate: false,
          orderIndex: 3,
          answers: [
            {
              id: 'answer-3-left-1',
              text: 'Zero Trust',
              isCorrect: true,
              explanation: 'Không nên lộ cho student trước khi nộp bài',
              matchText: 'Không tin cậy mặc định',
            },
            {
              id: 'answer-3-left-2',
              text: 'Least Privilege',
              isCorrect: true,
              explanation: 'Không nên lộ cho student trước khi nộp bài',
              matchText: 'Quyền tối thiểu',
            },
          ],
        },
        {
          id: 'question-4',
          type: QuestionType.IMAGE_ESSAY,
          text: 'Quan sát ảnh và mô tả quy trình an toàn thông tin.',
          imageUrl: 'https://example.com/question-4.png',
          isPrivate: false,
          orderIndex: 4,
          answers: [
            {
              id: 'answer-4',
              text: 'Mẫu đáp án tham khảo',
              isCorrect: true,
              explanation: 'Không nên lộ cho student trước khi nộp bài',
              matchText: null,
            },
          ],
        },
      ],
    } as unknown);
    prisma.lessonAttempt.findFirst.mockResolvedValue({ id: 'attempt-1' });

    const result = await service.findDetailForStudent('lesson-1', 'student-1');

    expect(prisma.lesson.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'lesson-1',
          OR: [{ isPrivate: false }, { studentAccesses: { some: { userId: 'student-1' } } }],
        },
        select: expect.objectContaining({
          studentAccesses: expect.objectContaining({
            where: { userId: 'student-1' },
          }),
        }),
      }),
    );
    expect(result.isCompleted).toBe(true);
    expect(result.questions).toEqual([
      {
        id: 'question-1',
        type: QuestionType.SINGLE_CHOICE,
        text: 'Bước đầu tiên khi vào phòng là gì?',
        imageUrl: 'https://example.com/question-1.png',
        orderIndex: 1,
        isLocked: false,
        answers: [
          {
            id: 'answer-1',
            text: 'Chào khách và xác nhận yêu cầu',
          },
        ],
      },
      {
        id: 'question-2',
        type: QuestionType.ESSAY,
        text: 'Mô tả quy trình xử lý khi khách báo thiếu khăn tắm.',
        imageUrl: null,
        orderIndex: 2,
        isLocked: false,
        answers: [],
      },
      {
        id: 'question-3',
        type: QuestionType.MATCHING,
        text: 'Ghép khái niệm với định nghĩa phù hợp.',
        imageUrl: null,
        orderIndex: 3,
        isLocked: false,
        answers: [
          {
            id: 'answer-3-left-1',
            text: 'Zero Trust',
          },
          {
            id: 'answer-3-left-2',
            text: 'Least Privilege',
          },
        ],
        matchingOptions: ['Không tin cậy mặc định', 'Quyền tối thiểu'],
      },
      {
        id: 'question-4',
        type: QuestionType.IMAGE_ESSAY,
        text: 'Quan sát ảnh và mô tả quy trình an toàn thông tin.',
        imageUrl: 'https://example.com/question-4.png',
        orderIndex: 4,
        isLocked: false,
        answers: [],
      },
    ]);
    expect('explanation' in result.questions[0]).toBe(false);
    expect('isCorrect' in result.questions[0].answers[0]).toBe(false);
  });

  it('findDetail khóa dữ liệu câu hỏi VIP khi student chưa có quyền truy cập', async () => {
    prisma.lesson.findFirst.mockResolvedValue({
      id: 'lesson-1',
      title: 'Buồng phòng cơ bản',
      summary: 'Tổng quan quy trình dọn phòng',
      contentMd: '# Nội dung',
      imageUrl: null,
      category: { id: 'cat-1', name: 'Buồng phòng' },
      files: [],
      studentAccesses: [],
      questions: [
        {
          id: 'question-public',
          type: QuestionType.SINGLE_CHOICE,
          text: 'Câu public',
          imageUrl: 'https://example.com/public.png',
          isPrivate: false,
          orderIndex: 1,
          answers: [
            {
              id: 'answer-public',
              text: 'Đáp án public',
              matchText: null,
            },
          ],
        },
        {
          id: 'question-private',
          type: QuestionType.SINGLE_CHOICE,
          text: 'Câu VIP',
          imageUrl: 'https://example.com/private.png',
          isPrivate: true,
          orderIndex: 2,
          answers: [
            {
              id: 'answer-private',
              text: 'Đáp án VIP',
              matchText: null,
            },
          ],
        },
      ],
    } as unknown);
    prisma.lessonAttempt.findFirst.mockResolvedValue(null);

    const result = await service.findDetailForStudent('lesson-1', 'student-1');

    expect(result.questions).toEqual([
      {
        id: 'question-public',
        type: QuestionType.SINGLE_CHOICE,
        text: 'Câu public',
        imageUrl: 'https://example.com/public.png',
        orderIndex: 1,
        isLocked: false,
        answers: [
          {
            id: 'answer-public',
            text: 'Đáp án public',
          },
        ],
      },
      {
        id: 'question-private',
        type: QuestionType.SINGLE_CHOICE,
        text: 'Câu VIP',
        imageUrl: null,
        orderIndex: 2,
        isLocked: true,
        answers: [],
      },
    ]);
  });

  it('getFileDownloadUrl trả signed url khi lesson và file tồn tại', async () => {
    prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });
    prisma.lessonFile.findFirst.mockResolvedValue({
      fileUrl: 'http://localhost:9000/lesson-files/folder%20name/lesson.docx',
    });
    minioService.getPresignedUrl.mockResolvedValue('https://signed-url');

    const result = await service.getFileDownloadUrl('lesson-1', 'file-1');

    expect(minioService.getPresignedUrl).toHaveBeenCalledWith(
      'lesson-files',
      'folder name/lesson.docx',
    );
    expect(result).toEqual({ downloadUrl: 'https://signed-url' });
  });

  it('getFileDownloadUrl lesson không tồn tại -> NotFoundException', async () => {
    prisma.lesson.findUnique.mockResolvedValue(null);

    await expect(service.getFileDownloadUrl('lesson-1', 'file-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getFileDownloadUrl file không tồn tại -> NotFoundException', async () => {
    prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });
    prisma.lessonFile.findFirst.mockResolvedValue(null);

    await expect(service.getFileDownloadUrl('lesson-1', 'file-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getFileDownloadUrl stored file URL invalid -> BadRequestException', async () => {
    prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });
    prisma.lessonFile.findFirst.mockResolvedValue({
      fileUrl: 'http://localhost:9000/invalid-bucket/lesson.docx',
    });

    await expect(service.getFileDownloadUrl('lesson-1', 'file-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
