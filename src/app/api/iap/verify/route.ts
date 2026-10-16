// تایید خرید درون برنامه ای مارکت — اعتبار سکه/اشتراک فقط بعد از تایید امضای مارکت
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getRequestBrandInfo } from "@/lib/brand-server";
import {
  findIapProduct,
  verifyMarketSignature,
  creditIapPurchase,
} from "@/lib/iap";

const schema = z.object({
  productId: z.string().min(1).max(64),
  purchaseToken: z.string().min(1).max(512),
  orderId: z.string().max(128).optional(),
  packageName: z.string().max(128).optional(),
  signedData: z.string().max(4096).optional(),
  signature: z.string().max(2048).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });

    // برند و مارکت فقط از UA اپ — ورودی کلاینت برای برند پذیرفته نمی شود
    const { brand, market } = await getRequestBrandInfo();
    if (!market || brand.id === "kandoo") {
      return NextResponse.json({ error: "پرداخت مارکتی فقط در اپ های مارکتی فعال است" }, { status: 400 });
    }

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "پارامتر نامعتبر" }, { status: 400 });
    }
    const body = parsed.data;

    // نام پکیج اپ باید با پکیج تعریف شده برند یکی باشد
    if (body.packageName && body.packageName !== brand.packageName) {
      console.error(`[iap/verify] package mismatch: got ${body.packageName}, expected ${brand.packageName}`);
      return NextResponse.json({ error: "بسته نامعتبر است" }, { status: 400 });
    }

    const product = await findIapProduct(body.productId);
    if (!product) {
      return NextResponse.json({ error: "محصول نامعتبر است" }, { status: 400 });
    }

    // تایید امضای خرید — بدون کلید عمومی تنظیم شده، خرید تایید نمی شود
    if (!body.signedData || !body.signature) {
      return NextResponse.json({ error: "داده تایید خرید ناقص است" }, { status: 400 });
    }
    if (!verifyMarketSignature(market, brand.id, body.signedData, body.signature)) {
      console.error(`[iap/verify] invalid signature for ${brand.id}/${market} product=${body.productId}`);
      return NextResponse.json({ error: "تایید پرداخت ناموفق بود" }, { status: 403 });
    }

    const result = await creditIapPurchase({
      userId: session.userId,
      brandId: brand.id,
      market,
      productId: body.productId,
      purchaseToken: body.purchaseToken,
      orderId: body.orderId,
      packageName: body.packageName ?? brand.packageName,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "خطا در اعتبار خرید" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      alreadyCredited: result.alreadyCredited ?? false,
      kind: product.kind,
      coins: product.coins,
      planKey: product.planKey,
    });
  } catch (err) {
    console.error("[iap/verify] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
