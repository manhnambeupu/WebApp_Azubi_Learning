/*
  Warnings:

  - A unique constraint covering the columns `[auth_provider,provider_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'IMAGE_ESSAY';

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "image_url" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "auth_provider" TEXT,
ADD COLUMN     "provider_id" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_provider_provider_id_key" ON "users"("auth_provider", "provider_id");
