import { Module } from '@nestjs/common';
import { AiTutorController } from './ai-tutor.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiCleanupService } from './ai-cleanup.service';
import { AiTutorService } from './ai-tutor.service';

@Module({
  imports: [PrismaModule],
  providers: [AiTutorService, AiCleanupService],
  controllers: [AiTutorController],
})
export class AiTutorModule {}
