import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonsService } from './lessons.service';

const IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const LESSON_FILE_MAX_SIZE_BYTES = 20 * 1024 * 1024;
const DOCX_MIME_TYPE =
  /^application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document$/;

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiTags('Admin — Lessons')
@ApiBearerAuth()
@Controller('admin/lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bài học' })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Lọc theo Category ID (UUID)',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách bài học thành công.' })
  findAll(@Query('categoryId') categoryId?: string) {
    return this.lessonsService.findAll(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết bài học' })
  @ApiParam({ name: 'id', description: 'Lesson ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết bài học thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài học.' })
  findById(@Param('id') id: string) {
    return this.lessonsService.findById(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Tạo bài học mới' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' },
        contentMd: { type: 'string' },
        categoryId: { type: 'string', format: 'uuid' },
        image: { type: 'string', format: 'binary' },
      },
      required: ['title', 'summary', 'contentMd', 'categoryId'],
    },
  })
  @ApiResponse({ status: 201, description: 'Tạo bài học thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục.' })
  @ApiResponse({ status: 422, description: 'Dữ liệu hoặc file không hợp lệ.' })
  create(
    @Body() dto: CreateLessonDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: IMAGE_MAX_SIZE_BYTES }),
          new FileTypeValidator({
            fileType: /^image\/(jpg|jpeg|png)$/,
          }),
        ],
      }),
    )
    imageFile?: Express.Multer.File,
  ) {
    return this.lessonsService.create(dto, imageFile);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Cập nhật bài học' })
  @ApiParam({ name: 'id', description: 'Lesson ID (UUID)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' },
        contentMd: { type: 'string' },
        categoryId: { type: 'string', format: 'uuid' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Cập nhật bài học thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài học hoặc danh mục.' })
  @ApiResponse({ status: 422, description: 'Dữ liệu hoặc file không hợp lệ.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: IMAGE_MAX_SIZE_BYTES }),
          new FileTypeValidator({
            fileType: /^image\/(jpg|jpeg|png)$/,
          }),
        ],
      }),
    )
    imageFile?: Express.Multer.File,
  ) {
    return this.lessonsService.update(id, dto, imageFile);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bài học' })
  @ApiParam({ name: 'id', description: 'Lesson ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Xóa bài học thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài học.' })
  delete(@Param('id') id: string) {
    return this.lessonsService.delete(id);
  }

  @Post(':id/files')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload file Word cho bài học' })
  @ApiParam({ name: 'id', description: 'Lesson ID (UUID)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Upload file thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài học.' })
  @ApiResponse({ status: 422, description: 'File không hợp lệ.' })
  uploadLessonFile(
    @Param('id') lessonId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: LESSON_FILE_MAX_SIZE_BYTES }),
          new FileTypeValidator({ fileType: DOCX_MIME_TYPE }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.lessonsService.uploadLessonFile(lessonId, file);
  }

  @Delete(':id/files/:fileId')
  @ApiOperation({ summary: 'Xóa file bài học' })
  @ApiParam({ name: 'id', description: 'Lesson ID (UUID)' })
  @ApiParam({ name: 'fileId', description: 'Lesson file ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Xóa file thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài học hoặc file.' })
  deleteLessonFile(@Param('id') lessonId: string, @Param('fileId') fileId: string) {
    return this.lessonsService.deleteLessonFile(lessonId, fileId);
  }

  @Get(':id/files/:fileId/download')
  @ApiOperation({ summary: 'Lấy URL tải file bài học' })
  @ApiParam({ name: 'id', description: 'Lesson ID (UUID)' })
  @ApiParam({ name: 'fileId', description: 'Lesson file ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy URL tải file thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài học hoặc file.' })
  getLessonFileDownloadUrl(
    @Param('id') lessonId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.lessonsService.getLessonFileDownloadUrl(lessonId, fileId);
  }
}
