import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ example: 'Quy trình dọn buồng tiêu chuẩn' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Tổng quan quy trình vệ sinh và setup buồng phòng.' })
  @IsString()
  summary!: string;

  @ApiProperty({
    example: '# Mở đầu\n\nNội dung markdown chi tiết của bài học.',
  })
  @IsString()
  contentMd!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({ default: false })
  @Transform(({ value }) => value === 'true' || value === true || value === 1 || value === '1')
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}
