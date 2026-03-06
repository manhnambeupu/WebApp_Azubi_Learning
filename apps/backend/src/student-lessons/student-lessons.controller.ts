import {
  Controller,
  Get,
  Param,
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
import { StudentLessonsService } from './student-lessons.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
@ApiTags('Student — Lessons')
@ApiBearerAuth()
@Controller('student/lessons')
export class StudentLessonsController {
  constructor(private readonly studentLessonsService: StudentLessonsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bài học cho học viên' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách bài học thành công.' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập hoặc token không hợp lệ.' })
  findAllForStudent(@CurrentUser() currentUser: Record<string, unknown> | undefined) {
    const userId = this.extractUserId(currentUser);
    return this.studentLessonsService.findAllForStudent(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết bài học cho học viên' })
  @ApiParam({ name: 'id', description: 'Lesson ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết bài học thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài học.' })
  findDetailForStudent(
    @Param('id') lessonId: string,
    @CurrentUser() currentUser: Record<string, unknown> | undefined,
  ) {
    const userId = this.extractUserId(currentUser);
    return this.studentLessonsService.findDetailForStudent(lessonId, userId);
  }

  @Get(':id/files/:fileId/download')
  @ApiOperation({ summary: 'Lấy URL tải file bài học cho học viên' })
  @ApiParam({ name: 'id', description: 'Lesson ID (UUID)' })
  @ApiParam({ name: 'fileId', description: 'Lesson file ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy URL tải file thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy file hoặc bài học.' })
  getFileDownloadUrl(
    @Param('id') lessonId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.studentLessonsService.getFileDownloadUrl(lessonId, fileId);
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
