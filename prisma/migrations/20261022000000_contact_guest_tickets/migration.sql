-- فرم تماس مهمان: تیکت و پیام بدون کاربر (فاز ۲)
ALTER TABLE "Ticket" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Ticket" ADD COLUMN "guestName" TEXT, ADD COLUMN "guestEmail" TEXT;
ALTER TABLE "TicketMessage" ALTER COLUMN "senderId" DROP NOT NULL;
