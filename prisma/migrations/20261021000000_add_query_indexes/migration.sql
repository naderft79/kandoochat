-- ایندکس های کوئری های داغ (فاز ۲): بدون حذف داده
CREATE INDEX "Conversation_userBId_idx" ON "Conversation"("userBId");

DROP INDEX IF EXISTS "Transaction_userId_idx";
CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt");

CREATE INDEX "WithdrawRequest_status_createdAt_idx" ON "WithdrawRequest"("status", "createdAt");

CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
