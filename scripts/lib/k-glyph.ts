// رندر حرف K لوگوی کندو با فونت Grand Hotel — مشترک بین اسکریپت های آیکون
import path from "path";
import fs from "fs";
import sharp from "sharp";
import * as opentype from "opentype.js";

export const FONT_PATH = path.join(process.cwd(), "assets", "grand-hotel.ttf");

// رندر حرف K به PNG — بکگراند شفاف تا روی هر زمینه بنشیند
// fill می تواند رنگ ساده یا url(#g) برای گرادیان تعریف شده در defs باشد
export async function renderK(size: number, fill: string, fillRatio = 0.62, defs = ""): Promise<Buffer> {
  const font = opentype.parse(fs.readFileSync(FONT_PATH).buffer as ArrayBuffer);
  const fontSize = size * fillRatio;
  const probe = font.getPath("K", 0, 0, fontSize);
  const bb = probe.getBoundingBox();
  const dx = (size - (bb.x2 - bb.x1)) / 2 - bb.x1;
  const dy = (size - (bb.y2 - bb.y1)) / 2 - bb.y1;
  const p = font.getPath("K", dx, dy, fontSize);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${defs}<path d="${p.toPathData(2)}" fill="${fill}"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// گرادیان طلایی پنل مدیریت (هماهنگ با --lux-gold در globals.css)
export const GOLD_GRADIENT_DEFS = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d4af37"/><stop offset="0.5" stop-color="#f0d264"/><stop offset="1" stop-color="#d4af37"/></linearGradient></defs>`;
export const GOLD_FILL = "url(#g)";
