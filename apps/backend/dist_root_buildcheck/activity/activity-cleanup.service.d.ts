import { PrismaService } from '../prisma/prisma.service';
export declare class ActivityCleanupService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    closeZombieSessions(): Promise<void>;
    purgeOldSessions(): Promise<void>;
    private buildZombieCloseData;
}
