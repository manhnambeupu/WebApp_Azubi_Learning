import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderQuestionsDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    example: [
      'f4a3d2cc-1d96-4bd3-93b2-98a1069a2e11',
      'd2417728-3f3f-4b2d-a93b-5f8d0f979ed9',
    ],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  questionIds!: string[];
}
