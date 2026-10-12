// تولید لوگوی کندو (حرف K با فونت Grand Hotel) + همه آیکن های PWA/اندروید
// فونت از assets/grand-hotel.ttf خوانده و گلیف K به مسیر SVG تبدیل می شود
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { renderK, FONT_PATH } from "./lib/k-glyph";

const SRC = path.join(process.cwd(), "public", "bee-colori-logo.png");
const GRAY_SRC = path.join(process.cwd(), "public", "bee-gray-logo.png");
const ICONS_DIR = path.join(process.cwd(), "public", "icons");

async function main() {
  if (!fs.existsSync(FONT_PATH)) {
    console.error(`[icons] font not found: ${FONT_PATH}`);
    process.exit(1);
  }
  fs.mkdirSync(ICONS_DIR, { recursive: true });

  // بازسازی لوگوها: K مشکی (نسخه رنگی) و K خاکستری (نسخه تک رنگ)
  await sharp(await renderK(512, "#111111")).png().toFile(SRC);
  console.log("[icons] bee-colori-logo.png (K)");
  await sharp(await renderK(512, "#555555")).png().toFile(GRAY_SRC);
  console.log("[icons] bee-gray-logo.png (K)");

  const tasks: Promise<unknown>[] = [];

  // آیکون های معمولی — بکگراند سفید
  for (const size of [192, 512]) {
    tasks.push(
      sharp({
        create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
      })
        .composite([
          {
            input: await sharp(SRC).resize(Math.round(size * 0.88), Math.round(size * 0.88), { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toBuffer(),
            gravity: "center",
          },
        ])
        .png()
        .toFile(path.join(ICONS_DIR, `icon-${size}.png`))
        .then(() => console.log(`[icons] icon-${size}.png`))
    );
  }

  // آیکون maskable با پدینگ ۲۰٪ (safe zone)
  const maskableSize = 512;
  const padded = Math.round(maskableSize * 0.8);
  tasks.push(
    sharp({
      create: {
        width: maskableSize,
        height: maskableSize,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        {
          input: await sharp(SRC).resize(padded, padded, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toBuffer(),
          gravity: "center",
        },
      ])
      .png()
      .toFile(path.join(ICONS_DIR, "maskable-512.png"))
      .then(() => console.log("[icons] maskable-512.png"))
  );

  // apple-touch-icon (۱۸۰x۱۸۰، پس زمینه سفید — iOS شفافیت را مشکی می کند)
  tasks.push(
    sharp({
      create: { width: 180, height: 180, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
    })
      .composite([
        {
          input: await sharp(SRC).resize(150, 150, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toBuffer(),
          gravity: "center",
        },
      ])
      .png()
      .toFile(path.join(process.cwd(), "public", "apple-touch-icon.png"))
      .then(() => console.log("[icons] apple-touch-icon.png"))
  );

  // آیکون 1024 برای تولید آیکون های اندروید با capacitor-assets
  const assetsDir = path.join(process.cwd(), "assets");
  fs.mkdirSync(assetsDir, { recursive: true });
  tasks.push(
    sharp({
      create: { width: 1024, height: 1024, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
    })
      .composite([
        {
          input: await sharp(SRC).resize(860, 860, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toBuffer(),
          gravity: "center",
        },
      ])
      .png()
      .toFile(path.join(assetsDir, "icon.png"))
      .then(() => console.log("[icons] assets/icon.png (android source)"))
  );

  // آیکن نوتیفیکیشن اندروید — K سفید روی زمینه شفاف (سیستم خودش رنگش می کند)
  // سایزهای استاندارد آیکن وضعیت: 24dp بر اساس density
  const notifDensities: Array<[string, number]> = [
    ["drawable-mdpi", 24],
    ["drawable-hdpi", 36],
    ["drawable-xhdpi", 48],
    ["drawable-xxhdpi", 72],
    ["drawable-xxxhdpi", 96],
  ];
  for (const [dir, size] of notifDensities) {
    const outDir = path.join(process.cwd(), "android", "app", "src", "main", "res", dir);
    fs.mkdirSync(outDir, { recursive: true });
    tasks.push(
      sharp(await renderK(size * 4, "#ffffff", 0.92))
        .resize(size, size)
        .png()
        .toFile(path.join(outDir, "ic_stat_kandoo.png"))
        .then(() => console.log(`[icons] ${dir}/ic_stat_kandoo.png`))
    );
  }

  await Promise.all(tasks);
  console.log("[icons] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
