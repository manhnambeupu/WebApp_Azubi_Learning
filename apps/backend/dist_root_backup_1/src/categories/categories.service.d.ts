import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
type CategoryResponse = {
    id: string;
    name: string;
    lessonCount: number;
};
export declare class CategoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<CategoryResponse[]>;
    findById(id: string): Promise<CategoryResponse>;
    create(dto: CreateCategoryDto): Promise<CategoryResponse>;
    update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponse>;
    delete(id: string): Promise<{
        deleted: true;
        id: string;
    }>;
}
export {};
