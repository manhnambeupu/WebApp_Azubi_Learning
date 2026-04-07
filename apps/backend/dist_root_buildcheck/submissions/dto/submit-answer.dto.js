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
exports.SubmitAnswerDto = exports.SubmitMatchDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class SubmitMatchDto {
    answerId;
    matchText;
}
exports.SubmitMatchDto = SubmitMatchDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SubmitMatchDto.prototype, "answerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Mạng Zero Trust' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitMatchDto.prototype, "matchText", void 0);
class SubmitAnswerDto {
    questionId;
    answerIds;
    matches;
}
exports.SubmitAnswerDto = SubmitAnswerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SubmitAnswerDto.prototype, "questionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [String],
        example: ['550e8400-e29b-41d4-a716-446655440000'],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsUUID)(undefined, { each: true }),
    __metadata("design:type", Array)
], SubmitAnswerDto.prototype, "answerIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [SubmitMatchDto],
        description: 'Used for MATCHING questions: each item maps answerId to the match text selected by student.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SubmitMatchDto),
    __metadata("design:type", Array)
], SubmitAnswerDto.prototype, "matches", void 0);
//# sourceMappingURL=submit-answer.dto.js.map