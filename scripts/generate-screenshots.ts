// تولید اسکرین شات های برند PWA — برای دیالوگ نصب غنی در اندروید و دسکتاپ
import path from "path";
import fs from "fs";
import sharp from "sharp";

const SRC = path.join(process.cwd(), "public", "bee-colori-logo.png");
const OUT_DIR = path.join(process.cwd(), "public", "screenshots");

// پس زمینه گرادیان روشن با هاله زرد ملایم برند
function bgSvg(width: number, height: number): Buffer {
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff"/>
          <stop offset="1" stop-color="#faf7ef"/>
        </linearGradient>
        <radialGradient id="halo" cx="0.5" cy="0.42" r="0.55">
          <stop offset="0" stop-color="#ffe9a8" stop-opacity="0.55"/>
          <stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      <rect width="${width}" height="${height}" fill="url(#halo)"/>
    </svg>
  `);
}

async function makeShot(
  name: string,
  width: number,
  height: number,
  logoWidth: number
) {
  const logo = await sharp(SRC)
    .resize(logoWidth, logoWidth, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp(bgSvg(width, height))
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(path.join(OUT_DIR, name));

  console.log(`[screenshots] ${name} (${width}x${height})`);
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`[screenshots] source logo not found: ${SRC}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  await Promise.all([
    // موبایل — form_factor: narrow
    makeShot("mobile.png", 1080, 2400, 560),
    // دسکتاپ — form_factor: wide
    makeShot("desktop.png", 1920, 1080, 480),
  ]);
}

main().catch((err) => {
  console.error("[screenshots] failed:", err);
  process.exit(1);
});
