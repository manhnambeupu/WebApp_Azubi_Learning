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
exports.ReorderQuestionsDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class ReorderQuestionsDto {
    questionIds;
}
exports.ReorderQuestionsDto = ReorderQuestionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [String],
        format: 'uuid',
        example: [
            'f4a3d2cc-1d96-4bd3-93b2-98a1069a2e11',
            'd2417728-3f3f-4b2d-a93b-5f8d0f979ed9',
        ],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], ReorderQuestionsDto.prototype, "questionIds", void 0);
//# sourceMappingURL=reorder-questions.dto.js.map