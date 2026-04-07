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
exports.SubmitQuizDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const submit_answer_dto_1 = require("./submit-answer.dto");
class SubmitQuizDto {
    answers;
}
exports.SubmitQuizDto = SubmitQuizDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [submit_answer_dto_1.SubmitAnswerDto],
        example: [
            {
                questionId: '550e8400-e29b-41d4-a716-446655440000',
                answerIds: ['660e8400-e29b-41d4-a716-446655440000'],
            },
            {
                questionId: '770e8400-e29b-41d4-a716-446655440000',
                answerIds: [],
                matches: [
                    {
                        answerId: '880e8400-e29b-41d4-a716-446655440000',
                        matchText: 'Zero Trust',
                    },
                ],
            },
        ],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => submit_answer_dto_1.SubmitAnswerDto),
    __metadata("design:type", Array)
], SubmitQuizDto.prototype, "answers", void 0);
//# sourceMappingURL=submit-quiz.dto.js.map