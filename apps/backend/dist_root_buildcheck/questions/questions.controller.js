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
exports.QuestionsUploadController = exports.QuestionsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const create_question_dto_1 = require("./dto/create-question.dto");
const reorder_questions_dto_1 = require("./dto/reorder-questions.dto");
const update_question_dto_1 = require("./dto/update-question.dto");
const questions_service_1 = require("./questions.service");
const IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_MIME_TYPE = /image\/(jpeg|png|webp|avif|gif)/;
let QuestionsController = class QuestionsController {
    questionsService;
    constructor(questionsService) {
        this.questionsService = questionsService;
    }
    findAllByLesson(lessonId) {
        return this.questionsService.findAllByLesson(lessonId);
    }
    async findById(lessonId, id) {
        return this.getQuestionInLesson(lessonId, id);
    }
    create(lessonId, dto) {
        return this.questionsService.create(lessonId, dto);
    }
    reorder(lessonId, dto) {
        return this.questionsService.reorder(lessonId, dto.questionIds);
    }
    async update(lessonId, id, dto) {
        await this.getQuestionInLesson(lessonId, id);
        return this.questionsService.update(id, dto);
    }
    async delete(lessonId, id) {
        await this.getQuestionInLesson(lessonId, id);
        return this.questionsService.delete(id);
    }
    async getQuestionInLesson(lessonId, questionId) {
        const question = await this.questionsService.findById(questionId);
        if (question.lessonId !== lessonId) {
            throw new common_1.NotFoundException('Question not found');
        }
        return question;
    }
};
exports.QuestionsController = QuestionsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách câu hỏi của bài học' }),
    (0, swagger_1.ApiParam)({ name: 'lessonId', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lấy danh sách câu hỏi thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy bài học.' }),
    __param(0, (0, common_1.Param)('lessonId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "findAllByLesson", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy chi tiết câu hỏi' }),
    (0, swagger_1.ApiParam)({ name: 'lessonId', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Question ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lấy chi tiết câu hỏi thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy câu hỏi.' }),
    __param(0, (0, common_1.Param)('lessonId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Tạo câu hỏi và đáp án' }),
    (0, swagger_1.ApiParam)({ name: 'lessonId', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Tạo câu hỏi thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy bài học.' }),
    (0, swagger_1.ApiResponse)({ status: 422, description: 'Dữ liệu đầu vào không hợp lệ.' }),
    __param(0, (0, common_1.Param)('lessonId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_question_dto_1.CreateQuestionDto]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('reorder'),
    (0, swagger_1.ApiOperation)({ summary: 'Sắp xếp lại thứ tự câu hỏi' }),
    (0, swagger_1.ApiParam)({ name: 'lessonId', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sắp xếp câu hỏi thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 422, description: 'Danh sách questionIds không hợp lệ.' }),
    __param(0, (0, common_1.Param)('lessonId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reorder_questions_dto_1.ReorderQuestionsDto]),
    __metadata("design:returntype", void 0)
], QuestionsController.prototype, "reorder", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật câu hỏi và đáp án' }),
    (0, swagger_1.ApiParam)({ name: 'lessonId', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Question ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cập nhật câu hỏi thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy câu hỏi.' }),
    (0, swagger_1.ApiResponse)({ status: 422, description: 'Dữ liệu đầu vào không hợp lệ.' }),
    __param(0, (0, common_1.Param)('lessonId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_question_dto_1.UpdateQuestionDto]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa câu hỏi' }),
    (0, swagger_1.ApiParam)({ name: 'lessonId', description: 'Lesson ID (UUID)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Question ID (UUID)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Xóa câu hỏi thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Không tìm thấy câu hỏi.' }),
    __param(0, (0, common_1.Param)('lessonId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "delete", null);
exports.QuestionsController = QuestionsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiTags)('Admin — Questions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin/lessons/:lessonId/questions'),
    __metadata("design:paramtypes", [questions_service_1.QuestionsService])
], QuestionsController);
let QuestionsUploadController = class QuestionsUploadController {
    questionsService;
    constructor(questionsService) {
        this.questionsService = questionsService;
    }
    uploadImage(imageFile) {
        return this.questionsService.uploadQuestionImage(imageFile);
    }
};
exports.QuestionsUploadController = QuestionsUploadController;
__decorate([
    (0, common_1.Post)('upload-image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiOperation)({ summary: 'Upload ảnh câu hỏi' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                image: { type: 'string', format: 'binary' },
            },
            required: ['image'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Upload ảnh câu hỏi thành công.' }),
    (0, swagger_1.ApiResponse)({ status: 422, description: 'File ảnh không hợp lệ.' }),
    __param(0, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
        validators: [
            new common_1.MaxFileSizeValidator({ maxSize: IMAGE_MAX_SIZE_BYTES }),
            new common_1.FileTypeValidator({ fileType: IMAGE_MIME_TYPE }),
        ],
    }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuestionsUploadController.prototype, "uploadImage", null);
exports.QuestionsUploadController = QuestionsUploadController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiTags)('Admin — Questions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin/questions'),
    __metadata("design:paramtypes", [questions_service_1.QuestionsService])
], QuestionsUploadController);
//# sourceMappingURL=questions.controller.js.map