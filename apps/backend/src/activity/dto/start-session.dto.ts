import { SessionType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';

export class StartSessionDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  lessonId!: string;

  @ApiProperty({ enum: SessionType, example: SessionType.LESSON_VIEW })
  @IsEnum(SessionType)
  sessionType!: SessionType;
}
