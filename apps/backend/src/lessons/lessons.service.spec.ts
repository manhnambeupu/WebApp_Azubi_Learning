import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MinioService } from '../files/minio.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { LessonsService } from './lessons.service';

describe('LessonsService', () => {
  let service: LessonsService;
  let prisma: {
    lesson: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    lessonFile: {
      create: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
    };
    submission: {
      deleteMany: jest.Mock;
    };
    lessonAttempt: {
      deleteMany: jest.Mock;
    };
    answer: {
      deleteMany: jest.Mock;
    };
    question: {
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let minioService: {
    uploadFile: jest.Mock;
    deleteFile: jest.Mock;
    getPresignedUrl: jest.Mock;
  };

  const baseDto: CreateLessonDto = {
    title: 'Bài học mẫu',
    summary: 'Tóm tắt bài học',
    contentMd: '# Nội dung',
    categoryId: '7fda9331-f67b-47e9-bff2-4658f4fb2e41',
  };

  beforeEach(async () => {
    prisma = {
      lesson: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      lessonFile: {
        create: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      submission: {
        deleteMany: jest.fn(),
      },
      lessonAttempt: {
        deleteMany: jest.fn(),
      },
      answer: {
        deleteMany: jest.fn(),
      },
      question: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    minioService = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      getPresignedUrl: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
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

    service = moduleRef.get(LessonsService);
  });

  it('Tạo lesson thành công', async () => {
    prisma.lesson.create.mockResolvedValue({
      id: 'lesson-1',
      ...baseDto,
      imageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: baseDto.categoryId,
        name: 'Ẩm thực',
      },
      _count: {
        questions: 0,
        files: 0,
      },
    });

    const result = await service.create(baseDto);

    expect(prisma.lesson.create).toHaveBeenCalledWith({
      data: {
        title: baseDto.title,
        summary: baseDto.summary,
        contentMd: baseDto.contentMd,
        categoryId: baseDto.categoryId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            questions: true,
            files: true,
          },
        },
      },
    });
    expect(result.id).toBe('lesson-1');
  });

  it('Xóa lesson cascade hoạt động', async () => {
    prisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-1',
      imageUrl: 'http://localhost:9000/lesson-images/image-1.png',
      files: [
        {
          id: 'file-1',
          lessonId: 'lesson-1',
          fileName: 'lesson.docx',
          fileUrl: 'http://localhost:9000/lesson-files/doc-1.docx',
          uploadedAt: new Date(),
        },
      ],
    });

    const tx = {
      submission: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      lessonAttempt: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      lessonFile: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      answer: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      question: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      lesson: { delete: jest.fn().mockResolvedValue({ id: 'lesson-1' }) },
    };

    prisma.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => Promise<void>) =>
        callback(tx),
    );

    const result = await service.delete('lesson-1');

    expect(minioService.deleteFile).toHaveBeenCalledWith(
      'lesson-images',
      'image-1.png',
    );
    expect(minioService.deleteFile).toHaveBeenCalledWith(
      'lesson-files',
      'doc-1.docx',
    );
    expect(tx.submission.deleteMany).toHaveBeenCalledTimes(2);
    expect(tx.lessonAttempt.deleteMany).toHaveBeenCalledWith({
      where: { lessonId: 'lesson-1' },
    });
    expect(tx.lessonFile.deleteMany).toHaveBeenCalledWith({
      where: { lessonId: 'lesson-1' },
    });
    expect(tx.question.deleteMany).toHaveBeenCalledWith({
      where: { lessonId: 'lesson-1' },
    });
    expect(tx.lesson.delete).toHaveBeenCalledWith({
      where: { id: 'lesson-1' },
    });
    expect(result).toEqual({ deleted: true, id: 'lesson-1' });
  });

  it('Upload ảnh vượt 5MB -> reject', async () => {
    const oversizedImage = {
      originalname: 'too-big.png',
      mimetype: 'image/png',
      size: 5 * 1024 * 1024 + 1,
      buffer: Buffer.alloc(10),
    } as Express.Multer.File;

    await expect(service.create(baseDto, oversizedImage)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.lesson.create).not.toHaveBeenCalled();
  });

  it('Upload file không phải .docx -> reject', async () => {
    const invalidFile = {
      originalname: 'lesson.pdf',
      mimetype: 'application/pdf',
      size: 1_024,
      buffer: Buffer.alloc(10),
    } as Express.Multer.File;

    await expect(
      service.uploadLessonFile('lesson-1', invalidFile),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.lesson.findUnique).not.toHaveBeenCalled();
  });

  it('Upload ảnh sai định dạng mime -> reject', async () => {
    const invalidImage = {
      originalname: 'wrong.gif',
      mimetype: 'image/gif',
      size: 1_024,
      buffer: Buffer.alloc(10),
    } as Express.Multer.File;

    await expect(service.create(baseDto, invalidImage)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('update lesson không tồn tại -> NotFoundException', async () => {
    prisma.lesson.findUnique.mockResolvedValue(null);

    await expect(service.update('missing-lesson', { title: 'Updated' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update lesson có ảnh mới -> xóa ảnh cũ rồi upload ảnh mới', async () => {
    const imageFile = {
      originalname: 'new-image.png',
      mimetype: 'image/png',
      size: 10_000,
      buffer: Buffer.from('new-image'),
    } as Express.Multer.File;
    prisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-1',
      imageUrl: 'http://localhost:9000/lesson-images/old-image.png',
    });
    minioService.uploadFile.mockResolvedValue('http://localhost:9000/lesson-images/new-image.png');
    prisma.lesson.update.mockResolvedValue({ id: 'lesson-1', title: 'Updated' });

    await service.update('lesson-1', { title: 'Updated' }, imageFile);

    expect(minioService.deleteFile).toHaveBeenCalledWith('lesson-images', 'old-image.png');
    expect(minioService.uploadFile).toHaveBeenCalledWith(
      'lesson-images',
      expect.stringContaining('new-image.png'),
      imageFile.buffer,
      imageFile.mimetype,
    );
    expect(prisma.lesson.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lesson-1' },
        data: expect.objectContaining({
          title: 'Updated',
          imageUrl: 'http://localhost:9000/lesson-images/new-image.png',
        }),
      }),
    );
  });

  it('uploadLessonFile quá 20MB -> reject', async () => {
    const oversizedDocx = {
      originalname: 'lesson.docx',
      mimetype:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 20 * 1024 * 1024 + 1,
      buffer: Buffer.alloc(10),
    } as Express.Multer.File;

    await expect(service.uploadLessonFile('lesson-1', oversizedDocx)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('uploadLessonFile lesson không tồn tại -> NotFoundException', async () => {
    const docx = {
      originalname: 'lesson.docx',
      mimetype:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 1000,
      buffer: Buffer.from('docx'),
    } as Express.Multer.File;
    prisma.lesson.findUnique.mockResolvedValue(null);

    await expect(service.uploadLessonFile('lesson-1', docx)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('uploadLessonFile thành công', async () => {
    const docx = {
      originalname: 'lesson.docx',
      mimetype:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 1000,
      buffer: Buffer.from('docx'),
    } as Express.Multer.File;
    prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });
    minioService.uploadFile.mockResolvedValue('http://localhost:9000/lesson-files/file.docx');
    prisma.lessonFile.create.mockResolvedValue({
      id: 'file-1',
      lessonId: 'lesson-1',
      fileName: 'lesson.docx',
      fileUrl: 'http://localhost:9000/lesson-files/file.docx',
    });

    const result = await service.uploadLessonFile('lesson-1', docx);

    expect(result).toEqual(
      expect.objectContaining({
        id: 'file-1',
        lessonId: 'lesson-1',
      }),
    );
  });

  it('deleteLessonFile không tồn tại -> NotFoundException', async () => {
    prisma.lessonFile.findFirst.mockResolvedValue(null);

    await expect(service.deleteLessonFile('lesson-1', 'file-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getLessonFileDownloadUrl không tồn tại -> NotFoundException', async () => {
    prisma.lessonFile.findFirst.mockResolvedValue(null);

    await expect(
      service.getLessonFileDownloadUrl('lesson-1', 'file-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getLessonFileDownloadUrl thành công', async () => {
    prisma.lessonFile.findFirst.mockResolvedValue({
      id: 'file-1',
      lessonId: 'lesson-1',
      fileUrl: 'http://localhost:9000/lesson-files/folder%20name/lesson.docx',
    });
    minioService.getPresignedUrl.mockResolvedValue('https://signed-url');

    const result = await service.getLessonFileDownloadUrl('lesson-1', 'file-1');

    expect(minioService.getPresignedUrl).toHaveBeenCalledWith(
      'lesson-files',
      'folder name/lesson.docx',
    );
    expect(result).toEqual({ downloadUrl: 'https://signed-url' });
  });

  it('getLessonFileDownloadUrl với URL lưu sai bucket -> BadRequestException', async () => {
    prisma.lessonFile.findFirst.mockResolvedValue({
      id: 'file-1',
      lessonId: 'lesson-1',
      fileUrl: 'http://localhost:9000/wrong-bucket/lesson.docx',
    });

    await expect(
      service.getLessonFileDownloadUrl('lesson-1', 'file-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
