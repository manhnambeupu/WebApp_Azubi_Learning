import { QuestionType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateAnswerDto } from './create-answer.dto';

export class CreateQuestionDto {
  @ApiProperty({ example: 'Bước đầu tiên khi vào phòng khách là gì?' })
  @IsString()
  text!: string;

  @ApiPropertyOptional({ example: 'Cần gõ cửa và chào khách trước khi vào.' })
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

  @ApiProperty({
    enum: QuestionType,
    enumName: 'QuestionType',
    default: QuestionType.SINGLE_CHOICE,
  })
  @IsEnum(QuestionType)
  type!: QuestionType;

  @ApiProperty({
    type: [CreateAnswerDto],
    description:
      'Supports SINGLE_CHOICE, MULTIPLE_CHOICE, ESSAY, IMAGE_ESSAY, ORDERING, MATCHING; ordering/matching metadata can be passed in each answer.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerDto)
  answers!: CreateAnswerDto[];
}
