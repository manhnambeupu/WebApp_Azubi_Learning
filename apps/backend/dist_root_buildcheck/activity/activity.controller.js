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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const activity_service_1 = require("./activity.service");
const heartbeat_dto_1 = require("./dto/heartbeat.dto");
const start_session_dto_1 = require("./dto/start-session.dto");
let ActivityController = class ActivityController {
    activityService;
    constructor(activityService) {
        this.activityService = activityService;
    }
    startSession(currentUser, dto) {
        const userId = this.extractUserId(currentUser);
        return this.activityService.startSession(userId, dto);
    }
    heartbeat(currentUser, dto) {
        const userId = this.extractUserId(currentUser);
        return this.activityService.heartbeat(userId, dto.sessionId);
    }
    endSession(currentUser, dto) {
        const userId = this.extractUserId(currentUser);
        return this.activityService.endSession(userId, dto.sessionId);
    }
    extractUserId(currentUser) {
        const jwtUserId = currentUser?.userId;
        if (typeof jwtUserId === 'string') {
            return jwtUserId;
        }
        const legacyUserId = currentUser?.id;
        if (typeof legacyUserId === 'string') {
            return legacyUserId;
        }
        throw new common_1.UnauthorizedException('Unauthorized');
    }
};
exports.ActivityController = ActivityController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.Header)('Cache-Control', 'no-store, no-cache, must-revalidate'),
    (0, common_1.Header)('Pragma', 'no-cache'),
    (0, swagger_1.ApiOperation)({ summary: 'Bắt đầu session theo dõi hoạt động học tập' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Bắt đầu session thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa đăng nhập hoặc token không hợp lệ.' }),
    (0, swagger_1.ApiResponse)({ status: 422, description: 'Dữ liệu đầu vào không hợp lệ.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, start_session_dto_1.StartSessionDto]),
    __metadata("design:returntype", void 0)
], ActivityController.prototype, "startSession", null);
__decorate([
    (0, common_1.Post)('heartbeat'),
    (0, common_1.Header)('Cache-Control', 'no-store, no-cache, must-revalidate'),
    (0, common_1.Header)('Pragma', 'no-cache'),
    (0, swagger_1.ApiOperation)({ summary: 'Gửi heartbeat cập nhật thời lượng hoạt động' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Heartbeat thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy session đang hoạt động.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, heartbeat_dto_1.HeartbeatDto]),
    __metadata("design:returntype", void 0)
], ActivityController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Post)('end'),
    (0, common_1.Header)('Cache-Control', 'no-store, no-cache, must-revalidate'),
    (0, common_1.Header)('Pragma', 'no-cache'),
    (0, swagger_1.ApiOperation)({ summary: 'Kết thúc session theo dõi hoạt động học tập' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Kết thúc session thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy session đang hoạt động.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, heartbeat_dto_1.HeartbeatDto]),
    __metadata("design:returntype", void 0)
], ActivityController.prototype, "endSession", null);
exports.ActivityController = ActivityController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('STUDENT'),
    (0, swagger_1.ApiTags)('Student — Analytics Session'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('student/analytics/session'),
    __metadata("design:paramtypes", [activity_service_1.ActivityService])
], ActivityController);
//# sourceMappingURL=activity.controller.js.map