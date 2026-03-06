import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiTags('Admin — Categories')
@ApiBearerAuth()
@Controller('admin/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách danh mục' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công.' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập.' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết danh mục' })
  @ApiParam({ name: 'id', description: 'Category ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục.' })
  findById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo danh mục mới' })
  @ApiResponse({ status: 201, description: 'Tạo danh mục thành công.' })
  @ApiResponse({ status: 409, description: 'Tên danh mục đã tồn tại.' })
  @ApiResponse({ status: 422, description: 'Dữ liệu đầu vào không hợp lệ.' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật danh mục' })
  @ApiParam({ name: 'id', description: 'Category ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục.' })
  @ApiResponse({ status: 409, description: 'Tên danh mục đã tồn tại.' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa danh mục' })
  @ApiParam({ name: 'id', description: 'Category ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Xóa danh mục thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục.' })
  @ApiResponse({ status: 409, description: 'Danh mục đang được sử dụng.' })
  delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
