import { QuestionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
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

  @ApiPropertyOptional({ enum: QuestionType, enumName: 'QuestionType' })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @ApiPropertyOptional({ type: [CreateAnswerDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerDto)
  answers?: CreateAnswerDto[];
}
