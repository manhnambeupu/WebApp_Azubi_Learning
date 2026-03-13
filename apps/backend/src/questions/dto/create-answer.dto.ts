import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnswerDto {
  @ApiProperty({ example: 'Thay ga giường sạch trước khi đón khách.' })
  @IsString()
  text!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isCorrect!: boolean;

  @ApiPropertyOptional({ example: 'Đây là bước bắt buộc theo SOP.' })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Used by ORDERING questions to store correct sequence.',
  })
  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @ApiPropertyOptional({
    example: 'Mạng Zero Trust',
    description: 'Used by MATCHING questions to store right-side match text.',
  })
  @IsOptional()
  @IsString()
  matchText?: string;
}
