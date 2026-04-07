import { ActivityService } from './activity.service';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { StartSessionDto } from './dto/start-session.dto';
export declare class ActivityController {
    private readonly activityService;
    constructor(activityService: ActivityService);
    startSession(currentUser: Record<string, unknown> | undefined, dto: StartSessionDto): Promise<{
        sessionId: string;
    }>;
    heartbeat(currentUser: Record<string, unknown> | undefined, dto: HeartbeatDto): Promise<{
        acknowledged: true;
    }>;
    endSession(currentUser: Record<string, unknown> | undefined, dto: HeartbeatDto): Promise<{
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
    private extractUserId;
}
