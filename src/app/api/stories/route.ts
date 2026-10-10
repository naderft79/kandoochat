// API استوری: دریافت لیست استوری های فعال + آپلود استوری جدید
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { sanitizeString } from "@/lib/sanitize";

// GET — لیست استوری های فعال (خود کاربر + پروفایل ها)
export async function GET() {
  try {
    const user = await requireUser();
    const now = new Date();

    // استوری های خود کاربر (بدون فیلتر isApproved — کاربر استوری های خودش را می بیند)
    const myStories = await prisma.story.findMany({
      where: { userId: user.id, expiresAt: { gt: now }, isDeletedByUser: false },
      orderBy: { createdAt: "asc" },
      include: {
        views: { select: { viewerId: true, createdAt: true } },
        likes: { select: { userId: true } },
      },
    });

    // استوری های کاربران — فقط استوری های تایید شده
    const otherStories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
        isApproved: true,
        isDeletedByUser: false,
        user: {
          role: "USER",
          isActive: true,
          gender: user.gender === "MALE" ? "FEMALE" : "MALE",
          id: { not: user.id },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true, firstName: true, username: true, isVerified: true,
            goldenStoryExpiresAt: true,
            photos: { select: { url: true, order: true, isProfile: true }, where: { isVerified: true, isRejected: false, isDeletedByUser: false }, orderBy: { order: "asc" }, take: 1 },
          },
        },
        views: { where: { viewerId: user.id }, select: { viewerId: true } },
        likes: { where: { userId: user.id }, select: { userId: true } },
        _count: { select: { likes: true } },
      },
      take: 200,
    });

    // گروه بندی استوری ها بر اساس کاربر
    const userMap = new Map<string, {
      userId: string; firstName: string; username: string; isVerified: boolean; photo: string | null; isGolden: boolean;
      stories: { id: string; url: string; type: string; caption: string | null; createdAt: string; viewed: boolean; liked: boolean; likeCount: number }[];
    }>();

    for (const s of otherStories) {
      const existing = userMap.get(s.user.id);
      const storyItem = {
        id: s.id, url: s.url, type: s.type, caption: s.caption,
        elements: s.elements, filter: s.filter,
        createdAt: s.createdAt.toISOString(),
        viewed: s.views.length > 0, liked: s.likes.length > 0,
        likeCount: s._count.likes,
      };
      if (existing) {
        existing.stories.push(storyItem);
      } else {
        const isGolden = s.user.goldenStoryExpiresAt && new Date(s.user.goldenStoryExpiresAt) > now;
        userMap.set(s.user.id, {
          userId: s.user.id, firstName: s.user.firstName, username: s.user.username,
          isVerified: s.user.isVerified, photo: s.user.photos?.[0]?.url ?? null,
          isGolden: !!isGolden,
          stories: [storyItem],
        });
      }
    }

    const myIsGolden = user.goldenStoryExpiresAt && new Date(user.goldenStoryExpiresAt) > now;

    return NextResponse.json({
      myStories: myStories.map((s) => ({
        id: s.id, url: s.url, type: s.type, caption: s.caption,
        elements: s.elements, filter: s.filter,
        isApproved: s.isApproved,
        createdAt: s.createdAt.toISOString(), viewCount: s.views.length, likeCount: s.likes.length,
      })),
      myIsGolden: !!myIsGolden,
      myGoldenExpiresAt: myIsGolden ? user.goldenStoryExpiresAt : null,
      // همه استوری ها در یک ردیف کنار هم قرار می گیرند — بدون گروه بندی ویژه
      otherStories: Array.from(userMap.values()),
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[stories GET] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

const createSchema = z.object({
  url: z.string().min(1),
  type: z.enum(["IMAGE", "VIDEO"]),
  caption: z.string().max(500).optional(),
  elements: z.string().optional(),
  filter: z.string().optional(),
});

// POST — آپلود استوری جدید
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر" }, { status: 400 });
    }

    // بررسی اینکه آیا استوری در انتظار تایید دارد
    const now = new Date();
    const pendingStory = await prisma.story.findFirst({
      where: {
        userId: user.id,
        isApproved: false,
        expiresAt: { gt: now },
      },
      select: { id: true },
    });

    if (pendingStory) {
      return NextResponse.json(
        { error: "شما یک استوری در انتظار تایید دارید. تا تایید یا رد آن توسط مدیر نمی توانید استوری جدید ارسال کنید." },
        { status: 403 }
      );
    }

    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // ۲۴ ساعت

    const story = await prisma.story.create({
      data: {
        userId: user.id,
        url: parsed.data.url,
        type: parsed.data.type,
        caption: parsed.data.caption ? sanitizeString(parsed.data.caption, 500) : null,
        elements: parsed.data.elements ? sanitizeString(parsed.data.elements, 2000) : null,
        filter: parsed.data.filter ? sanitizeString(parsed.data.filter, 100) : null,
        isApproved: false, // نیاز به تایید ادمین
        expiresAt,
      },
    });

    return NextResponse.json({ ok: true, story });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[stories POST] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// DELETE — حذف استوری خود
export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get("id");

    if (!storyId) {
      return NextResponse.json({ error: "شناسه استوری لازم است" }, { status: 400 });
    }

    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story || story.userId !== user.id) {
      return NextResponse.json({ error: "استوری یافت نشد" }, { status: 404 });
    }

    // حذف نرم — علامت گذاری به عنوان حذف شده توسط کاربر
    await prisma.story.update({ where: { id: storyId }, data: { isDeletedByUser: true } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[stories DELETE] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
