import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  QuestionsController,
  QuestionsUploadController,
} from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
  imports: [PrismaModule, FilesModule],
  controllers: [QuestionsController, QuestionsUploadController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
