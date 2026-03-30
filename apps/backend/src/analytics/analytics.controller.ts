import {
  Controller,
  Delete,
  Get,
  Header,
  Param,
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
import { AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiTags('Admin — Analytics')
@ApiBearerAuth()
@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @ApiOperation({ summary: 'Lấy tổng quan analytics' })
  @ApiResponse({ status: 200, description: 'Lấy tổng quan analytics thành công.' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập.' })
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('students')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @ApiOperation({ summary: 'Lấy danh sách tổng hợp analytics theo học viên' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách tổng hợp analytics theo học viên thành công.',
  })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập.' })
  getStudentsSummary() {
    return this.analyticsService.getStudentsSummary();
  }

  @Get('students/:id')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @ApiOperation({ summary: 'Lấy chi tiết analytics của một học viên' })
  @ApiParam({ name: 'id', description: 'Student user ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết analytics thành công.' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy học viên.' })
  getStudentDetail(@Param('id') id: string) {
    return this.analyticsService.getStudentDetail(id);
  }

  @Delete('students/:id')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @ApiOperation({ summary: 'Xóa analytics session của một học viên' })
  @ApiParam({ name: 'id', description: 'Student user ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Xóa analytics session thành công.' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập.' })
  deleteStudentAnalytics(@Param('id') id: string) {
    return this.analyticsService.deleteStudentAnalytics(id);
  }
}
