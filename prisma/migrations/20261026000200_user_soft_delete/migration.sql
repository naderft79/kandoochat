-- حذف نرم کاربر با مهلت بازیابی ۳۰ روزه (افزایشی)
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "deletedById" TEXT;
ALTER TABLE "User" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "User" ADD COLUMN "deletePurgeAfter" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "deletedSnapshot" JSONB;

CREATE INDEX "User_deletePurgeAfter_idx" ON "User"("deletePurgeAfter");
