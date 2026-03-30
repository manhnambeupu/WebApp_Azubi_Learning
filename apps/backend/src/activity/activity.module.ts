import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityCleanupService } from './activity-cleanup.service';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [ActivityController],
  providers: [ActivityService, ActivityCleanupService],
  exports: [ActivityService],
})
export class ActivityModule {}
