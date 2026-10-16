// تولید PNG آیکون برند — نام برند با رنگ برند، بر اساس User-Agent درخواست کننده
// استفاده: /api/brand-icon/192 → PNG مربعی با حرف اول/نام برند
import { ImageResponse } from "next/og";
import { getRequestBrand } from "@/lib/brand-server";

const SIZES = new Set(["96", "180", "192", "512"]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const px = SIZES.has(size) ? parseInt(size, 10) : 192;
  const brand = await getRequestBrand();

  // کندو لوگوی واقعی دارد — به فایل ثابت ریدایرکت می شود
  if (brand.id === "kandoo") {
    const file = px <= 192 ? "/icons/icon-192.png" : "/icons/icon-512.png";
    return Response.redirect(new URL(file, _req.url), 302);
  }

  const fontSize =
    brand.name.length <= 2 ? px * 0.42 : brand.name.length <= 4 ? px * 0.32 : px * 0.24;

  return new ImageResponse(
    (
      <div
        style={{
          width: px,
          height: px,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${brand.colors.primary} 0%, ${brand.colors.dark} 100%)`,
          borderRadius: px * 0.22,
          fontFamily: "sans-serif",
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize,
            fontWeight: 800,
            textShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          {brand.name}
        </span>
      </div>
    ),
    { width: px, height: px }
  );
}
