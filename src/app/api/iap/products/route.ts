// کاتالوگ محصولات درون برنامه ای — اپ های مارکتی برای نمایش قیمت به بازار/مایکت این لیست را می گیرند
import { NextResponse } from "next/server";
import { getIapProducts } from "@/lib/iap";
import { getSession } from "@/lib/auth";
import { getRequestBrandInfo } from "@/lib/brand-server";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const { brand, market } = await getRequestBrandInfo();
  const products = await getIapProducts();
  return NextResponse.json({
    brand: brand.id,
    market,
    products: products.map((p) => ({
      productId: p.productId,
      kind: p.kind,
      coins: p.coins,
      planKey: p.planKey,
      title: p.title,
      amountToman: p.amountToman,
    })),
  });
}
