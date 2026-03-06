import { UnauthorizedException } from '@nestjs/common';
import { SubmissionsController } from './submissions.controller';

describe('SubmissionsController', () => {
  let controller: SubmissionsController;
  let submissionsService: {
    submitQuiz: jest.Mock;
    getAttemptHistory: jest.Mock;
    getLatestAttempt: jest.Mock;
    getAttemptDetail: jest.Mock;
  };

  beforeEach(() => {
    submissionsService = {
      submitQuiz: jest.fn(),
      getAttemptHistory: jest.fn(),
      getLatestAttempt: jest.fn(),
      getAttemptDetail: jest.fn(),
    };
    controller = new SubmissionsController(submissionsService as never);
  });

  it('submitQuiz delegates to service', async () => {
    submissionsService.submitQuiz.mockResolvedValue({ attemptId: 'attempt-1' });
    const dto = {
      answers: [{ questionId: 'q-1', answerId: 'a-1' }],
    };

    const result = await controller.submitQuiz('lesson-1', { userId: 'student-1' }, dto);

    expect(submissionsService.submitQuiz).toHaveBeenCalledWith(
      'student-1',
      'lesson-1',
      dto,
    );
    expect(result).toEqual({ attemptId: 'attempt-1' });
  });

  it('getAttemptHistory delegates to service', async () => {
    submissionsService.getAttemptHistory.mockResolvedValue([{ id: 'attempt-1' }]);

    const result = await controller.getAttemptHistory('lesson-1', { userId: 'student-1' });

    expect(submissionsService.getAttemptHistory).toHaveBeenCalledWith(
      'student-1',
      'lesson-1',
    );
    expect(result).toEqual([{ id: 'attempt-1' }]);
  });

  it('getLatestAttempt supports legacy id payload', async () => {
    submissionsService.getLatestAttempt.mockResolvedValue({ id: 'attempt-2' });

    const result = await controller.getLatestAttempt('lesson-1', { id: 'student-1' });

    expect(submissionsService.getLatestAttempt).toHaveBeenCalledWith(
      'student-1',
      'lesson-1',
    );
    expect(result).toEqual({ id: 'attempt-2' });
  });

  it('getAttemptDetail delegates to service', async () => {
    submissionsService.getAttemptDetail.mockResolvedValue({ id: 'attempt-1' });

    const result = await controller.getAttemptDetail('lesson-1', 'attempt-1', {
      userId: 'student-1',
    });

    expect(submissionsService.getAttemptDetail).toHaveBeenCalledWith(
      'student-1',
      'lesson-1',
      'attempt-1',
    );
    expect(result).toEqual({ id: 'attempt-1' });
  });

  it('throws UnauthorizedException when user id cannot be extracted', async () => {
    expect(() =>
      controller.getAttemptHistory('lesson-1', { username: 'missing-id' }),
    ).toThrow(UnauthorizedException);
  });
});
