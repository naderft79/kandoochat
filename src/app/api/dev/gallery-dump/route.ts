// API دیباگ — ذخیره عکس های گالری گوشی روی دسکتاپ سیستم (فقط development)
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

const MAX_FILES = 5;
const MAX_SIZE = 15 * 1024 * 1024; // ۱۵ مگابایت برای هر عکس

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  try {
    const { name, base64 } = await request.json();
    if (typeof name !== "string" || typeof base64 !== "string") {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }
    // جلوگیری از path traversal — فقط نام فایل امن
    const safe = path.basename(name).replace(/[^\w.\-آ-ی]/g, "_");
    const buf = Buffer.from(base64, "base64");
    if (buf.length > MAX_SIZE) {
      return NextResponse.json({ error: "too large" }, { status: 413 });
    }

    const dir = path.join(os.homedir(), "Desktop", "KandooGallery");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, safe), buf);
    console.log(`[gallery-dump] saved ${safe} (${buf.length} bytes)`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[gallery-dump] error:", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
