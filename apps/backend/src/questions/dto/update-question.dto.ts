import { QuestionType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateAnswerDto } from './create-answer.dto';

export class UpdateQuestionDto {
  @ApiPropertyOptional({ example: 'Nội dung câu hỏi đã được cập nhật.' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ example: 'Giải thích tổng cho câu hỏi.' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ description: 'URL của ảnh đính kèm với câu hỏi' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ default: false })
  @Transform(
    ({ value }) => value === 'true' || value === true || value === 1 || value === '1',
  )
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @ApiPropertyOptional({ enum: QuestionType, enumName: 'QuestionType' })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @ApiPropertyOptional({
    type: [CreateAnswerDto],
    description:
      'Supports updating ORDERING/MATCHING metadata (orderIndex, matchText) within answers.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerDto)
  answers?: CreateAnswerDto[];
}
