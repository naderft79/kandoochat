// تولید آیکون های اپ «مدیریت کندو» — زمینه مشکی + K طلایی (برعکس لوگوی کاربر)
// خروجی: android/app/src/admin/res/mipmap-* (اورراید فلیور admin روی main)
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { renderK, FONT_PATH, GOLD_GRADIENT_DEFS, GOLD_FILL } from "./lib/k-glyph";

const RES_DIR = path.join(process.cwd(), "android", "app", "src", "admin", "res");

// سایز آیکون لانچر و لایه های adaptive در هر density (px)
const LAUNCHER: Array<[string, number]> = [
  ["mipmap-ldpi", 36],
  ["mipmap-mdpi", 48],
  ["mipmap-hdpi", 72],
  ["mipmap-xhdpi", 96],
  ["mipmap-xxhdpi", 144],
  ["mipmap-xxxhdpi", 192],
];
const LAYER: Array<[string, number]> = [
  ["mipmap-ldpi", 81],
  ["mipmap-mdpi", 108],
  ["mipmap-hdpi", 162],
  ["mipmap-xhdpi", 216],
  ["mipmap-xxhdpi", 324],
  ["mipmap-xxxhdpi", 432],
];

const ADAPTIVE_XML = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background>
        <inset android:drawable="@mipmap/ic_launcher_background" android:inset="16.7%" />
    </background>
    <foreground>
        <inset android:drawable="@mipmap/ic_launcher_foreground" android:inset="16.7%" />
    </foreground>
</adaptive-icon>`;

async function main() {
  if (!fs.existsSync(FONT_PATH)) {
    console.error(`[admin-icons] font not found: ${FONT_PATH}`);
    process.exit(1);
  }

  const tasks: Promise<unknown>[] = [];

  // آیکون legacy مربعی و گرد: K طلایی روی زمینه مشکی
  for (const [dir, size] of LAUNCHER) {
    const outDir = path.join(RES_DIR, dir);
    fs.mkdirSync(outDir, { recursive: true });
    const bg = sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
    });
    const k = await renderK(size, GOLD_FILL, 0.7, GOLD_GRADIENT_DEFS);
    const square = bg.clone().composite([{ input: k, gravity: "center" }]).png();
    tasks.push(
      square.toFile(path.join(outDir, "ic_launcher.png")).then(() => console.log(`[admin-icons] ${dir}/ic_launcher.png`))
    );
    const roundBg = sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).composite([
      {
        input: await sharp({
          create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
        })
          .composite([{ input: k, gravity: "center" }])
          .png()
          .toBuffer(),
      },
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#000"/></svg>`
        ),
        blend: "dest-in",
      },
    ]);
    tasks.push(
      roundBg.png().toFile(path.join(outDir, "ic_launcher_round.png")).then(() => console.log(`[admin-icons] ${dir}/ic_launcher_round.png`))
    );
  }

  // لایه های adaptive: پس زمینه مشکی یکدست + پیش زمینه K طلایی شفاف
  for (const [dir, size] of LAYER) {
    const outDir = path.join(RES_DIR, dir);
    fs.mkdirSync(outDir, { recursive: true });
    tasks.push(
      sharp({
        create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } },
      })
        .png()
        .toFile(path.join(outDir, "ic_launcher_background.png"))
        .then(() => console.log(`[admin-icons] ${dir}/ic_launcher_background.png`))
    );
    tasks.push(
      renderK(size, GOLD_FILL, 0.55, GOLD_GRADIENT_DEFS)
        .then((k) => sharp(k).toFile(path.join(outDir, "ic_launcher_foreground.png")))
        .then(() => console.log(`[admin-icons] ${dir}/ic_launcher_foreground.png`))
    );
  }

  // لوگوی وب برای صفحه ورود مدیریت — K طلایی روی زمینه شفاف
  tasks.push(
    renderK(512, GOLD_FILL, 0.7, GOLD_GRADIENT_DEFS)
      .then((k) => sharp(k).toFile(path.join(process.cwd(), "public", "admin-logo.png")))
      .then(() => console.log("[admin-icons] public/admin-logo.png"))
  );

  // xml های adaptive-icon (یکسان برای لانچر مربع و گرد)
  const anydpi = path.join(RES_DIR, "mipmap-anydpi-v26");
  fs.mkdirSync(anydpi, { recursive: true });
  fs.writeFileSync(path.join(anydpi, "ic_launcher.xml"), ADAPTIVE_XML);
  fs.writeFileSync(path.join(anydpi, "ic_launcher_round.xml"), ADAPTIVE_XML);
  console.log("[admin-icons] mipmap-anydpi-v26 xml");

  await Promise.all(tasks);
  console.log("[admin-icons] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
