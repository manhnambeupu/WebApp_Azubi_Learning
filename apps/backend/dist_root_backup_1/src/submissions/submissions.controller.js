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
exports.SubmissionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const submit_quiz_dto_1 = require("./dto/submit-quiz.dto");
const submissions_service_1 = require("./submissions.service");
let SubmissionsController = class SubmissionsController {
    submissionsService;
    constructor(submissionsService) {
        this.submissionsService = submissionsService;
    }
    submitQuiz(lessonId, currentUser, dto) {
        const userId = this.extractUserId(currentUser);
        return this.submissionsService.submitQuiz(userId, lessonId, dto);
    }
    getAttemptHistory(lessonId, currentUser) {
        const userId = this.extractUserId(currentUser);
        return this.submissionsService.getAttemptHistory(userId, lessonId);
    }
    getLatestAttempt(lessonId, currentUser) {
        const userId = this.extractUserId(currentUser);
        return this.submissionsService.getLatestAttempt(userId, lessonId);
    }
    getAttemptDetail(lessonId, attemptId, currentUser) {
        const userId = this.extractUserId(currentUser);
        return this.submissionsService.getAttemptDetail(userId, lessonId, attemptId);
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
exports.SubmissionsController = SubmissionsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Nộp bài quiz' }),
    (0, swagger_1.ApiParam)({ name: 'lessonId', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Nộp bài thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa đăng nhập hoặc token không hợp lệ.' }),
    (0, swagger_1.ApiResponse)({ status: 422, description: 'Dữ liệu nộp bài không hợp lệ.' }),
    __param(0, (0, common_1.Param)('lessonId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, submit_quiz_dto_1.SubmitQuizDto]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "submitQuiz", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy lịch sử các lần nộp bài' }),
    (0, swagger_1.ApiParam)({ name: 'lessonId', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lấy lịch sử nộp bài thành công.' }),
    __param(0, (0, common_1.Param)('lessonId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "getAttemptHistory", null);
__decorate([
    (0, common_1.Get)('latest'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy kết quả lần nộp mới nhất' }),
    (0, swagger_1.ApiParam)({ name: 'lessonId', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lấy kết quả lần nộp mới nhất thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Chưa có lần nộp nào.' }),
    __param(0, (0, common_1.Param)('lessonId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "getLatestAttempt", null);
__decorate([
    (0, common_1.Get)(':attemptId'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy chi tiết một lần nộp bài' }),
    (0, swagger_1.ApiParam)({ name: 'lessonId', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiParam)({ name: 'attemptId', description: 'Attempt ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lấy chi tiết lần nộp thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy lần nộp.' }),
    __param(0, (0, common_1.Param)('lessonId')),
    __param(1, (0, common_1.Param)('attemptId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "getAttemptDetail", null);
exports.SubmissionsController = SubmissionsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('STUDENT'),
    (0, swagger_1.ApiTags)('Student — Quiz'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('student/lessons/:lessonId/attempts'),
    __metadata("design:paramtypes", [submissions_service_1.SubmissionsService])
], SubmissionsController);
//# sourceMappingURL=submissions.controller.js.map