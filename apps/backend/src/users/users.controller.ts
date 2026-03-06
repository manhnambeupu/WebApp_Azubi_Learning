import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
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
import { CreateStudentDto } from './dto/create-student.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiTags('Admin — Students')
@ApiBearerAuth()
@Controller('admin/students')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách học viên' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách học viên thành công.' })
  findAllStudents() {
    return this.usersService.findAllStudents();
  }

  @Post()
  @ApiOperation({ summary: 'Tạo tài khoản học viên' })
  @ApiResponse({ status: 201, description: 'Tạo học viên thành công.' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại.' })
  @ApiResponse({ status: 422, description: 'Dữ liệu đầu vào không hợp lệ.' })
  createStudent(@Body() dto: CreateStudentDto) {
    return this.usersService.createStudent(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa học viên' })
  @ApiParam({ name: 'id', description: 'Student user ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Xóa học viên thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy học viên.' })
  deleteStudent(@Param('id') id: string) {
    return this.usersService.deleteStudent(id);
  }
}
