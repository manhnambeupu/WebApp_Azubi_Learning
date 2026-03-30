import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const ZOMBIE_TIMEOUT_MINUTES = 2;
const RETENTION_DAYS = 90;

@Injectable()
export class ActivityCleanupService {
  private readonly logger = new Logger(ActivityCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async closeZombieSessions(): Promise<void> {
    const zombieThreshold = new Date(
      Date.now() - ZOMBIE_TIMEOUT_MINUTES * 60 * 1000,
    );

    const zombieSessions = await this.prisma.activitySession.findMany({
      where: {
        endedAt: null,
        lastHeartbeatAt: {
          lt: zombieThreshold,
        },
      },
      select: {
        id: true,
        lastHeartbeatAt: true,
      },
    });

    if (zombieSessions.length === 0) {
      this.logger.log('Closed zombie activity sessions: 0');
      return;
    }

    const updates = zombieSessions.map((session) =>
      this.prisma.activitySession.update({
        where: { id: session.id },
        data: this.buildZombieCloseData(session.lastHeartbeatAt),
      }),
    );

    await this.prisma.$transaction(updates);
    this.logger.log(`Closed zombie activity sessions: ${zombieSessions.length}`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeOldSessions(): Promise<void> {
    const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const deleted = await this.prisma.activitySession.deleteMany({
      where: {
        startedAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`Purged old activity sessions: ${deleted.count}`);
  }

  private buildZombieCloseData(lastHeartbeatAt: Date): Prisma.ActivitySessionUpdateInput {
    const now = new Date();
    const additionalIdleSeconds = Math.max(
      0,
      Math.floor((now.getTime() - lastHeartbeatAt.getTime()) / 1000),
    );

    return {
      endedAt: lastHeartbeatAt,
      idleDurationSeconds: { increment: additionalIdleSeconds },
    };
  }
}
