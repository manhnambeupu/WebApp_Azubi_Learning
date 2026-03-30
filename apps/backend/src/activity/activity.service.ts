import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SessionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';

type ActiveOrIdleDurationPatch = Pick<
  Prisma.ActivitySessionUpdateInput,
  'activeDurationSeconds' | 'idleDurationSeconds'
>;

const ACTIVE_THRESHOLD_SECONDS = 120;

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async startSession(
    userId: string,
    dto: StartSessionDto,
  ): Promise<{ sessionId: string }> {
    const openSession = await this.prisma.activitySession.findFirst({
      where: {
        userId,
        lessonId: dto.lessonId,
        endedAt: null,
      },
      select: { id: true },
      orderBy: { startedAt: 'desc' },
    });

    if (openSession) {
      await this.endSession(userId, openSession.id);
    }

    const createdSession = await this.prisma.activitySession.create({
      data: {
        userId,
        lessonId: dto.lessonId,
        sessionType: dto.sessionType,
      },
      select: { id: true },
    });

    return { sessionId: createdSession.id };
  }

  async heartbeat(
    userId: string,
    sessionId: string,
  ): Promise<{ acknowledged: true }> {
    const currentSession = await this.prisma.activitySession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      select: {
        id: true,
        endedAt: true,
        lastHeartbeatAt: true,
      },
    });

    if (!currentSession || currentSession.endedAt !== null) {
      throw new NotFoundException('Activity session not found');
    }

    const now = new Date();
    const durationPatch = this.buildDurationPatch(
      now,
      currentSession.lastHeartbeatAt,
    );

    await this.prisma.activitySession.update({
      where: { id: currentSession.id },
      data: {
        ...durationPatch,
        lastHeartbeatAt: now,
      },
    });

    return { acknowledged: true };
  }

  async endSession(userId: string, sessionId: string) {
    const currentSession = await this.prisma.activitySession.findFirst({
      where: {
        id: sessionId,
        userId,
        endedAt: null,
      },
      select: {
        id: true,
        lastHeartbeatAt: true,
      },
    });

    if (!currentSession) {
      throw new NotFoundException('Activity session not found');
    }

    const now = new Date();
    const durationPatch = this.buildDurationPatch(
      now,
      currentSession.lastHeartbeatAt,
    );

    return this.prisma.activitySession.update({
      where: { id: currentSession.id },
      data: {
        ...durationPatch,
        lastHeartbeatAt: now,
        endedAt: now,
      },
    });
  }

  private buildDurationPatch(
    now: Date,
    lastHeartbeatAt: Date,
  ): ActiveOrIdleDurationPatch {
    const elapsedSeconds = Math.max(
      0,
      Math.floor((now.getTime() - lastHeartbeatAt.getTime()) / 1000),
    );

    if (elapsedSeconds <= ACTIVE_THRESHOLD_SECONDS) {
      return {
        activeDurationSeconds: { increment: elapsedSeconds },
      };
    }

    return {
      idleDurationSeconds: { increment: elapsedSeconds },
    };
  }
}
