import { NotFoundException } from '@nestjs/common';
import {
  QuestionsController,
  QuestionsUploadController,
} from './questions.controller';

describe('QuestionsController', () => {
  let controller: QuestionsController;
  let uploadController: QuestionsUploadController;
  let questionsService: {
    findAllByLesson: jest.Mock;
    findById: jest.Mock;
    create: jest.Mock;
    reorder: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    uploadQuestionImage: jest.Mock;
  };

  beforeEach(() => {
    questionsService = {
      findAllByLesson: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      reorder: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      uploadQuestionImage: jest.fn(),
    };
    controller = new QuestionsController(questionsService as never);
    uploadController = new QuestionsUploadController(questionsService as never);
  });

  it('findAllByLesson delegates to service', async () => {
    questionsService.findAllByLesson.mockResolvedValue([{ id: 'q-1' }]);

    const result = await controller.findAllByLesson('lesson-1');

    expect(questionsService.findAllByLesson).toHaveBeenCalledWith('lesson-1');
    expect(result).toEqual([{ id: 'q-1' }]);
  });

  it('findById throws NotFound when question does not belong to lesson', async () => {
    questionsService.findById.mockResolvedValue({
      id: 'q-1',
      lessonId: 'lesson-2',
      answers: [],
    });

    await expect(controller.findById('lesson-1', 'q-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('findById returns question in lesson', async () => {
    questionsService.findById.mockResolvedValue({
      id: 'q-1',
      lessonId: 'lesson-1',
      answers: [],
    });

    const result = await controller.findById('lesson-1', 'q-1');

    expect(questionsService.findById).toHaveBeenCalledWith('q-1');
    expect(result).toEqual({
      id: 'q-1',
      lessonId: 'lesson-1',
      answers: [],
    });
  });

  it('create delegates to service', async () => {
    const dto = {
      text: 'Question',
      answers: [
        { text: 'A', isCorrect: true },
        { text: 'B', isCorrect: false },
      ],
    };
    questionsService.create.mockResolvedValue({ id: 'q-1' });

    const result = await controller.create('lesson-1', dto);

    expect(questionsService.create).toHaveBeenCalledWith('lesson-1', dto);
    expect(result).toEqual({ id: 'q-1' });
  });

  it('reorder delegates to service', async () => {
    questionsService.reorder.mockResolvedValue([{ id: 'q-2', orderIndex: 1 }]);

    const result = await controller.reorder('lesson-1', { questionIds: ['q-2'] });

    expect(questionsService.reorder).toHaveBeenCalledWith('lesson-1', ['q-2']);
    expect(result).toEqual([{ id: 'q-2', orderIndex: 1 }]);
  });

  it('update delegates to service after lesson check', async () => {
    questionsService.findById.mockResolvedValue({
      id: 'q-1',
      lessonId: 'lesson-1',
      answers: [],
    });
    questionsService.update.mockResolvedValue({ id: 'q-1', text: 'Updated' });

    const result = await controller.update('lesson-1', 'q-1', { text: 'Updated' });

    expect(questionsService.findById).toHaveBeenCalledWith('q-1');
    expect(questionsService.update).toHaveBeenCalledWith('q-1', { text: 'Updated' });
    expect(result).toEqual({ id: 'q-1', text: 'Updated' });
  });

  it('delete delegates to service after lesson check', async () => {
    questionsService.findById.mockResolvedValue({
      id: 'q-1',
      lessonId: 'lesson-1',
      answers: [],
    });
    questionsService.delete.mockResolvedValue({ deleted: true, id: 'q-1' });

    const result = await controller.delete('lesson-1', 'q-1');

    expect(questionsService.findById).toHaveBeenCalledWith('q-1');
    expect(questionsService.delete).toHaveBeenCalledWith('q-1');
    expect(result).toEqual({ deleted: true, id: 'q-1' });
  });

  it('uploadImage delegates to service', async () => {
    const imageFile = {
      originalname: 'question.png',
      mimetype: 'image/png',
      size: 1024,
      buffer: Buffer.from('test-buffer'),
    } as Express.Multer.File;

    questionsService.uploadQuestionImage.mockResolvedValue({
      imageUrl: 'http://localhost:9000/lesson-images/questions/question.png',
    });

    const result = await uploadController.uploadImage(imageFile);

    expect(questionsService.uploadQuestionImage).toHaveBeenCalledWith(imageFile);
    expect(result).toEqual({
      imageUrl: 'http://localhost:9000/lesson-images/questions/question.png',
    });
  });
});
