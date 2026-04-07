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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const analytics_service_1 = require("./analytics.service");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    getOverview() {
        return this.analyticsService.getOverview();
    }
    getStudentsSummary() {
        return this.analyticsService.getStudentsSummary();
    }
    getStudentDetail(id) {
        return this.analyticsService.getStudentDetail(id);
    }
    deleteStudentAnalytics(id) {
        return this.analyticsService.deleteStudentAnalytics(id);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('overview'),
    (0, common_1.Header)('Cache-Control', 'no-store, no-cache, must-revalidate'),
    (0, common_1.Header)('Pragma', 'no-cache'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy tổng quan analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lấy tổng quan analytics thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Không có quyền truy cập.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('students'),
    (0, common_1.Header)('Cache-Control', 'no-store, no-cache, must-revalidate'),
    (0, common_1.Header)('Pragma', 'no-cache'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách tổng hợp analytics theo học viên' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lấy danh sách tổng hợp analytics theo học viên thành công.',
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Không có quyền truy cập.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getStudentsSummary", null);
__decorate([
    (0, common_1.Get)('students/:id'),
    (0, common_1.Header)('Cache-Control', 'no-store, no-cache, must-revalidate'),
    (0, common_1.Header)('Pragma', 'no-cache'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy chi tiết analytics của một học viên' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Student user ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lấy chi tiết analytics thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Không có quyền truy cập.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy học viên.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getStudentDetail", null);
__decorate([
    (0, common_1.Delete)('students/:id'),
    (0, common_1.Header)('Cache-Control', 'no-store, no-cache, must-revalidate'),
    (0, common_1.Header)('Pragma', 'no-cache'),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa analytics session của một học viên' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Student user ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Xóa analytics session thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Không có quyền truy cập.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "deleteStudentAnalytics", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiTags)('Admin — Analytics'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin/analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map