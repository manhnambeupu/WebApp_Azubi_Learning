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
exports.CreateQuestionDto = void 0;
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const create_answer_dto_1 = require("./create-answer.dto");
class CreateQuestionDto {
    text;
    explanation;
    imageUrl;
    type;
    answers;
}
exports.CreateQuestionDto = CreateQuestionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Bước đầu tiên khi vào phòng khách là gì?' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Cần gõ cửa và chào khách trước khi vào.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "explanation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL của ảnh đính kèm với câu hỏi' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: client_1.QuestionType,
        enumName: 'QuestionType',
        default: client_1.QuestionType.SINGLE_CHOICE,
    }),
    (0, class_validator_1.IsEnum)(client_1.QuestionType),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [create_answer_dto_1.CreateAnswerDto],
        description: 'Supports SINGLE_CHOICE, MULTIPLE_CHOICE, ESSAY, IMAGE_ESSAY, ORDERING, MATCHING; ordering/matching metadata can be passed in each answer.',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => create_answer_dto_1.CreateAnswerDto),
    __metadata("design:type", Array)
], CreateQuestionDto.prototype, "answers", void 0);
//# sourceMappingURL=create-question.dto.js.map