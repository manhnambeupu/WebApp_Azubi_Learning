import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class StreamAiChatQueryDto {
  @ApiPropertyOptional({
    description: 'ID câu hỏi đã tạo từ endpoint POST /ai-tutor/chat',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  chatId?: string;

  @ApiPropertyOptional({
    description: 'Nội dung câu hỏi truyền trực tiếp nếu không có chatId',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message?: string;
}
