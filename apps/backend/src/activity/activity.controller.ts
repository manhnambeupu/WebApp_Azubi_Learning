import {
  Body,
  Controller,
  Header,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ActivityService } from './activity.service';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { StartSessionDto } from './dto/start-session.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
@ApiTags('Student — Analytics Session')
@ApiBearerAuth()
@Controller('student/analytics/session')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @ApiOperation({ summary: 'Bắt đầu session theo dõi hoạt động học tập' })
  @ApiResponse({ status: 201, description: 'Bắt đầu session thành công.' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập hoặc token không hợp lệ.' })
  @ApiResponse({ status: 422, description: 'Dữ liệu đầu vào không hợp lệ.' })
  startSession(
    @CurrentUser() currentUser: Record<string, unknown> | undefined,
    @Body() dto: StartSessionDto,
  ) {
    const userId = this.extractUserId(currentUser);
    return this.activityService.startSession(userId, dto);
  }

  @Post('heartbeat')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @ApiOperation({ summary: 'Gửi heartbeat cập nhật thời lượng hoạt động' })
  @ApiResponse({ status: 201, description: 'Heartbeat thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy session đang hoạt động.' })
  heartbeat(
    @CurrentUser() currentUser: Record<string, unknown> | undefined,
    @Body() dto: HeartbeatDto,
  ) {
    const userId = this.extractUserId(currentUser);
    return this.activityService.heartbeat(userId, dto.sessionId);
  }

  @Post('end')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @ApiOperation({ summary: 'Kết thúc session theo dõi hoạt động học tập' })
  @ApiResponse({ status: 201, description: 'Kết thúc session thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy session đang hoạt động.' })
  endSession(
    @CurrentUser() currentUser: Record<string, unknown> | undefined,
    @Body() dto: HeartbeatDto,
  ) {
    const userId = this.extractUserId(currentUser);
    return this.activityService.endSession(userId, dto.sessionId);
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
