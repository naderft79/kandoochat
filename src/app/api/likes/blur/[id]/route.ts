// عکس بلر شده فرستنده لایک — فقط برای کاربر رایگان و فقط لایک هایی که به خودش مربوط است
// بلر سمت سرور با پیکسلی شدن واقعی انجام می شود و قابل بازیابی نیست
import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/finance";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const premium = await hasActiveSubscription(user.id);
    if (premium) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

    const { id } = await params;
    const like = await prisma.like.findUnique({
      where: { id },
      select: {
        receiverId: true,
        sender: {
          select: {
            photos: {
              where: { isRejected: false, isDeletedByUser: false },
              orderBy: [{ isProfile: "desc" }, { order: "asc" }],
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });
    if (!like || like.receiverId !== user.id) {
      return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
    }
    const photoUrl = like.sender.photos[0]?.url;
    if (!photoUrl) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

    let buf: Buffer;
    if (photoUrl.startsWith("/uploads/")) {
      buf = await readFile(path.join(process.cwd(), "public", photoUrl));
    } else {
      const res = await fetch(photoUrl);
      if (!res.ok) throw new Error("fetch failed");
      buf = Buffer.from(await res.arrayBuffer());
    }

    // کوچک کردن به ۲۴ پیکسل و برگرداندن — موزاییکی واقعی و غیرقابل بازگشت
    const out = await sharp(buf)
      .resize(24, 24, { fit: "cover" })
      .resize(300, 300, { kernel: "nearest" })
      .blur(3)
      .webp({ quality: 60 })
      .toBuffer();

    return new Response(new Uint8Array(out), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[likes/blur] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
