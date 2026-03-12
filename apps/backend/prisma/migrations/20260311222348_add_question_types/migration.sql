-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'ESSAY');

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "type" "QuestionType" NOT NULL DEFAULT 'SINGLE_CHOICE';
