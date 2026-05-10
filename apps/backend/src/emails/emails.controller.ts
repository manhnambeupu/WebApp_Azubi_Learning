import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SendBulkEmailDto } from './dto/send-bulk-email.dto';
import {
  EmailsService,
  SendBulkEmailAcceptedResponse,
} from './emails.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiTags('Admin — Emails')
@ApiBearerAuth()
@Controller('admin/emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post('send-bulk')
  @HttpCode(HttpStatus.ACCEPTED)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  @ApiOperation({ summary: 'Gui email hang loat cho hoc vien' })
  @ApiResponse({
    status: 202,
    description: 'Yeu cau gui email da duoc tiep nhan va xu ly ngam.',
  })
  @ApiResponse({ status: 400, description: 'Payload khong hop le.' })
  @ApiResponse({ status: 403, description: 'Khong co quyen truy cap.' })
  @ApiResponse({ status: 503, description: 'SMTP chua duoc cau hinh.' })
  sendBulk(
    @Body() dto: SendBulkEmailDto,
  ): Promise<SendBulkEmailAcceptedResponse> {
    return this.emailsService.sendBulk(dto);
  }
}
