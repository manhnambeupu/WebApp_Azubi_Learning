import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
