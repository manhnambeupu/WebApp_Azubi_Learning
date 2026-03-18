import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Patch,
  Post,
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ReorderQuestionsDto } from './dto/reorder-questions.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionsService } from './questions.service';

const IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_MIME_TYPE = /image\/(jpeg|png|webp|avif|gif)/;

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiTags('Admin — Questions')
@ApiBearerAuth()
@Controller('admin/lessons/:lessonId/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách câu hỏi của bài học' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách câu hỏi thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài học.' })
  findAllByLesson(@Param('lessonId') lessonId: string) {
    return this.questionsService.findAllByLesson(lessonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết câu hỏi' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID (UUID)' })
  @ApiParam({ name: 'id', description: 'Question ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết câu hỏi thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy câu hỏi.' })
  async findById(@Param('lessonId') lessonId: string, @Param('id') id: string) {
    return this.getQuestionInLesson(lessonId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo câu hỏi và đáp án' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID (UUID)' })
  @ApiResponse({ status: 201, description: 'Tạo câu hỏi thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài học.' })
  @ApiResponse({ status: 422, description: 'Dữ liệu đầu vào không hợp lệ.' })
  create(@Param('lessonId') lessonId: string, @Body() dto: CreateQuestionDto) {
    return this.questionsService.create(lessonId, dto);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Sắp xếp lại thứ tự câu hỏi' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Sắp xếp câu hỏi thành công.' })
  @ApiResponse({ status: 422, description: 'Danh sách questionIds không hợp lệ.' })
  reorder(
    @Param('lessonId') lessonId: string,
    @Body() dto: ReorderQuestionsDto,
  ) {
    return this.questionsService.reorder(lessonId, dto.questionIds);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật câu hỏi và đáp án' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID (UUID)' })
  @ApiParam({ name: 'id', description: 'Question ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Cập nhật câu hỏi thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy câu hỏi.' })
  @ApiResponse({ status: 422, description: 'Dữ liệu đầu vào không hợp lệ.' })
  async update(
    @Param('lessonId') lessonId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    await this.getQuestionInLesson(lessonId, id);
    return this.questionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa câu hỏi' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID (UUID)' })
  @ApiParam({ name: 'id', description: 'Question ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Xóa câu hỏi thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy câu hỏi.' })
  async delete(@Param('lessonId') lessonId: string, @Param('id') id: string) {
    await this.getQuestionInLesson(lessonId, id);
    return this.questionsService.delete(id);
  }

  private async getQuestionInLesson(lessonId: string, questionId: string) {
    const question = await this.questionsService.findById(questionId);
    if (question.lessonId !== lessonId) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiTags('Admin — Questions')
@ApiBearerAuth()
@Controller('admin/questions')
export class QuestionsUploadController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload ảnh câu hỏi' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
      required: ['image'],
    },
  })
  @ApiResponse({ status: 201, description: 'Upload ảnh câu hỏi thành công.' })
  @ApiResponse({ status: 422, description: 'File ảnh không hợp lệ.' })
  uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: IMAGE_MAX_SIZE_BYTES }),
          new FileTypeValidator({ fileType: IMAGE_MIME_TYPE }),
        ],
      }),
    )
    imageFile: Express.Multer.File,
  ) {
    return this.questionsService.uploadQuestionImage(imageFile);
  }
}
