import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubmitAnswerDto } from './submit-answer.dto';

export class SubmitQuizDto {
  @ApiProperty({
    type: [SubmitAnswerDto],
    example: [
      {
        questionId: '550e8400-e29b-41d4-a716-446655440000',
        answerIds: ['660e8400-e29b-41d4-a716-446655440000'],
      },
      {
        questionId: '770e8400-e29b-41d4-a716-446655440000',
        answerIds: [],
        matches: [
          {
            answerId: '880e8400-e29b-41d4-a716-446655440000',
            matchText: 'Zero Trust',
          },
        ],
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerDto)
  answers!: SubmitAnswerDto[];
}
