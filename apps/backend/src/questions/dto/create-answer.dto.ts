import { IsBoolean, IsOptional, IsString } from 'class-validator';
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
}
