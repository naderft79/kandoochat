// پرداخت درون برنامه ای مارکت ها (کافه بازار / مایکت)
// کاتالوگ محصولات ثابت + تایید امضای خرید و اعتبار سکه/اشتراک به صورت idempotent
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getPlan, planEndsAt, SUBSCRIPTION_PLANS } from "@/lib/subscriptionPlans";
import { getSetting } from "@/lib/settings";
import { ensureWallet } from "@/lib/finance";
import { isValidBrandId, isValidMarket, getBrandById, type Market } from "@/lib/brands";

// محصولات سکه — باید دقیقا همین شناسه ها در پنل بازار/مایکت ثبت شوند
export const IAP_COIN_PRODUCTS = [
  { productId: "coins_5", coins: 5 },
  { productId: "coins_10", coins: 10 },
  { productId: "coins_50", coins: 50 },
  { productId: "coins_100", coins: 100 },
] as const;

// محصولات اشتراک — کلید = sub_<planKey>
export const IAP_SUB_PRODUCTS = SUBSCRIPTION_PLANS.map((p) => ({
  productId: `sub_${p.key}`,
  planKey: p.key,
}));

export type IapProductInfo = {
  productId: string;
  kind: "COINS" | "SUBSCRIPTION";
  coins: number;
  planKey: string | null;
  title: string;
  amountToman: number;
};

// کاتالوگ کامل محصولات با قیمت جاری (قیمت سکه از تنظیمات می آید تا با سایت یکی بماند)
export async function getIapProducts(): Promise<IapProductInfo[]> {
  const coinValue = (await getSetting("COIN_VALUE")) || 10000;
  return [
    ...IAP_COIN_PRODUCTS.map((p) => ({
      productId: p.productId,
      kind: "COINS" as const,
      coins: p.coins,
      planKey: null,
      title: `${p.coins} سکه`,
      amountToman: p.coins * coinValue,
    })),
    ...SUBSCRIPTION_PLANS.map((p) => ({
      productId: `sub_${p.key}`,
      kind: "SUBSCRIPTION" as const,
      coins: 0,
      planKey: p.key,
      title: `اشتراک ${p.name}`,
      amountToman: p.toman,
    })),
  ];
}

export async function findIapProduct(productId: string): Promise<IapProductInfo | null> {
  return (await getIapProducts()).find((p) => p.productId === productId) ?? null;
}

// کلید عمومی RSA هر برند+مارکت — از brands.json (iapKeys) یا env: IAP_PUBLIC_KEY_<MARKET>_<BRANDID>
function publicKeyFor(market: Market, brandId: string): string | null {
  const envKey = `IAP_PUBLIC_KEY_${market.toUpperCase()}_${brandId.toUpperCase().replace(/-/g, "_")}`;
  if (process.env[envKey]) return process.env[envKey]!;
  const brand = getBrandById(brandId);
  return brand.iapKeys?.[market] ?? null;
}

// تایید امضای خرید — دیتای امضاشده خرید با کلید خصوصی توسعه دهنده امضا می شود
// و اینجا با کلید عمومی همان اپ (از پنل مارکت) تایید می شود
export function verifyMarketSignature(
  market: Market,
  brandId: string,
  signedData: string,
  signature: string
): boolean {
  const pem = publicKeyFor(market, brandId);
  if (!pem) {
    console.error(`[iap] missing public key env for ${market}/${brandId}`);
    return false;
  }
  try {
    const verifier = crypto.createVerify("RSA-SHA1");
    verifier.update(signedData, "utf8");
    return verifier.verify(pem, signature, "base64");
  } catch (e) {
    console.error("[iap] signature verify error:", e);
    return false;
  }
}

