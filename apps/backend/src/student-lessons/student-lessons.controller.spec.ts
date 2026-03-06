import { UnauthorizedException } from '@nestjs/common';
import { StudentLessonsController } from './student-lessons.controller';

describe('StudentLessonsController', () => {
  let controller: StudentLessonsController;
  let studentLessonsService: {
    findAllForStudent: jest.Mock;
    findDetailForStudent: jest.Mock;
    getFileDownloadUrl: jest.Mock;
  };

  beforeEach(() => {
    studentLessonsService = {
      findAllForStudent: jest.fn(),
      findDetailForStudent: jest.fn(),
      getFileDownloadUrl: jest.fn(),
    };
    controller = new StudentLessonsController(studentLessonsService as never);
  });

  it('findAllForStudent uses JWT userId', async () => {
    studentLessonsService.findAllForStudent.mockResolvedValue([{ id: 'lesson-1' }]);

    const result = await controller.findAllForStudent({ userId: 'student-1' });

    expect(studentLessonsService.findAllForStudent).toHaveBeenCalledWith('student-1');
    expect(result).toEqual([{ id: 'lesson-1' }]);
  });

  it('findDetailForStudent uses legacy id when userId is absent', async () => {
    studentLessonsService.findDetailForStudent.mockResolvedValue({ id: 'lesson-1' });

    const result = await controller.findDetailForStudent('lesson-1', { id: 'student-1' });

    expect(studentLessonsService.findDetailForStudent).toHaveBeenCalledWith(
      'lesson-1',
      'student-1',
    );
    expect(result).toEqual({ id: 'lesson-1' });
  });

  it('throws UnauthorizedException when no user id can be extracted', async () => {
    expect(() => controller.findAllForStudent(undefined)).toThrow(UnauthorizedException);
  });

  it('getFileDownloadUrl delegates to service', async () => {
    studentLessonsService.getFileDownloadUrl.mockResolvedValue({
      downloadUrl: 'https://signed-url',
    });

    const result = await controller.getFileDownloadUrl('lesson-1', 'file-1');

    expect(studentLessonsService.getFileDownloadUrl).toHaveBeenCalledWith(
      'lesson-1',
      'file-1',
    );
    expect(result).toEqual({ downloadUrl: 'https://signed-url' });
  });
});
