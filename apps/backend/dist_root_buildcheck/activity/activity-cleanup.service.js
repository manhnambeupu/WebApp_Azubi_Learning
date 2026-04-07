"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ActivityCleanupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityCleanupService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const ZOMBIE_TIMEOUT_MINUTES = 2;
const RETENTION_DAYS = 90;
let ActivityCleanupService = ActivityCleanupService_1 = class ActivityCleanupService {
    prisma;
    logger = new common_1.Logger(ActivityCleanupService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async closeZombieSessions() {
        const zombieThreshold = new Date(Date.now() - ZOMBIE_TIMEOUT_MINUTES * 60 * 1000);
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
        const updates = zombieSessions.map((session) => this.prisma.activitySession.update({
            where: { id: session.id },
            data: this.buildZombieCloseData(session.lastHeartbeatAt),
        }));
        await this.prisma.$transaction(updates);
        this.logger.log(`Closed zombie activity sessions: ${zombieSessions.length}`);
    }
    async purgeOldSessions() {
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
    buildZombieCloseData(lastHeartbeatAt) {
        const now = new Date();
        const additionalIdleSeconds = Math.max(0, Math.floor((now.getTime() - lastHeartbeatAt.getTime()) / 1000));
        return {
            endedAt: lastHeartbeatAt,
            idleDurationSeconds: { increment: additionalIdleSeconds },
        };
    }
};
exports.ActivityCleanupService = ActivityCleanupService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ActivityCleanupService.prototype, "closeZombieSessions", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_3AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ActivityCleanupService.prototype, "purgeOldSessions", null);
exports.ActivityCleanupService = ActivityCleanupService = ActivityCleanupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivityCleanupService);
//# sourceMappingURL=activity-cleanup.service.js.map