import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: {
    category: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get(CategoriesService);
  });

  it('Tạo category thành công', async () => {
    const dto: CreateCategoryDto = { name: 'Ẩm thực' };
    prisma.category.findUnique.mockResolvedValue(null);
    prisma.category.create.mockResolvedValue({
      id: 'cat-1',
      name: dto.name,
    });

    const result = await service.create(dto);

    expect(result).toEqual({
      id: 'cat-1',
      name: dto.name,
      lessonCount: 0,
    });
  });

  it('Tạo category name trùng -> ConflictException', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 'existing-cat' });

    await expect(service.create({ name: 'Lễ tân' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('Xóa category có lessons -> ConflictException (BR-06)', async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: 'cat-with-lessons',
      name: 'Buồng phòng',
      _count: { lessons: 2 },
    });

    const deletePromise = service.delete('cat-with-lessons');
    await expect(deletePromise).rejects.toBeInstanceOf(ConflictException);
    await expect(deletePromise).rejects.toThrow(
      'Không thể xóa danh mục đang có bài học. Vui lòng chuyển bài học sang danh mục khác trước.',
    );
  });

  it('Xóa category không có lessons -> thành công', async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: 'cat-empty',
      name: 'Ẩm thực',
      _count: { lessons: 0 },
    });
    prisma.category.delete.mockResolvedValue({
      id: 'cat-empty',
      name: 'Ẩm thực',
    });

    const result = await service.delete('cat-empty');

    expect(prisma.category.delete).toHaveBeenCalledWith({
      where: { id: 'cat-empty' },
    });
    expect(result).toEqual({ deleted: true, id: 'cat-empty' });
  });

  it('findAll trả danh sách kèm lessonCount', async () => {
    prisma.category.findMany.mockResolvedValue([
      {
        id: 'cat-1',
        name: 'Ẩm thực',
        _count: { lessons: 3 },
      },
      {
        id: 'cat-2',
        name: 'Lễ tân',
        _count: { lessons: 0 },
      },
    ]);

    const result = await service.findAll();

    expect(result).toEqual([
      { id: 'cat-1', name: 'Ẩm thực', lessonCount: 3 },
      { id: 'cat-2', name: 'Lễ tân', lessonCount: 0 },
    ]);
  });

  it('findById không tồn tại -> NotFoundException', async () => {
    prisma.category.findUnique.mockResolvedValue(null);

    await expect(service.findById('missing-cat')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create handle P2002 -> ConflictException', async () => {
    prisma.category.findUnique.mockResolvedValue(null);
    prisma.category.create.mockRejectedValue(
      new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.22.0',
      }),
    );

    await expect(service.create({ name: 'Ẩm thực' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('update thành công', async () => {
    prisma.category.findUnique.mockResolvedValue({
      id: 'cat-1',
      name: 'Cũ',
      _count: { lessons: 1 },
    });
    prisma.category.findFirst.mockResolvedValue(null);
    prisma.category.update.mockResolvedValue({
      id: 'cat-1',
      name: 'Mới',
      _count: { lessons: 2 },
    });

    const result = await service.update('cat-1', { name: 'Mới' });

    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: {
        name: 'Mới',
        NOT: { id: 'cat-1' },
      },
      select: { id: true },
    });
    expect(result).toEqual({
      id: 'cat-1',
      name: 'Mới',
      lessonCount: 2,
    });
  });
});
