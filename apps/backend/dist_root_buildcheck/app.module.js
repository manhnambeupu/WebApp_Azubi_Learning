"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const activity_module_1 = require("./activity/activity.module");
const analytics_module_1 = require("./analytics/analytics.module");
const app_controller_1 = require("./app.controller");
const auth_module_1 = require("./auth/auth.module");
const categories_module_1 = require("./categories/categories.module");
const lessons_module_1 = require("./lessons/lessons.module");
const prisma_module_1 = require("./prisma/prisma.module");
const questions_module_1 = require("./questions/questions.module");
const submissions_module_1 = require("./submissions/submissions.module");
const student_lessons_module_1 = require("./student-lessons/student-lessons.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            throttler_1.ThrottlerModule.forRoot({
                throttlers: [
                    {
                        ttl: 60000,
                        limit: 100,
                    },
                ],
            }),
            auth_module_1.AuthModule,
            activity_module_1.ActivityModule,
            analytics_module_1.AnalyticsModule,
            categories_module_1.CategoriesModule,
            lessons_module_1.LessonsModule,
            questions_module_1.QuestionsModule,
            submissions_module_1.SubmissionsModule,
            student_lessons_module_1.StudentLessonsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map