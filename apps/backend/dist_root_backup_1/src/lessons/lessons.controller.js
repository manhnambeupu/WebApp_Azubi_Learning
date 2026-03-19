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
exports.LessonsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const create_lesson_dto_1 = require("./dto/create-lesson.dto");
const update_lesson_dto_1 = require("./dto/update-lesson.dto");
const lessons_service_1 = require("./lessons.service");
const IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const LESSON_FILE_MAX_SIZE_BYTES = 20 * 1024 * 1024;
const IMAGE_MIME_TYPE = /image\/(jpeg|png|webp|avif|gif)/;
const LESSON_FILE_MIME_TYPE = /^(application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/pdf)$/;
let LessonsController = class LessonsController {
    lessonsService;
    constructor(lessonsService) {
        this.lessonsService = lessonsService;
    }
    findAll(categoryId) {
        return this.lessonsService.findAll(categoryId);
    }
    findById(id) {
        return this.lessonsService.findById(id);
    }
    create(dto, imageFile) {
        return this.lessonsService.create(dto, imageFile);
    }
    update(id, dto, imageFile) {
        return this.lessonsService.update(id, dto, imageFile);
    }
    delete(id) {
        return this.lessonsService.delete(id);
    }
    uploadLessonFile(lessonId, file) {
        return this.lessonsService.uploadLessonFile(lessonId, file);
    }
    deleteLessonFile(lessonId, fileId) {
        return this.lessonsService.deleteLessonFile(lessonId, fileId);
    }
    getLessonFileDownloadUrl(lessonId, fileId) {
        return this.lessonsService.getLessonFileDownloadUrl(lessonId, fileId);
    }
};
exports.LessonsController = LessonsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách bài học' }),
    (0, swagger_1.ApiQuery)({
        name: 'categoryId',
        required: false,
        description: 'Lọc theo Category ID (UUID)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lấy danh sách bài học thành công.' }),
    __param(0, (0, common_1.Query)('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LessonsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy chi tiết bài học' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lấy chi tiết bài học thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy bài học.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LessonsController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiOperation)({ summary: 'Tạo bài học mới' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                title: { type: 'string' },
                summary: { type: 'string' },
                contentMd: { type: 'string' },
                categoryId: { type: 'string', format: 'uuid' },
                image: { type: 'string', format: 'binary' },
            },
            required: ['title', 'summary', 'contentMd', 'categoryId'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Tạo bài học thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy danh mục.' }),
    (0, swagger_1.ApiResponse)({ status: 422, description: 'Dữ liệu hoặc file không hợp lệ.' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
        fileIsRequired: false,
        validators: [
            new common_1.MaxFileSizeValidator({ maxSize: IMAGE_MAX_SIZE_BYTES }),
            new common_1.FileTypeValidator({
                fileType: IMAGE_MIME_TYPE,
            }),
        ],
    }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lesson_dto_1.CreateLessonDto, Object]),
    __metadata("design:returntype", void 0)
], LessonsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật bài học' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                title: { type: 'string' },
                summary: { type: 'string' },
                contentMd: { type: 'string' },
                categoryId: { type: 'string', format: 'uuid' },
                image: { type: 'string', format: 'binary' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cập nhật bài học thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy bài học hoặc danh mục.' }),
    (0, swagger_1.ApiResponse)({ status: 422, description: 'Dữ liệu hoặc file không hợp lệ.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
        fileIsRequired: false,
        validators: [
            new common_1.MaxFileSizeValidator({ maxSize: IMAGE_MAX_SIZE_BYTES }),
            new common_1.FileTypeValidator({
                fileType: IMAGE_MIME_TYPE,
            }),
        ],
    }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_lesson_dto_1.UpdateLessonDto, Object]),
    __metadata("design:returntype", void 0)
], LessonsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa bài học' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Xóa bài học thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy bài học.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LessonsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/files'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiOperation)({ summary: 'Upload file tài liệu cho bài học' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
            required: ['file'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Upload file thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy bài học.' }),
    (0, swagger_1.ApiResponse)({ status: 422, description: 'File không hợp lệ.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
        validators: [
            new common_1.MaxFileSizeValidator({ maxSize: LESSON_FILE_MAX_SIZE_BYTES }),
            new common_1.FileTypeValidator({ fileType: LESSON_FILE_MIME_TYPE }),
        ],
    }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LessonsController.prototype, "uploadLessonFile", null);
__decorate([
    (0, common_1.Delete)(':id/files/:fileId'),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa file bài học' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiParam)({ name: 'fileId', description: 'Lesson file ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Xóa file thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy bài học hoặc file.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('fileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LessonsController.prototype, "deleteLessonFile", null);
__decorate([
    (0, common_1.Get)(':id/files/:fileId/download'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy URL tải file bài học' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiParam)({ name: 'fileId', description: 'Lesson file ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lấy URL tải file thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy bài học hoặc file.' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('fileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LessonsController.prototype, "getLessonFileDownloadUrl", null);
exports.LessonsController = LessonsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiTags)('Admin — Lessons'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin/lessons'),
    __metadata("design:paramtypes", [lessons_service_1.LessonsService])
], LessonsController);
//# sourceMappingURL=lessons.controller.js.map