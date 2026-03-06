import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Buồng phòng' })
  @IsString()
  @MinLength(1)
  name!: string;
}
