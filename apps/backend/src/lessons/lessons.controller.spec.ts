import { CreateLessonDto } from './dto/create-lesson.dto';
import { LessonsController } from './lessons.controller';
import { UpdateLessonDto } from './dto/update-lesson.dto';

describe('LessonsController', () => {
  let controller: LessonsController;
  let lessonsService: {
    findAll: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    getAccessList: jest.Mock;
    grantAccessByEmail: jest.Mock;
    revokeAccess: jest.Mock;
    uploadLessonFile: jest.Mock;
    deleteLessonFile: jest.Mock;
    getLessonFileDownloadUrl: jest.Mock;
  };

  beforeEach(() => {
    lessonsService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getAccessList: jest.fn(),
      grantAccessByEmail: jest.fn(),
      revokeAccess: jest.fn(),
      uploadLessonFile: jest.fn(),
      deleteLessonFile: jest.fn(),
      getLessonFileDownloadUrl: jest.fn(),
    };

    controller = new LessonsController(lessonsService as never);
  });

  it('findAll delegates to service', async () => {
    lessonsService.findAll.mockResolvedValue([{ id: 'lesson-1' }]);

    const result = await controller.findAll('cat-1');

    expect(lessonsService.findAll).toHaveBeenCalledWith('cat-1');
    expect(result).toEqual([{ id: 'lesson-1' }]);
  });

  it('findById delegates to service', async () => {
    lessonsService.findById.mockResolvedValue({ id: 'lesson-1' });

    const result = await controller.findById('lesson-1');

    expect(lessonsService.findById).toHaveBeenCalledWith('lesson-1');
    expect(result).toEqual({ id: 'lesson-1' });
  });

  it('create delegates dto and image file to service', async () => {
    const dto: CreateLessonDto = {
      title: 'Lesson title',
      summary: 'Lesson summary',
      contentMd: '# Content',
      categoryId: '7fda9331-f67b-47e9-bff2-4658f4fb2e41',
    };
    const file = { originalname: 'image.png' } as Express.Multer.File;
    lessonsService.create.mockResolvedValue({ id: 'lesson-1' });

    const result = await controller.create(dto, file);

    expect(lessonsService.create).toHaveBeenCalledWith(dto, file);
    expect(result).toEqual({ id: 'lesson-1' });
  });

  it('update delegates dto and image file to service', async () => {
    const dto: UpdateLessonDto = {
      title: 'Updated title',
    };
    const file = { originalname: 'new-image.png' } as Express.Multer.File;
    lessonsService.update.mockResolvedValue({ id: 'lesson-1', title: 'Updated title' });

    const result = await controller.update('lesson-1', dto, file);

    expect(lessonsService.update).toHaveBeenCalledWith('lesson-1', dto, file);
    expect(result).toEqual({ id: 'lesson-1', title: 'Updated title' });
  });

  it('delete delegates to service', async () => {
    lessonsService.delete.mockResolvedValue({ deleted: true, id: 'lesson-1' });

    const result = await controller.delete('lesson-1');

    expect(lessonsService.delete).toHaveBeenCalledWith('lesson-1');
    expect(result).toEqual({ deleted: true, id: 'lesson-1' });
  });

  it('getAccessList delegates to service', async () => {
    lessonsService.getAccessList.mockResolvedValue([{ id: 'access-1' }]);

    const result = await controller.getAccessList('lesson-1');

    expect(lessonsService.getAccessList).toHaveBeenCalledWith('lesson-1');
    expect(result).toEqual([{ id: 'access-1' }]);
  });

  it('grantAccessByEmail delegates to service', async () => {
    lessonsService.grantAccessByEmail.mockResolvedValue({ success: true });

    const result = await controller.grantAccessByEmail('lesson-1', {
      email: 'student@example.com',
    });

    expect(lessonsService.grantAccessByEmail).toHaveBeenCalledWith(
      'lesson-1',
      'student@example.com',
    );
    expect(result).toEqual({ success: true });
  });

  it('revokeAccess delegates to service', async () => {
    lessonsService.revokeAccess.mockResolvedValue({ success: true });

    const result = await controller.revokeAccess('lesson-1', 'student-1');

    expect(lessonsService.revokeAccess).toHaveBeenCalledWith('lesson-1', 'student-1');
    expect(result).toEqual({ success: true });
  });

  it('uploadLessonFile delegates to service', async () => {
    const file = { originalname: 'lesson.docx' } as Express.Multer.File;
    lessonsService.uploadLessonFile.mockResolvedValue({ id: 'file-1' });

    const result = await controller.uploadLessonFile('lesson-1', file);

    expect(lessonsService.uploadLessonFile).toHaveBeenCalledWith('lesson-1', file);
    expect(result).toEqual({ id: 'file-1' });
  });

  it('deleteLessonFile delegates to service', async () => {
    lessonsService.deleteLessonFile.mockResolvedValue({ deleted: true, id: 'file-1' });

    const result = await controller.deleteLessonFile('lesson-1', 'file-1');

    expect(lessonsService.deleteLessonFile).toHaveBeenCalledWith('lesson-1', 'file-1');
    expect(result).toEqual({ deleted: true, id: 'file-1' });
  });

  it('getLessonFileDownloadUrl delegates to service', async () => {
    lessonsService.getLessonFileDownloadUrl.mockResolvedValue({
      downloadUrl: 'https://signed-url',
    });

    const result = await controller.getLessonFileDownloadUrl('lesson-1', 'file-1');

    expect(lessonsService.getLessonFileDownloadUrl).toHaveBeenCalledWith(
      'lesson-1',
      'file-1',
    );
    expect(result).toEqual({ downloadUrl: 'https://signed-url' });
  });
});
