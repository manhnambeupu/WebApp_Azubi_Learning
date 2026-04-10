import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class AiChatHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Lọc theo tên học viên',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  studentName?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo tiêu đề bài học',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  lessonTitle?: string;

  @ApiPropertyOptional({
    description: 'Giới hạn số bản ghi trả về',
    minimum: 1,
    maximum: 200,
  })
  @Transform(({ value }) =>
    value === undefined ? undefined : Number.parseInt(String(value), 10),
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
