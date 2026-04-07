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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ACTIVE_THRESHOLD_SECONDS = 120;
let ActivityService = class ActivityService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async startSession(userId, dto) {
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
    async heartbeat(userId, sessionId) {
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
            throw new common_1.NotFoundException('Activity session not found');
        }
        const now = new Date();
        const durationPatch = this.buildDurationPatch(now, currentSession.lastHeartbeatAt);
        await this.prisma.activitySession.update({
            where: { id: currentSession.id },
            data: {
                ...durationPatch,
                lastHeartbeatAt: now,
            },
        });
        return { acknowledged: true };
    }
    async endSession(userId, sessionId) {
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
            throw new common_1.NotFoundException('Activity session not found');
        }
        const now = new Date();
        const durationPatch = this.buildDurationPatch(now, currentSession.lastHeartbeatAt);
        return this.prisma.activitySession.update({
            where: { id: currentSession.id },
            data: {
                ...durationPatch,
                lastHeartbeatAt: now,
                endedAt: now,
            },
        });
    }
    buildDurationPatch(now, lastHeartbeatAt) {
        const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - lastHeartbeatAt.getTime()) / 1000));
        if (elapsedSeconds <= ACTIVE_THRESHOLD_SECONDS) {
            return {
                activeDurationSeconds: { increment: elapsedSeconds },
            };
        }
        return {
            idleDurationSeconds: { increment: elapsedSeconds },
        };
    }
};
exports.ActivityService = ActivityService;
exports.ActivityService = ActivityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivityService);
//# sourceMappingURL=activity.service.js.map