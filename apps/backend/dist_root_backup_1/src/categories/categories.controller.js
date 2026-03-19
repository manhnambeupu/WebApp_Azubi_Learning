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
exports.CategoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const categories_service_1 = require("./categories.service");
const create_category_dto_1 = require("./dto/create-category.dto");
const update_category_dto_1 = require("./dto/update-category.dto");
let CategoriesController = class CategoriesController {
    categoriesService;
    constructor(categoriesService) {
        this.categoriesService = categoriesService;
    }
    findAll() {
        return this.categoriesService.findAll();
    }
    findById(id) {
        return this.categoriesService.findById(id);
    }
    create(dto) {
        return this.categoriesService.create(dto);
    }
    update(id, dto) {
        return this.categoriesService.update(id, dto);
    }
    delete(id) {
        return this.categoriesService.delete(id);
    }
};
exports.CategoriesController = CategoriesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách danh mục' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lấy danh sách thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Không có quyền truy cập.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy chi tiết danh mục' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Category ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lấy chi tiết thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy danh mục.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Tạo danh mục mới' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Tạo danh mục thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Tên danh mục đã tồn tại.' }),
    (0, swagger_1.ApiResponse)({ status: 422, description: 'Dữ liệu đầu vào không hợp lệ.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_category_dto_1.CreateCategoryDto]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật danh mục' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Category ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cập nhật thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy danh mục.' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Tên danh mục đã tồn tại.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_category_dto_1.UpdateCategoryDto]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa danh mục' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Category ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Xóa danh mục thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy danh mục.' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Danh mục đang được sử dụng.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "delete", null);
exports.CategoriesController = CategoriesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiTags)('Admin — Categories'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin/categories'),
    __metadata("design:paramtypes", [categories_service_1.CategoriesService])
], CategoriesController);
//# sourceMappingURL=categories.controller.js.map