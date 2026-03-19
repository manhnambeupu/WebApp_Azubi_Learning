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
exports.StudentLessonsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const student_lessons_service_1 = require("./student-lessons.service");
let StudentLessonsController = class StudentLessonsController {
    studentLessonsService;
    constructor(studentLessonsService) {
        this.studentLessonsService = studentLessonsService;
    }
    findAllForStudent(currentUser) {
        const userId = this.extractUserId(currentUser);
        return this.studentLessonsService.findAllForStudent(userId);
    }
    findDetailForStudent(lessonId, currentUser) {
        const userId = this.extractUserId(currentUser);
        return this.studentLessonsService.findDetailForStudent(lessonId, userId);
    }
    getFileDownloadUrl(lessonId, fileId) {
        return this.studentLessonsService.getFileDownloadUrl(lessonId, fileId);
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
exports.StudentLessonsController = StudentLessonsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách bài học cho học viên' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lấy danh sách bài học thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Chưa đăng nhập hoặc token không hợp lệ.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudentLessonsController.prototype, "findAllForStudent", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy chi tiết bài học cho học viên' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lấy chi tiết bài học thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy bài học.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StudentLessonsController.prototype, "findDetailForStudent", null);
__decorate([
    (0, common_1.Get)(':id/files/:fileId/download'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy URL tải file bài học cho học viên' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiParam)({ name: 'fileId', description: 'Lesson file ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lấy URL tải file thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy file hoặc bài học.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('fileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], StudentLessonsController.prototype, "getFileDownloadUrl", null);
exports.StudentLessonsController = StudentLessonsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('STUDENT'),
    (0, swagger_1.ApiTags)('Student — Lessons'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('student/lessons'),
    __metadata("design:paramtypes", [student_lessons_service_1.StudentLessonsService])
], StudentLessonsController);
//# sourceMappingURL=student-lessons.controller.js.map