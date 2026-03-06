import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ example: 'student1@azubi.de' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Student123!' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @MinLength(2)
  fullName!: string;
}
