import { QuestionType } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { SubmissionsService } from './submissions.service';

type LessonQuestionFixture = {
  id: string;
  type: QuestionType;
  text: string;
  explanation: string | null;
  orderIndex: number;
  answers: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string | null;
    orderIndex: number | null;
    matchText: string | null;
  }[];
};

const createSingleChoiceQuestion = (
  index: number,
  correctAnswerId: string,
  wrongAnswerId: string,
): LessonQuestionFixture => ({
  id: `q-${index}`,
  type: QuestionType.SINGLE_CHOICE,
  text: `Question ${index}`,
  explanation: `Explanation ${index}`,
  orderIndex: index,
  answers: [
    {
      id: correctAnswerId,
      text: `Correct ${index}`,
      isCorrect: true,
      explanation: `Correct explanation ${index}`,
      orderIndex: null,
      matchText: null,
    },
    {
      id: wrongAnswerId,
      text: `Wrong ${index}`,
      isCorrect: false,
      explanation: `Wrong explanation ${index}`,
      orderIndex: null,
      matchText: null,
    },
  ],
});

const createMultipleChoiceQuestion = (index: number): LessonQuestionFixture => ({
  id: `q-${index}`,
  type: QuestionType.MULTIPLE_CHOICE,
  text: `Question ${index}`,
  explanation: `Explanation ${index}`,
  orderIndex: index,
  answers: [
    {
      id: `a-${index}-correct-1`,
      text: `Correct ${index}.1`,
      isCorrect: true,
      explanation: `Correct explanation ${index}.1`,
      orderIndex: null,
      matchText: null,
    },
    {
      id: `a-${index}-correct-2`,
      text: `Correct ${index}.2`,
      isCorrect: true,
      explanation: `Correct explanation ${index}.2`,
      orderIndex: null,
      matchText: null,
    },
    {
      id: `a-${index}-wrong`,
      text: `Wrong ${index}`,
      isCorrect: false,
      explanation: `Wrong explanation ${index}`,
      orderIndex: null,
      matchText: null,
    },
  ],
});

const createEssayQuestion = (index: number): LessonQuestionFixture => ({
  id: `q-${index}`,
  type: QuestionType.ESSAY,
  text: `Question ${index}`,
  explanation: `Explanation ${index}`,
  orderIndex: index,
  answers: [],
});

const createImageEssayQuestion = (index: number): LessonQuestionFixture => ({
  id: `q-${index}`,
  type: QuestionType.IMAGE_ESSAY,
  text: `Question ${index}`,
  explanation: `Explanation ${index}`,
  orderIndex: index,
  answers: [],
});

const createOrderingQuestion = (index: number): LessonQuestionFixture => ({
  id: `q-${index}`,
  type: QuestionType.ORDERING,
  text: `Question ${index}`,
  explanation: `Explanation ${index}`,
  orderIndex: index,
  answers: [
    {
      id: `a-${index}-step-1`,
      text: `Step ${index}.1`,
      isCorrect: true,
      explanation: null,
      orderIndex: 1,
      matchText: null,
    },
    {
      id: `a-${index}-step-2`,
      text: `Step ${index}.2`,
      isCorrect: true,
      explanation: null,
      orderIndex: 2,
      matchText: null,
    },
    {
      id: `a-${index}-step-3`,
      text: `Step ${index}.3`,
      isCorrect: true,
      explanation: null,
      orderIndex: 3,
      matchText: null,
    },
  ],
});

const createMatchingQuestion = (index: number): LessonQuestionFixture => ({
  id: `q-${index}`,
  type: QuestionType.MATCHING,
  text: `Question ${index}`,
  explanation: `Explanation ${index}`,
  orderIndex: index,
  answers: [
    {
      id: `a-${index}-left-1`,
      text: `Left ${index}.1`,
      isCorrect: true,
      explanation: null,
      orderIndex: null,
      matchText: `Right ${index}.1`,
    },
    {
      id: `a-${index}-left-2`,
      text: `Left ${index}.2`,
      isCorrect: true,
      explanation: null,
      orderIndex: null,
      matchText: `Right ${index}.2`,
    },
  ],
});

