import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentLessonsController } from './student-lessons.controller';
import { StudentLessonsService } from './student-lessons.service';

@Module({
  imports: [PrismaModule, FilesModule],
  controllers: [StudentLessonsController],
  providers: [StudentLessonsService],
  exports: [StudentLessonsService],
})
export class StudentLessonsModule {}
