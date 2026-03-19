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
exports.CreateAnswerDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateAnswerDto {
    text;
    isCorrect;
    explanation;
    orderIndex;
    matchText;
}
exports.CreateAnswerDto = CreateAnswerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Thay ga giường sạch trước khi đón khách.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnswerDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAnswerDto.prototype, "isCorrect", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Đây là bước bắt buộc theo SOP.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnswerDto.prototype, "explanation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 1,
        description: 'Used by ORDERING questions to store correct sequence.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateAnswerDto.prototype, "orderIndex", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Mạng Zero Trust',
        description: 'Used by MATCHING questions to store right-side match text.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnswerDto.prototype, "matchText", void 0);
//# sourceMappingURL=create-answer.dto.js.map