-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verifyAutoResult" TEXT,
ADD COLUMN     "verifyFaceCount" INTEGER,
ADD COLUMN     "verifyFaceScore" DOUBLE PRECISION;
