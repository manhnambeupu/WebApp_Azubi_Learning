"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLessonDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_lesson_dto_1 = require("./create-lesson.dto");
class UpdateLessonDto extends (0, swagger_1.PartialType)(create_lesson_dto_1.CreateLessonDto) {
}
exports.UpdateLessonDto = UpdateLessonDto;
//# sourceMappingURL=update-lesson.dto.js.map