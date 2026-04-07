"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
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
    async findById(id) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { lessons: true },
                },
            },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        return {
            id: category.id,
            name: category.name,
            lessonCount: category._count.lessons,
        };
    }
    async create(dto) {
        const existingCategory = await this.prisma.category.findUnique({
            where: { name: dto.name },
            select: { id: true },
        });
        if (existingCategory) {
            throw new common_1.ConflictException('Category name already exists');
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
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('Category name already exists');
            }
            throw error;
        }
    }
    async update(id, dto) {
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
                throw new common_1.ConflictException('Category name already exists');
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
    async delete(id) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { lessons: true },
                },
            },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        if (category._count.lessons > 0) {
            throw new common_1.ConflictException('Không thể xóa danh mục đang có bài học. Vui lòng chuyển bài học sang danh mục khác trước.');
        }
        await this.prisma.category.delete({
            where: { id },
        });
        return {
            deleted: true,
            id,
        };
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map