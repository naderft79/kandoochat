// سرو فایل های آپلودی از public/uploads از طریق Node — به این شکل قوانین استاتیک nginx
// (که پسوندهای jpg/png را مستقیم از روت سایت می خوانند) دور زده می شوند و عکس ها همیشه لود می شوند
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  wav: "audio/wav",
};

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("p") ?? "";
  // پاکسازی مسیر — جلوگیری از path traversal و کاراکترهای غیرمجاز
  const safe = raw.replace(/\\/g, "/").replace(/\.\./g, "").replace(/^\/+/, "");
  if (!safe || /[^a-zA-Z0-9\-_./]/.test(safe)) {
    return new NextResponse(null, { status: 400 });
  }

  const filePath = path.join(UPLOADS_DIR, safe);
  if (!filePath.startsWith(UPLOADS_DIR + path.sep)) {
    return new NextResponse(null, { status: 400 });
  }

  const ext = safe.split(".").pop()?.toLowerCase() ?? "";
  const type = MIME[ext];
  if (!type) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const data = await readFile(filePath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
