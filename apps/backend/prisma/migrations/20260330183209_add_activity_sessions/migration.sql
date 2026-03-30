-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('LESSON_VIEW', 'QUIZ_ATTEMPT');

-- CreateTable
CREATE TABLE "activity_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "last_heartbeat_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active_duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "idle_duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "session_type" "SessionType" NOT NULL,

    CONSTRAINT "activity_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_sessions_user_id_lesson_id_idx" ON "activity_sessions"("user_id", "lesson_id");

-- CreateIndex
CREATE INDEX "activity_sessions_last_heartbeat_at_idx" ON "activity_sessions"("last_heartbeat_at");

-- AddForeignKey
ALTER TABLE "activity_sessions" ADD CONSTRAINT "activity_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_sessions" ADD CONSTRAINT "activity_sessions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
