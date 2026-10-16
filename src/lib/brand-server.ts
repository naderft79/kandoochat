// خواندن برند درخواست در سرور — از User-Agent برای Server Component ها و route handler ها
import { headers } from "next/headers";
import { brandFromUA, parseBrandFromUA, getBrandById, type BrandConfig, type Market } from "@/lib/brands";
import { prisma } from "@/lib/prisma";

export async function getRequestBrand(): Promise<BrandConfig> {
  const h = await headers();
  return brandFromUA(h.get("user-agent"));
}

export async function getRequestBrandInfo(): Promise<{ brand: BrandConfig; market: Market | null }> {
  const h = await headers();
  const ua = h.get("user-agent");
  const { brandId, market } = parseBrandFromUA(ua);
  return { brand: brandFromUA(ua), market: brandId ? market : null };
}

// فقط نام برند — برای جایگزینی سریع «کندو» در متن های سرور
export async function requestBrandName(): Promise<string> {
  return (await getRequestBrand()).name;
}

// برند ذخیره شده یک کاربر — برای پیام ها/اعلان هایی که به کاربر می رود (نه بر اساس درخواست)
export async function getUserBrandName(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { brand: true } });
  return getBrandById(u?.brand).name;
}
