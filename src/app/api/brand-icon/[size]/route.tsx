// تولید PNG آیکون برند — مونوگرام حرف اول نام با گرادیانت و شکل قالب هر اپ
// استفاده: /api/brand-icon/192 → PNG مربعی؛ ?maskable=1 برای safe-zone اندروید
import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getRequestBrand } from "@/lib/brand-server";
import { getBrandTheme } from "@/lib/brand-theme";
import { getMonogramSpec } from "@/lib/brand-icon-svg";

const SIZES = new Set(["96", "180", "192", "512"]);

// فونت فارسی برای رندر حرف مونوگرام — از پکیج vazirmatn خوانده و کش می شود
let fontData: ArrayBuffer | null = null;
function vazirmatn(): ArrayBuffer {
  if (!fontData) {
    const file = path.join(process.cwd(), "node_modules/vazirmatn/fonts/ttf/Vazirmatn-ExtraBold.ttf");
    const buf = readFileSync(file);
    fontData = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  }
  return fontData;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const px = SIZES.has(size) ? parseInt(size, 10) : 192;
  const maskable = new URL(req.url).searchParams.get("maskable") === "1";
  const brand = await getRequestBrand();

  // کندو لوگوی واقعی دارد — به فایل ثابت ریدایرکت می شود
  if (brand.id === "kandoo") {
    const file = px <= 192 ? "/icons/icon-192.png" : "/icons/icon-512.png";
    return Response.redirect(new URL(file, req.url), 302);
  }

  const spec = getMonogramSpec(brand, getBrandTheme(brand));
  const fontSize = px * (maskable ? 0.42 : 0.52);

  return new ImageResponse(
    (
      <div
        style={{
          width: px,
          height: px,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: `linear-gradient(135deg, ${spec.primary} 0%, ${spec.secondary} 100%)`,
          borderRadius: maskable ? 0 : px * spec.radiusRatio,
          fontFamily: "Vazirmatn",
        }}
      >
        {spec.deco === "glow" && (
          <div
            style={{
              position: "absolute",
              width: px * 0.72,
              height: px * 0.72,
              borderRadius: px,
              background: "rgba(255,255,255,0.22)",
            }}
          />
        )}
        {spec.deco === "path" && (
          <div
            style={{
              position: "absolute",
              bottom: px * 0.2,
              left: px * 0.22,
              right: px * 0.22,
              borderBottom: `${Math.max(2, px * 0.025)}px dashed rgba(255,255,255,0.6)`,
              borderRadius: "50%",
            }}
          />
        )}
        {spec.deco === "flame" && (
          <div
            style={{
              position: "absolute",
              bottom: px * 0.2,
              left: px * 0.2,
              right: px * 0.2,
              height: px * 0.18,
              borderBottom: `${Math.max(2, px * 0.03)}px solid rgba(255,255,255,0.5)`,
              borderRadius: "50%",
            }}
          />
        )}
        <span style={{ color: "#ffffff", fontSize, fontWeight: 900, lineHeight: 1 }}>
          {spec.letter}
        </span>
      </div>
    ),
    {
      width: px,
      height: px,
      fonts: [{ name: "Vazirmatn", data: vazirmatn(), weight: 800, style: "normal" }],
    }
  );
}
