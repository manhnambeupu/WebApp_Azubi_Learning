import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAiChatDto {
  @ApiProperty({
    description: 'Lesson ID (UUID)',
    format: 'uuid',
  })
  @IsUUID()
  lessonId!: string;

  @ApiProperty({
    description: 'Nội dung câu hỏi của học viên',
    minLength: 1,
    maxLength: 4000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message!: string;
}
