"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentLessonsModule = void 0;
const common_1 = require("@nestjs/common");
const files_module_1 = require("../files/files.module");
const prisma_module_1 = require("../prisma/prisma.module");
const student_lessons_controller_1 = require("./student-lessons.controller");
const student_lessons_service_1 = require("./student-lessons.service");
let StudentLessonsModule = class StudentLessonsModule {
};
exports.StudentLessonsModule = StudentLessonsModule;
exports.StudentLessonsModule = StudentLessonsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, files_module_1.FilesModule],
        controllers: [student_lessons_controller_1.StudentLessonsController],
        providers: [student_lessons_service_1.StudentLessonsService],
        exports: [student_lessons_service_1.StudentLessonsService],
    })
], StudentLessonsModule);
//# sourceMappingURL=student-lessons.module.js.map