"use client";

// کانتکست برند — نام و رنگ برند فعلی به همه کامپوننت های کلاینت می رسد
// سرور برند را از User-Agent تشخیص می دهد و از layout پاس می دهد؛
// کلاینت در صورت لزوم خودش هم از navigator.userAgent پارس می کند
import { createContext, useContext, type ReactNode } from "react";
import {
  DEFAULT_BRAND,
  parseBrandFromUA,
  getBrandById,
  type BrandConfig,
  type Market,
} from "@/lib/brands";

type BrandContextValue = { brand: BrandConfig; market: Market | null };

const BrandContext = createContext<BrandContextValue>({
  brand: DEFAULT_BRAND,
  market: null,
});

export default function BrandProvider({
  brand,
  market,
  children,
}: {
  brand: BrandConfig;
  market: Market | null;
  children: ReactNode;
}) {
  return (
    <BrandContext.Provider value={{ brand, market }}>{children}</BrandContext.Provider>
  );
}

export function useBrand(): BrandConfig {
  const ctx = useContext(BrandContext);
  // در صورت نبود پروایدر یا تغییر UA، از خود مرورگر/وب ویو پارس می شود
  if (ctx.brand.id === "kandoo" && typeof navigator !== "undefined") {
    const { brandId } = parseBrandFromUA(navigator.userAgent);
    if (brandId) return getBrandById(brandId);
  }
  return ctx.brand;
}

export function useMarket(): Market | null {
  const ctx = useContext(BrandContext);
  if (!ctx.market && typeof navigator !== "undefined") {
    return parseBrandFromUA(navigator.userAgent).market;
  }
  return ctx.market;
}
