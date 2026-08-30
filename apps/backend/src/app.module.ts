import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ActivityModule } from './activity/activity.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiTutorModule } from './ai-tutor/ai-tutor.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { EmailsModule } from './emails/emails.module';
import { LessonsModule } from './lessons/lessons.module';
import { PrismaModule } from './prisma/prisma.module';
import { QuestionsModule } from './questions/questions.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { StudentLessonsModule } from './student-lessons/student-lessons.module';

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000,
          limit: 150, // 150 req/phut/IP — doc bai hoc, cau hoi, danh muc
        },
        {
          name: 'write',
          ttl: 60000,
          limit: 30, // 30 req/phut/IP — nop bai, tao/sua du lieu
        },
        {
          name: 'auth',
          ttl: 60000,
          limit: 10, // 10 req/phut/IP — dang nhap, brute-force protection
        },
      ],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    ActivityModule,
    AnalyticsModule,
    CategoriesModule,
    EmailsModule,
    LessonsModule,
    QuestionsModule,
    SubmissionsModule,
    StudentLessonsModule,
    AiTutorModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
