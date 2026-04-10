import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  MessageEvent,
  Param,
  Post,
  Query,
  Sse,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Observable, endWith, from, map } from 'rxjs';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AiTutorService } from './ai-tutor.service';
import { AiChatHistoryQueryDto } from './dto/ai-chat-history-query.dto';
import { CreateAiChatDto } from './dto/create-ai-chat.dto';
import { StreamAiChatQueryDto } from './dto/stream-ai-chat-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('AI Tutor')
@ApiBearerAuth()
@Controller('ai-tutor')
export class AiTutorController {
  constructor(private readonly aiTutorService: AiTutorService) {}

  @Post('chat')
  @Roles('STUDENT')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @ApiOperation({ summary: 'Tạo câu hỏi chat AI cho học viên' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        lessonId: { type: 'string', format: 'uuid' },
        message: { type: 'string' },
      },
      required: ['lessonId', 'message'],
    },
  })
  @ApiResponse({ status: 201, description: 'Tạo câu hỏi chat thành công.' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập hoặc token không hợp lệ.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài học.' })
  createChatMessage(
    @CurrentUser() currentUser: Record<string, unknown> | undefined,
    @Body() dto: CreateAiChatDto,
  ) {
    const studentId = this.extractUserId(currentUser);
    return this.aiTutorService.createStudentMessage(studentId, dto.lessonId, dto.message);
  }

  @Sse('stream/:lessonId')
  @Roles('STUDENT')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @ApiOperation({ summary: 'Stream phản hồi AI Tutor qua SSE cho học viên' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID (UUID)' })
  @ApiQuery({
    name: 'chatId',
    required: false,
    description: 'ID câu hỏi đã tạo từ endpoint /ai-tutor/chat',
  })
  @ApiQuery({
    name: 'message',
    required: false,
    description: 'Nội dung câu hỏi truyền trực tiếp nếu không dùng chatId',
  })
  @ApiResponse({ status: 200, description: 'Bắt đầu stream phản hồi AI.' })
  @ApiResponse({
    status: 400,
    description: 'Thiếu message/chatId hoặc dữ liệu không hợp lệ.',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài học hoặc câu hỏi.' })
  streamResponse(
    @Param('lessonId') lessonId: string,
    @Query() query: StreamAiChatQueryDto,
    @CurrentUser() currentUser: Record<string, unknown> | undefined,
  ): Observable<MessageEvent> {
    const studentId = this.extractUserId(currentUser);
    const stream = this.aiTutorService.streamLessonResponse({
      studentId,
      lessonId,
      chatId: query.chatId,
      message: query.message,
    });

    return from(stream).pipe(
      map((chunk): MessageEvent => ({ data: chunk })),
      endWith({
        data: '[DONE]',
      }),
    );
  }

  @Get('history')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Lấy lịch sử chat AI (Admin)' })
  @ApiQuery({
    name: 'studentName',
    required: false,
    description: 'Lọc theo tên học viên',
  })
  @ApiQuery({
    name: 'lessonTitle',
    required: false,
    description: 'Lọc theo tiêu đề bài học',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Giới hạn số bản ghi (mặc định 100, tối đa 200)',
  })
  @ApiResponse({ status: 200, description: 'Lấy lịch sử chat AI thành công.' })
  getAdminHistory(@Query() query: AiChatHistoryQueryDto) {
    return this.aiTutorService.getAdminHistory(query);
  }

  @Delete('history/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Xóa một bản ghi lịch sử chat AI (Admin)' })
  @ApiParam({ name: 'id', description: 'AiChatHistory ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Xóa lịch sử chat AI thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch sử chat AI.' })
  deleteHistory(@Param('id') id: string) {
    return this.aiTutorService.deleteHistoryById(id);
  }

  private extractUserId(currentUser: Record<string, unknown> | undefined): string {
    const jwtUserId = currentUser?.userId;
    if (typeof jwtUserId === 'string') {
      return jwtUserId;
    }

    const legacyUserId = currentUser?.id;
    if (typeof legacyUserId === 'string') {
      return legacyUserId;
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
