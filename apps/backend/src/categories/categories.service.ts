import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

type CategoryResponse = {
  id: string;
  name: string;
  lessonCount: number;
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<CategoryResponse[]> {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: { lessons: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      lessonCount: category._count.lessons,
    }));
  }

  async findById(id: string): Promise<CategoryResponse> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      id: category.id,
      name: category.name,
      lessonCount: category._count.lessons,
    };
  }

  async create(dto: CreateCategoryDto): Promise<CategoryResponse> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { name: dto.name },
      select: { id: true },
    });

    if (existingCategory) {
      throw new ConflictException('Category name already exists');
    }

    try {
      const category = await this.prisma.category.create({
        data: { name: dto.name },
      });

      return {
        id: category.id,
        name: category.name,
        lessonCount: 0,
      };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Category name already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponse> {
    await this.findById(id);

    if (dto.name) {
      const duplicateCategory = await this.prisma.category.findFirst({
        where: {
          name: dto.name,
          NOT: { id },
        },
        select: { id: true },
      });

      if (duplicateCategory) {
        throw new ConflictException('Category name already exists');
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
      },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    return {
      id: updatedCategory.id,
      name: updatedCategory.name,
      lessonCount: updatedCategory._count.lessons,
    };
  }

  async delete(id: string): Promise<{ deleted: true; id: string }> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category._count.lessons > 0) {
      throw new ConflictException(
        'Không thể xóa danh mục đang có bài học. Vui lòng chuyển bài học sang danh mục khác trước.',
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return {
      deleted: true,
      id,
    };
  }
}
