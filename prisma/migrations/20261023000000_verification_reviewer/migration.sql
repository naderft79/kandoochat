-- ثبت ادمین بررسی کننده و ایندکس صف احراز هویت (افزایشی)
ALTER TABLE "VerificationRequest" ADD COLUMN "reviewedById" TEXT;
CREATE INDEX "VerificationRequest_status_kind_createdAt_idx" ON "VerificationRequest"("status", "kind", "createdAt");
