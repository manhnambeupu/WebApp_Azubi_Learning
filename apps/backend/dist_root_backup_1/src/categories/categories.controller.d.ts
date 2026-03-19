import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(): Promise<{
        id: string;
        name: string;
        lessonCount: number;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        name: string;
        lessonCount: number;
    }>;
    create(dto: CreateCategoryDto): Promise<{
        id: string;
        name: string;
        lessonCount: number;
    }>;
    update(id: string, dto: UpdateCategoryDto): Promise<{
        id: string;
        name: string;
        lessonCount: number;
    }>;
    delete(id: string): Promise<{
        deleted: true;
        id: string;
    }>;
}
