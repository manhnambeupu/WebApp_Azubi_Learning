import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const RETENTION_DAYS = 90;

@Injectable()
export class AiCleanupService {
  private readonly logger = new Logger(AiCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanup(): Promise<void> {
    const ninetyDaysAgo = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const deleted = await this.prisma.aiChatHistory.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo,
        },
      },
    });

    this.logger.log(`Purged AI chat history records: ${deleted.count}`);
  }
}
