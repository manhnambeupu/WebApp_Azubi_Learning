import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitMatchDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  answerId!: string;

  @ApiProperty({ example: 'Mạng Zero Trust' })
  @IsString()
  matchText!: string;
}

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

  @ApiPropertyOptional({
    type: [SubmitMatchDto],
    description:
      'Used for MATCHING questions: each item maps answerId to the match text selected by student.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitMatchDto)
  matches?: SubmitMatchDto[];
}
