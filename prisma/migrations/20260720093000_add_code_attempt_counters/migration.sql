-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifyAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "passwordResetAttempts" INTEGER NOT NULL DEFAULT 0;
