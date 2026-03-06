import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { SubmissionsService } from './submissions.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
@ApiTags('Student — Quiz')
@ApiBearerAuth()
@Controller('student/lessons/:lessonId/attempts')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Nộp bài quiz' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID (UUID)' })
  @ApiResponse({ status: 201, description: 'Nộp bài thành công.' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập hoặc token không hợp lệ.' })
  @ApiResponse({ status: 422, description: 'Dữ liệu nộp bài không hợp lệ.' })
  submitQuiz(
    @Param('lessonId') lessonId: string,
    @CurrentUser() currentUser: Record<string, unknown> | undefined,
    @Body() dto: SubmitQuizDto,
  ) {
    const userId = this.extractUserId(currentUser);
    return this.submissionsService.submitQuiz(userId, lessonId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy lịch sử các lần nộp bài' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy lịch sử nộp bài thành công.' })
  getAttemptHistory(
    @Param('lessonId') lessonId: string,
    @CurrentUser() currentUser: Record<string, unknown> | undefined,
  ) {
    const userId = this.extractUserId(currentUser);
    return this.submissionsService.getAttemptHistory(userId, lessonId);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Lấy kết quả lần nộp mới nhất' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy kết quả lần nộp mới nhất thành công.' })
  @ApiResponse({ status: 404, description: 'Chưa có lần nộp nào.' })
  getLatestAttempt(
    @Param('lessonId') lessonId: string,
    @CurrentUser() currentUser: Record<string, unknown> | undefined,
  ) {
    const userId = this.extractUserId(currentUser);
    return this.submissionsService.getLatestAttempt(userId, lessonId);
  }

  @Get(':attemptId')
  @ApiOperation({ summary: 'Lấy chi tiết một lần nộp bài' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID (UUID)' })
  @ApiParam({ name: 'attemptId', description: 'Attempt ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết lần nộp thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lần nộp.' })
  getAttemptDetail(
    @Param('lessonId') lessonId: string,
    @Param('attemptId') attemptId: string,
    @CurrentUser() currentUser: Record<string, unknown> | undefined,
  ) {
    const userId = this.extractUserId(currentUser);
    return this.submissionsService.getAttemptDetail(userId, lessonId, attemptId);
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
