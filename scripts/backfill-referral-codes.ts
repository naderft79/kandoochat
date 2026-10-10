// backfill یک باره کدهای دعوت ۷ کاراکتری — کد قدیمی به legacyReferralCode منتقل می شود
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { generateReferralCode } from "../src/lib/referral";

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, referralCode: true, legacyReferralCode: true },
  });
  // فقط کاربرانی که کد ۷ کاراکتری ندارند
  const targets = users.filter((u) => !u.referralCode || u.referralCode.length !== 7);
  console.log(`[backfill] ${targets.length} users need new codes out of ${users.length}`);

  let done = 0;
  for (const u of targets) {
    const code = await generateReferralCode();
    if (!code) {
      console.error(`[backfill] could not generate code for user ${u.id}`);
      continue;
    }
    await prisma.user.update({
      where: { id: u.id },
      data: {
        referralCode: code,
        legacyReferralCode: u.legacyReferralCode ?? u.referralCode ?? undefined,
      },
    });
    done++;
  }
  console.log(`[backfill] done — ${done} codes generated`);
}

main()
  .catch((err) => {
    console.error("[backfill] fatal:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