// اعتبار سکه/اشتراک پس از تایید خرید — با رکورد IapPurchase و purchaseToken یکتا idempotent است
export async function creditIapPurchase(opts: {
  userId: string;
  brandId: string;
  market: Market;
  productId: string;
  purchaseToken: string;
  orderId?: string | null;
  packageName?: string | null;
}): Promise<{ ok: boolean; alreadyCredited?: boolean; error?: string }> {
  const product = await findIapProduct(opts.productId);
  if (!product) return { ok: false, error: "محصول نامعتبر است" };

  // ثبت توکن — تکراری بودن توکن یعنی این خرید قبلا اعتبار شده
  let purchase;
  try {
    purchase = await prisma.iapPurchase.create({
      data: {
        userId: opts.userId,
        brand: opts.brandId,
        market: opts.market,
        productId: opts.productId,
        purchaseToken: opts.purchaseToken,
        orderId: opts.orderId ?? null,
        packageName: opts.packageName ?? null,
      },
    });
  } catch (e) {
    // نقض یکتایی — همین خرید قبلا ثبت شده
    if ((e as { code?: string }).code === "P2002") {
      const existing = await prisma.iapPurchase.findUnique({
        where: { purchaseToken: opts.purchaseToken },
      });
      if (existing?.credited) return { ok: true, alreadyCredited: true };
      if (existing && existing.userId !== opts.userId) {
        console.error(`[iap] token reuse across users: ${opts.purchaseToken}`);
        return { ok: false, error: "خرید نامعتبر است" };
      }
      purchase = existing!;
    } else throw e;
  }

  if (purchase.credited) return { ok: true, alreadyCredited: true };

  if (product.kind === "COINS") {
    await ensureWallet(opts.userId);
    await prisma.$transaction([
      prisma.iapPurchase.update({ where: { id: purchase.id }, data: { credited: true } }),
      prisma.wallet.update({
        where: { userId: opts.userId },
        data: { balance: { increment: product.coins } },
      }),
      prisma.transaction.create({
        data: {
          userId: opts.userId,
          type: "COIN_PURCHASE",
          coins: product.coins,
          amountToman: product.amountToman,
          status: "COMPLETED",
          description: `خرید ${product.coins} سکه (${opts.market === "bazaar" ? "کافه بازار" : "مایکت"})`,
        },
      }),
      prisma.notification.create({
        data: {
          userId: opts.userId,
          type: "COIN_PURCHASE",
          title: "سکه خریداری شد",
          body: `${product.coins} سکه با موفقیت به کیف پول شما اضافه شد`,
          data: JSON.stringify({ link: "/dashboard/coins" }),
        },
      }),
    ]);
  } else {
    const plan = getPlan(product.planKey)!;
    const active = await prisma.subscription.findFirst({
      where: { userId: opts.userId, endsAt: { gt: new Date() } },
      orderBy: { endsAt: "desc" },
    });
    const startsAt = active ? active.endsAt : new Date();
    const endsAt = planEndsAt(startsAt, plan);
    await prisma.$transaction([
      prisma.iapPurchase.update({ where: { id: purchase.id }, data: { credited: true } }),
      prisma.subscription.create({
        data: { userId: opts.userId, tier: plan.name, startsAt, endsAt, coinsPaid: 0 },
      }),
      prisma.transaction.create({
        data: {
          userId: opts.userId,
          type: "SUBSCRIPTION",
          coins: 0,
          amountToman: product.amountToman,
          status: "COMPLETED",
          description: `خرید اشتراک ${plan.name} (${opts.market === "bazaar" ? "کافه بازار" : "مایکت"})`,
        },
      }),
      prisma.notification.create({
        data: {
          userId: opts.userId,
          type: "SUBSCRIPTION_PURCHASED",
          title: "اشتراک فعال شد",
          body: `اشتراک ${plan.name} شما با موفقیت فعال شد`,
          data: JSON.stringify({ link: "/dashboard/subscription" }),
        },
      }),
    ]);
  }

  console.log(`[iap] credited ${opts.productId} for user ${opts.userId} (${opts.brandId}/${opts.market})`);
  return { ok: true };
}

export { isValidBrandId, isValidMarket };