describe('SubmissionsService', () => {
  let service: SubmissionsService;
  let prisma: {
    lesson: {
      findUnique: jest.Mock;
    };
    lessonAttempt: {
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
    submission: {
      createMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const userId = 'student-1';
  const lessonId = 'lesson-1';

  beforeEach(async () => {
    prisma = {
      lesson: {
        findUnique: jest.fn(),
      },
      lessonAttempt: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      submission: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = moduleRef.get(SubmissionsService);
  });

  const setupTransactionMocks = () => {
    const tx = {
      lessonAttempt: {
        create: jest.fn().mockImplementation(async ({ data }) => ({
          id: `attempt-${data.attemptNumber}`,
          attemptNumber: data.attemptNumber,
          score: data.score,
          correctCount: data.correctCount,
        })),
      },
      submission: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    prisma.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => Promise<unknown>) =>
        callback(tx),
    );

    return tx;
  };

  it('Nộp bài thành công -> tạo attempt + submissions + tính điểm đúng', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: lessonId,
      questions: [
        createSingleChoiceQuestion(1, 'a-1-correct', 'a-1-wrong'),
        createSingleChoiceQuestion(2, 'a-2-correct', 'a-2-wrong'),
      ],
    });
    prisma.lessonAttempt.count.mockResolvedValue(0);
    const tx = setupTransactionMocks();

    const dto: SubmitQuizDto = {
      answers: [
        { questionId: 'q-1', answerIds: ['a-1-correct'] },
        { questionId: 'q-2', answerIds: ['a-2-wrong'] },
      ],
    };

    const result = await service.submitQuiz(userId, lessonId, dto);

    expect(tx.lessonAttempt.create).toHaveBeenCalledWith({
      data: {
        userId,
        lessonId,
        attemptNumber: 1,
        score: 50,
        correctCount: 1,
      },
    });
    expect(tx.submission.createMany).toHaveBeenCalledWith({
      data: [
        {
          attemptId: 'attempt-1',
          questionId: 'q-1',
          answerId: 'a-1-correct',
          orderIndex: null,
          matchText: null,
          isCorrect: true,
        },
        {
          attemptId: 'attempt-1',
          questionId: 'q-2',
          answerId: 'a-2-wrong',
          orderIndex: null,
          matchText: null,
          isCorrect: false,
        },
      ],
    });
    expect(result).toMatchObject({
      attemptId: 'attempt-1',
      attemptNumber: 1,
      totalQuestions: 2,
      correctCount: 1,
      score: 50,
    });
  });

  it('attempt_number tăng đúng (lần 1 = 1, lần 2 = 2...)', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: lessonId,
      questions: [createSingleChoiceQuestion(1, 'a-1-correct', 'a-1-wrong')],
    });
    prisma.lessonAttempt.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    setupTransactionMocks();

    const dto: SubmitQuizDto = {
      answers: [{ questionId: 'q-1', answerIds: ['a-1-correct'] }],
    };

    const firstAttempt = await service.submitQuiz(userId, lessonId, dto);
    const secondAttempt = await service.submitQuiz(userId, lessonId, dto);

    expect(firstAttempt.attemptNumber).toBe(1);
    expect(secondAttempt.attemptNumber).toBe(2);
  });

  it('Nộp thiếu câu -> 422', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: lessonId,
      questions: [
        createSingleChoiceQuestion(1, 'a-1-correct', 'a-1-wrong'),
        createSingleChoiceQuestion(2, 'a-2-correct', 'a-2-wrong'),
      ],
    });

    const submitPromise = service.submitQuiz(userId, lessonId, {
      answers: [{ questionId: 'q-1', answerIds: ['a-1-correct'] }],
    });

    await expect(submitPromise).rejects.toBeInstanceOf(UnprocessableEntityException);
    await expect(submitPromise).rejects.toThrow('Vui lòng trả lời tất cả câu hỏi.');
  });

  it('Nộp answerId không thuộc question -> 422', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: lessonId,
      questions: [createSingleChoiceQuestion(1, 'a-1-correct', 'a-1-wrong')],
    });

    const submitPromise = service.submitQuiz(userId, lessonId, {
      answers: [{ questionId: 'q-1', answerIds: ['a-2-correct'] }],
    });

    await expect(submitPromise).rejects.toBeInstanceOf(UnprocessableEntityException);
    await expect(submitPromise).rejects.toThrow(
      'Đáp án không thuộc câu hỏi tương ứng.',
    );
  });

  it('Response SAU nộp chứa explanation + isCorrect (BR-02)', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: lessonId,
      questions: [createSingleChoiceQuestion(1, 'a-1-correct', 'a-1-wrong')],
    });
    prisma.lessonAttempt.count.mockResolvedValue(0);
    setupTransactionMocks();

    const result = await service.submitQuiz(userId, lessonId, {
      answers: [{ questionId: 'q-1', answerIds: ['a-1-wrong'] }],
    });

    expect(result.questions[0]).toMatchObject({
      id: 'q-1',
      explanation: 'Explanation 1',
      selectedAnswerIds: ['a-1-wrong'],
      selectedAnswerId: 'a-1-wrong',
      isCorrect: false,
    });
    expect(result.questions[0].answers[0]).toMatchObject({
      id: 'a-1-correct',
      isCorrect: true,
      explanation: 'Correct explanation 1',
    });
  });

  it('ESSAY không lưu submissions và không tính vào totalQuestions/score', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: lessonId,
      questions: [
        createSingleChoiceQuestion(1, 'a-1-correct', 'a-1-wrong'),
        createEssayQuestion(2),
      ],
    });
    prisma.lessonAttempt.count.mockResolvedValue(0);
    const tx = setupTransactionMocks();

    const result = await service.submitQuiz(userId, lessonId, {
      answers: [
        { questionId: 'q-1', answerIds: ['a-1-correct'] },
        { questionId: 'q-2', answerIds: [] },
      ],
    });

    expect(tx.submission.createMany).toHaveBeenCalledWith({
      data: [
        {
          attemptId: 'attempt-1',
          questionId: 'q-1',
          answerId: 'a-1-correct',
          orderIndex: null,
          matchText: null,
          isCorrect: true,
        },
      ],
    });
    expect(result.totalQuestions).toBe(1);
    expect(result.correctCount).toBe(1);
    expect(result.score).toBe(100);
    expect(result.questions).toHaveLength(2);
    expect(result.questions[1]).toMatchObject({
      id: 'q-2',
      type: QuestionType.ESSAY,
      selectedAnswerIds: [],
      selectedAnswerId: null,
      isCorrect: false,
    });
  });

  it('IMAGE_ESSAY không lưu submissions và không tính vào totalQuestions/score', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: lessonId,
      questions: [
        createSingleChoiceQuestion(1, 'a-1-correct', 'a-1-wrong'),
        createImageEssayQuestion(2),
      ],
    });
    prisma.lessonAttempt.count.mockResolvedValue(0);
    const tx = setupTransactionMocks();

    const result = await service.submitQuiz(userId, lessonId, {
      answers: [
        { questionId: 'q-1', answerIds: ['a-1-correct'] },
        { questionId: 'q-2', answerIds: [] },
      ],
    });

    expect(tx.submission.createMany).toHaveBeenCalledWith({
      data: [
        {
          attemptId: 'attempt-1',
          questionId: 'q-1',
          answerId: 'a-1-correct',
          orderIndex: null,
          matchText: null,
          isCorrect: true,
        },
      ],
    });
    expect(result.totalQuestions).toBe(1);
    expect(result.correctCount).toBe(1);
    expect(result.score).toBe(100);
    expect(result.questions).toHaveLength(2);
    expect(result.questions[1]).toMatchObject({
      id: 'q-2',
      type: QuestionType.IMAGE_ESSAY,
      selectedAnswerIds: [],
      selectedAnswerId: null,
      isCorrect: false,
    });
  });

  it('MULTIPLE_CHOICE partial khi chỉ chọn đúng một phần và không chọn sai', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: lessonId,
      questions: [createMultipleChoiceQuestion(1)],
    });
    prisma.lessonAttempt.count.mockResolvedValue(0);
    const tx = setupTransactionMocks();

    const result = await service.submitQuiz(userId, lessonId, {
      answers: [{ questionId: 'q-1', answerIds: ['a-1-correct-1'] }],
    });

    expect(tx.lessonAttempt.create).toHaveBeenCalledWith({
      data: {
        userId,
        lessonId,
        attemptNumber: 1,
        score: 50,
        correctCount: 0.5,
      },
    });
    expect(tx.submission.createMany).toHaveBeenCalledWith({
      data: [
        {
          attemptId: 'attempt-1',
          questionId: 'q-1',
          answerId: 'a-1-correct-1',
          orderIndex: null,
          matchText: null,
          isCorrect: false,
        },
      ],
    });
    expect(result.totalQuestions).toBe(1);
    expect(result.correctCount).toBeCloseTo(0.5);
    expect(result.score).toBe(50);
    expect(result.questions[0]).toMatchObject({
      id: 'q-1',
      selectedAnswerIds: ['a-1-correct-1'],
      isCorrect: false,
    });
  });

  it('MULTIPLE_CHOICE chọn lẫn đáp án sai -> 0 điểm cho cả câu', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: lessonId,
      questions: [createMultipleChoiceQuestion(1)],
    });
    prisma.lessonAttempt.count.mockResolvedValue(0);
    const tx = setupTransactionMocks();

    const result = await service.submitQuiz(userId, lessonId, {
      answers: [
        {
          questionId: 'q-1',
          answerIds: ['a-1-correct-1', 'a-1-wrong'],
        },
      ],
    });

    expect(tx.submission.createMany).toHaveBeenCalledWith({
      data: [
        {
          attemptId: 'attempt-1',
          questionId: 'q-1',
          answerId: 'a-1-correct-1',
          orderIndex: null,
          matchText: null,
          isCorrect: false,
        },
        {
          attemptId: 'attempt-1',
          questionId: 'q-1',
          answerId: 'a-1-wrong',
          orderIndex: null,
          matchText: null,
          isCorrect: false,
        },
      ],
    });
    expect(result.correctCount).toBe(0);
    expect(result.score).toBe(0);
    expect(result.questions[0].isCorrect).toBe(false);
  });

  it('MULTIPLE_CHOICE full correct -> 1 điểm', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: lessonId,
      questions: [createMultipleChoiceQuestion(1)],
    });
    prisma.lessonAttempt.count.mockResolvedValue(0);
    const tx = setupTransactionMocks();

    const result = await service.submitQuiz(userId, lessonId, {
      answers: [
        {
          questionId: 'q-1',
          answerIds: ['a-1-correct-1', 'a-1-correct-2'],
        },
      ],
    });

    expect(tx.submission.createMany).toHaveBeenCalledWith({
      data: [
        {
          attemptId: 'attempt-1',
          questionId: 'q-1',
          answerId: 'a-1-correct-1',
          orderIndex: null,
          matchText: null,
          isCorrect: true,
        },
        {
          attemptId: 'attempt-1',
          questionId: 'q-1',
          answerId: 'a-1-correct-2',
          orderIndex: null,
          matchText: null,
          isCorrect: true,
        },
      ],
    });
    expect(result.correctCount).toBe(1);
    expect(result.score).toBe(100);
    expect(result.questions[0]).toMatchObject({
      id: 'q-1',
      selectedAnswerIds: ['a-1-correct-1', 'a-1-correct-2'],
      isCorrect: true,
    });
  });

  it('ORDERING đúng thứ tự -> 1 điểm và lưu orderIndex', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: lessonId,
      questions: [createOrderingQuestion(1)],
    });
    prisma.lessonAttempt.count.mockResolvedValue(0);
    const tx = setupTransactionMocks();

    const result = await service.submitQuiz(userId, lessonId, {
      answers: [
        {
          questionId: 'q-1',
          answerIds: ['a-1-step-1', 'a-1-step-2', 'a-1-step-3'],
        },
      ],
    });

    expect(tx.lessonAttempt.create).toHaveBeenCalledWith({
      data: {
        userId,
        lessonId,
        attemptNumber: 1,
        score: 100,
        correctCount: 1,
      },
    });
    expect(tx.submission.createMany).toHaveBeenCalledWith({
      data: [
        {
          attemptId: 'attempt-1',
          questionId: 'q-1',
          answerId: 'a-1-step-1',
          orderIndex: 0,
          matchText: null,
          isCorrect: true,
        },
        {
          attemptId: 'attempt-1',
          questionId: 'q-1',
          answerId: 'a-1-step-2',
          orderIndex: 1,
          matchText: null,
          isCorrect: true,
        },
        {
          attemptId: 'attempt-1',
          questionId: 'q-1',
          answerId: 'a-1-step-3',
          orderIndex: 2,
          matchText: null,
          isCorrect: true,
        },
      ],
    });
    expect(result.correctCount).toBe(1);
    expect(result.score).toBe(100);
    expect(result.questions[0]).toMatchObject({
      id: 'q-1',
      selectedAnswerIds: ['a-1-step-1', 'a-1-step-2', 'a-1-step-3'],
      isCorrect: true,
    });
  });

  it('ORDERING sai thứ tự -> 0 điểm', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: lessonId,
      questions: [createOrderingQuestion(1)],
    });
    prisma.lessonAttempt.count.mockResolvedValue(0);
    setupTransactionMocks();

    const result = await service.submitQuiz(userId, lessonId, {
      answers: [
        {
          questionId: 'q-1',
          answerIds: ['a-1-step-2', 'a-1-step-1', 'a-1-step-3'],
        },
      ],
    });

    expect(result.correctCount).toBe(0);
    expect(result.score).toBe(0);
    expect(result.questions[0]).toMatchObject({
      id: 'q-1',
      selectedAnswerIds: ['a-1-step-2', 'a-1-step-1', 'a-1-step-3'],
      isCorrect: false,
    });
  });

  it('ORDERING thiếu đáp án -> 422', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: lessonId,
      questions: [createOrderingQuestion(1)],
    });

    await expect(
      service.submitQuiz(userId, lessonId, {
        answers: [
          {
            questionId: 'q-1',
            answerIds: ['a-1-step-1', 'a-1-step-2'],
          },
        ],
      }),
    ).rejects.toThrow('Câu hỏi sắp xếp phải gửi đủ tất cả đáp án theo thứ tự.');
  });

  it('MATCHING partial scoring và lưu matchText', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: lessonId,
      questions: [createMatchingQuestion(1)],
    });
    prisma.lessonAttempt.count.mockResolvedValue(0);
    const tx = setupTransactionMocks();

    const result = await service.submitQuiz(userId, lessonId, {
      answers: [
        {
          questionId: 'q-1',
          answerIds: [],
          matches: [
            { answerId: 'a-1-left-1', matchText: 'Right 1.1' },
            { answerId: 'a-1-left-2', matchText: 'Wrong pair' },
          ],
        },
      ],
    });

    expect(tx.submission.createMany).toHaveBeenCalledWith({
      data: [
        {
          attemptId: 'attempt-1',
          questionId: 'q-1',
          answerId: 'a-1-left-1',
          orderIndex: null,
          matchText: 'Right 1.1',
          isCorrect: false,
        },
        {
          attemptId: 'attempt-1',
          questionId: 'q-1',
          answerId: 'a-1-left-2',
          orderIndex: null,
          matchText: 'Wrong pair',
          isCorrect: false,
        },
      ],
    });
    expect(result.correctCount).toBeCloseTo(0.5);
    expect(result.score).toBe(50);
    expect(result.questions[0]).toMatchObject({
      id: 'q-1',
      selectedAnswerIds: ['a-1-left-1', 'a-1-left-2'],
      isCorrect: false,
    });
  });

  it('MATCHING thiếu cặp ghép -> 422', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: lessonId,
      questions: [createMatchingQuestion(1)],
    });

    await expect(
      service.submitQuiz(userId, lessonId, {
        answers: [
          {
            questionId: 'q-1',
            answerIds: [],
            matches: [{ answerId: 'a-1-left-1', matchText: 'Right 1.1' }],
          },
        ],
      }),
    ).rejects.toThrow('Câu hỏi ghép đôi phải gửi đầy đủ các cặp ghép.');
  });

  it('Nộp trùng questionId -> 422', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: lessonId,
      questions: [createSingleChoiceQuestion(1, 'a-1-correct', 'a-1-wrong')],
    });

    await expect(
      service.submitQuiz(userId, lessonId, {
        answers: [
          { questionId: 'q-1', answerIds: ['a-1-correct'] },
          { questionId: 'q-1', answerIds: ['a-1-wrong'] },
        ],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('getAttemptHistory trả danh sách theo attemptNumber desc', async () => {
    prisma.lessonAttempt.findMany.mockResolvedValue([
      {
        id: 'attempt-2',
        attemptNumber: 2,
        score: 80,
        correctCount: 4.5,
        submittedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);

    const result = await service.getAttemptHistory(userId, lessonId);

    expect(prisma.lessonAttempt.findMany).toHaveBeenCalledWith({
      where: {
        userId,
        lessonId,
      },
      select: {
        id: true,
        attemptNumber: true,
        score: true,
        correctCount: true,
        submittedAt: true,
      },
      orderBy: {
        attemptNumber: 'desc',
      },
    });
    expect(result).toHaveLength(1);
  });

  it('getAttemptDetail không tìm thấy -> NotFoundException', async () => {
    prisma.lessonAttempt.findFirst.mockResolvedValue(null);

    await expect(
      service.getAttemptDetail(userId, lessonId, 'missing-attempt'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getAttemptDetail fallback tính partial correctCount/score và bỏ qua ESSAY', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: lessonId,
      questions: [createMultipleChoiceQuestion(1), createEssayQuestion(2)],
    });
    prisma.lessonAttempt.findFirst.mockResolvedValue({
      id: 'attempt-1',
      attemptNumber: 1,
      score: null,
      correctCount: null,
      submissions: [
        {
          questionId: 'q-1',
          answerId: 'a-1-correct-1',
          orderIndex: null,
          matchText: null,
        },
      ],
    });

    const result = await service.getAttemptDetail(userId, lessonId, 'attempt-1');

    expect(result.totalQuestions).toBe(1);
    expect(result.correctCount).toBeCloseTo(0.5);
    expect(result.score).toBe(50);
    expect(result.questions[0]).toMatchObject({
      id: 'q-1',
      selectedAnswerIds: ['a-1-correct-1'],
      isCorrect: false,
    });
    expect(result.questions[1]).toMatchObject({
      id: 'q-2',
      selectedAnswerIds: [],
      selectedAnswerId: null,
      isCorrect: false,
    });
  });

  it('getLatestAttempt trả null khi chưa có attempt', async () => {
    prisma.lessonAttempt.findFirst.mockResolvedValue(null);

    const result = await service.getLatestAttempt(userId, lessonId);

    expect(result).toBeNull();
  });

  it('getLatestAttempt trả chi tiết lần nộp mới nhất', async () => {
    prisma.lessonAttempt.findFirst.mockResolvedValue({ id: 'attempt-2' });
    const detailSpy = jest
      .spyOn(service, 'getAttemptDetail')
      .mockResolvedValue({ attemptId: 'attempt-2' } as never);

    const result = await service.getLatestAttempt(userId, lessonId);

    expect(detailSpy).toHaveBeenCalledWith(userId, lessonId, 'attempt-2');
    expect(result).toEqual({ attemptId: 'attempt-2' });
  });
});
