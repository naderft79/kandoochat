-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "selfieUrls" TEXT NOT NULL DEFAULT '[]',
    "voiceUrl" TEXT,
    "idCardFrontUrl" TEXT,
    "idCardBackUrl" TEXT,
    "nationalCode" TEXT,
    "fullName" TEXT,
    "birthDate" TEXT,
    "faceScore" DOUBLE PRECISION,
    "faceCount" INTEGER,
    "autoResult" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- DropColumn
ALTER TABLE "User" DROP COLUMN "verifyAutoResult";

-- DropColumn
ALTER TABLE "User" DROP COLUMN "verifyFaceCount";

-- DropColumn
ALTER TABLE "User" DROP COLUMN "verifyFaceScore";

-- DropColumn
ALTER TABLE "User" DROP COLUMN "verifyIdCardUrl";

-- DropColumn
ALTER TABLE "User" DROP COLUMN "verifyReviewedAt";

-- DropColumn
ALTER TABLE "User" DROP COLUMN "verifySelfieUrl";

-- DropColumn
ALTER TABLE "User" DROP COLUMN "verifyStatus";

-- DropColumn
ALTER TABLE "User" DROP COLUMN "verifySubmittedAt";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isIdentityVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "VerificationRequest_userId_kind_idx" ON "VerificationRequest"("userId", "kind");

-- CreateIndex
CREATE INDEX "VerificationRequest_status_idx" ON "VerificationRequest"("status");

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
