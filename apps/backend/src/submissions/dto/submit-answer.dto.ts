import { ArrayUnique, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  questionId!: string;

  @ApiProperty({
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  answerIds!: string[];
}
