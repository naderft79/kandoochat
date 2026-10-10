// API تست اعلان ها — ارسال اعلان آزمایشی برای همه کاربران (فقط مدیر)
// اعلان و توست هرگز برای کاربران مدیر ارسال نمی شود
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, ADMIN_ROLES, AuthError } from "@/lib/auth";

// از نام واقعی فرستنده در متن استفاده می شود
type Preset = {
  title: string;
  body: (senderName: string) => string;
  // آیا data اعلان به شناسه فرستنده نیاز دارد (برای دکمه گفتگو)
  senderKey?: "senderId" | "matchUserId";
  extra?: Record<string, unknown>;
};

const PRESETS: Record<string, Preset> = {
  LIKE: {
    title: "لایک جدید",
    body: (n) => `${n} از شما خوشش آمده و پروفایل شما را لایک کرده — میخواید گفتگو رو شروع کنید؟`,
    senderKey: "senderId",
  },
  SUPER_LIKE: {
    title: "سوپر لایک جدید",
    body: (n) => `${n} شما را سوپر لایک کرد — میخواید گفتگو رو شروع کنید؟`,
    senderKey: "senderId",
  },
  MATCH: {
    title: "مچ جدید!",
    body: (n) => `شما و ${n} همدیگر را لایک کردید`,
    senderKey: "matchUserId",
  },
  PROFILE_VIEW: {
    title: "بازدید جدید پروفایل",
    body: (n) => `${n} پروفایل شما را مشاهده کرد`,
  },
  GIFT_RECEIVED: {
    title: "هدیه سکه دریافتی",
    body: (n) => `${n} ۱۰۰ سکه به شما هدیه داد`,
    senderKey: "senderId",
    extra: { coins: 100 },
  },
  REQUEST_RECEIVED: {
    title: "درخواست سکه",
    body: (n) => `${n} از شما ۵۰ سکه درخواست کرد`,
  },
  REQUEST_APPROVED: {
    title: "درخواست سکه تایید شد",
    body: () => "درخواست ۵۰ سکه شما تایید شد",
  },
  REQUEST_REJECTED: {
    title: "درخواست سکه رد شد",
    body: () => "درخواست ۵۰ سکه شما رد شد",
  },
  COIN_PURCHASE: {
    title: "سکه خریداری شد",
    body: () => "۵۰۰ سکه با موفقیت به کیف پول شما اضافه شد",
    extra: { link: "/dashboard/coins" },
  },
  SUBSCRIPTION_PURCHASED: {
    title: "اشتراک فعال شد",
    body: () => "اشتراک ماهانه شما با موفقیت فعال شد و تا سی روز آینده معتبر است",
    extra: { link: "/dashboard/subscription" },
  },
  SUBSCRIPTION_ENDING: {
    title: "اشتراک رو به اتمام",
    body: () => "فقط ۳ روز از اشتراک شما باقی مانده — برای قطع نشدن گفتگوها تمدید کنید",
  },
  BOOST_ACTIVATED: {
    title: "بوست فعال شد",
    body: () => "پروفایل شما تا ۳۰ دقیقه در صدر نتایج قرار دارد",
  },
  GOLDEN_STORY: {
    title: "استوری طلایی فعال شد",
    body: () => "استوری شما به عنوان استوری طلایی فعال شد و تا ۲۴ ساعت آینده با رینگ طلایی نمایش داده می شود",
  },
  FEATURED_PENDING: {
    title: "درخواست بخش ویژه ثبت شد",
    body: () => "درخواست شما در لیست انتظار است و پس از تایید مدیر در بخش ویژه نمایش داده می شود",
  },
  FEATURED_APPROVED: {
    title: "شما در بخش ویژه قرار گرفتید",
    body: () => "درخواست شما تایید شد و پروفایل شما اکنون در بخش ویژه نمایش داده می شود",
  },
  FEATURED_REJECTED: {
    title: "درخواست بخش ویژه رد شد",
    body: () => "سکه پرداختی شما به کیف پول بازگردانده شد",
  },
  VERIFY_BADGE: {
    title: "تیک آبی شما تایید شد",
    body: () => "پروفایل شما با موفقیت احراز شد. تیک آبی از این پس روی پروفایل شما نمایش داده می شود.",
    extra: { status: "APPROVED" },
  },
  VERIFY_IDENTITY: {
    title: "احراز هویت شما تایید شد",
    body: () => "هویت شما با موفقیت تایید شد. از این پس امکان برداشت برای شما فعال است.",
    extra: { status: "APPROVED" },
  },
  STREAK_REWARD: {
    title: "پاداش استریک",
    body: () => "شما ۵ سکه پاداش ۷ روز استریک دریافت کردید",
  },
  REFERRAL_REWARD: {
    title: "دعوت جدید",
    body: (n) => `${n} با کد دعوت شما ثبت نام کرد. پاداش بعد از فعالیت او برای هر دو نفر آزاد می شود`,
  },
  ADMIN_BROADCAST: {
    title: "پیام مدیریت",
    body: () => "این یک اعلان آزمایشی از طرف مدیریت کندو است",
  },
};

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "فقط مدیر دسترسی دارد" }, { status: 403 });
    }
    const { type, status } = await request.json().catch(() => ({}));

    if (typeof type !== "string") {
      return NextResponse.json({ error: "نوع اعلان نامعتبر است" }, { status: 400 });
    }

    // وضعیت تایید/رد برای اعلان های احراز — توسط کلاینت به صورت type:status می آید
    const preset = PRESETS[type];
    if (!preset) {
      return NextResponse.json({ error: "نوع اعلان نامعتبر است" }, { status: 400 });
    }

    // فرستنده نمایشی برای اعلان های مرتبط با کاربر دیگر — خود مدیر تست کننده
    const sender =
      preset.senderKey || preset.body.length > 0
        ? { id: user.id, firstName: user.firstName }
        : null;
    const senderName = sender?.firstName ?? "کاربر";

    const data = JSON.stringify({
      ...(preset.senderKey && sender ? { [preset.senderKey]: sender.id } : {}),
      ...(preset.extra ?? {}),
      ...(status ? { status } : {}),
    });

    const base = {
      type,
      title: type === "VERIFY_IDENTITY" && status === "REJECTED"
        ? "درخواست احراز هویت رد شد"
        : type === "VERIFY_BADGE" && status === "REJECTED"
          ? "درخواست تیک آبی رد شد"
          : preset.title,
      body: status === "REJECTED" && type.startsWith("VERIFY")
        ? "متاسفانه درخواست شما تایید نشد. لطفا مدارک باکیفیت تر و دقیق تر ارسال کنید."
        : preset.body(senderName),
      data,
    };

    // اعلان برای همه کاربران فعال غیرمدیر — هر create باعث رویداد زنده SSE می شود
    const users = await prisma.user.findMany({
      where: { isActive: true, role: { notIn: [...ADMIN_ROLES] } },
      select: { id: true },
    });
    await prisma.$transaction(
      users.map((u) => prisma.notification.create({ data: { ...base, userId: u.id } }))
    );
    return NextResponse.json({ ok: true, sent: users.length });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[test-notifications] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// پاک کردن اعلان های همه کاربران — فقط مدیر
export async function DELETE() {
  try {
    const user = await requireUser();
    if (!ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "فقط مدیر دسترسی دارد" }, { status: 403 });
    }

    const res = await prisma.notification.deleteMany({});
    return NextResponse.json({ ok: true, deleted: res.count });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
    console.error("[test-notifications DELETE] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
