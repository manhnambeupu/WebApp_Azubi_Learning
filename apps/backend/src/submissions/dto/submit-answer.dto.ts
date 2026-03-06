import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  questionId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  answerId!: string;
}
