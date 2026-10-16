// تولید دارایی های فروشگاه گوگل پلی: آیکون ۵۱۲×۵۱۲ و گرافیک شاخص ۱۰۲۴×۵۰۰
// خروجی در store/ — اسکرین شات ها جداگانه با Playwright گرفته می شوند
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { renderK } from "./lib/k-glyph";

const OUT = path.join(process.cwd(), "store");

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // آیکون ۵۱۲ — K مشکی روی زمینه سفید (گوگل شفافیت نمی خواهد)
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([
      { input: await renderK(512, "#111111"), gravity: "center" },
    ])
    .png()
    .toFile(path.join(OUT, "icon-512.png"));
  console.log("[store] icon-512.png");

  // گرافیک شاخص ۱۰۲۴×۵۰۰ — زمینه گرادیان روشن + K مرکزی + تگ لاین
  // متن فارسی با SVG text رندر نمی شود (فونت لازم دارد) — فقط لوگو و زمینه
  const W = 1024, H = 500;
  const logoSize = 300;
  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fafafa"/>
        <stop offset="1" stop-color="#f0f0f0"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.5" r="0.55">
        <stop offset="0" stop-color="#ffd54a" stop-opacity="0.18"/>
        <stop offset="1" stop-color="#ffd54a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
  </svg>`;
  await sharp(Buffer.from(bg))
    .composite([
      {
        input: await renderK(logoSize, "#111111"),
        left: Math.round((W - logoSize) / 2),
        top: Math.round((H - logoSize) / 2),
      },
    ])
    .png()
    .toFile(path.join(OUT, "feature-1024x500.png"));
  console.log("[store] feature-1024x500.png");
  console.log("[store] done — screenshots با npm run store:shots");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
