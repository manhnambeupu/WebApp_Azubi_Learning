import { PrismaService } from '../prisma/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';
export declare class ActivityService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    startSession(userId: string, dto: StartSessionDto): Promise<{
        sessionId: string;
    }>;
    heartbeat(userId: string, sessionId: string): Promise<{
        acknowledged: true;
    }>;
    endSession(userId: string, sessionId: string): Promise<{
        id: string;
        userId: string;
        lessonId: string;
        startedAt: Date;
        endedAt: Date | null;
        lastHeartbeatAt: Date;
        activeDurationSeconds: number;
        idleDurationSeconds: number;
        sessionType: import(".prisma/client").$Enums.SessionType;
    }>;
    private buildDurationPatch;
}
