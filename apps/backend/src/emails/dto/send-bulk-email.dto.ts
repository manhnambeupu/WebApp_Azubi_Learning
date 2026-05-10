import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendBulkEmailDto {
  @ApiProperty({
    example: 'Thong bao lich hoc tuan toi',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject!: string;

  @ApiProperty({
    example:
      '## Chao cac ban\n\nLop se hoc buoi toi vao **thu Sau**. Vui long den dung gio.',
    maxLength: 20000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  markdownContent!: string;

  @ApiProperty({
    oneOf: [
      { type: 'string', enum: ['ALL'] },
      {
        type: 'array',
        items: { type: 'string', format: 'email' },
      },
    ],
    example: 'ALL',
    description: 'ALL de gui cho toan bo hoc vien hoac danh sach email cu the.',
  })
  @IsDefined()
  targetEmails!: string[] | 'ALL';
}
