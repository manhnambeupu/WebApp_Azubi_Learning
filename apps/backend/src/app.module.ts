import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
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
          ttl: 60000,
          limit: 100,
        },
      ],
    }),
    AuthModule,
    CategoriesModule,
    LessonsModule,
    QuestionsModule,
    SubmissionsModule,
    StudentLessonsModule,
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
