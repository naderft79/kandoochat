-- AlterTable
ALTER TABLE "User" ADD COLUMN "legacyReferralCode" TEXT;
ALTER TABLE "User" ADD COLUMN "referralMilestonePaidAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Referral" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Referral" ADD COLUMN "paidAt" TIMESTAMP(3);

-- رکوردهای موجود: پاداششان قبلاً پرداخت شده است
UPDATE "Referral" SET "status" = 'PAID', "paidAt" = "createdAt";

-- CreateIndex
CREATE UNIQUE INDEX "User_legacyReferralCode_key" ON "User"("legacyReferralCode");
