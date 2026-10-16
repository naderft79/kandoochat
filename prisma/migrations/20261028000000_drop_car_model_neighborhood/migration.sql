-- حذف فیلدهای مدل ماشین و محل زندگی از مشخصات کاربر
ALTER TABLE "User" DROP COLUMN "carModel",
DROP COLUMN "neighborhood";
