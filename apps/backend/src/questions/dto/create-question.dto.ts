import { QuestionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
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
      'ESSAY questions may use [] or a single sample answer; choice questions still require answer validation in the service.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerDto)
  answers!: CreateAnswerDto[];
}
