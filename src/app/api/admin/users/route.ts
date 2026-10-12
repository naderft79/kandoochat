// API مدیریت کاربران توسط مدیر (تایید، مسدودسازی، شارژ سکه، ریست رمز) + صفحه بندی لیست کاربران
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError, isProtectedRoot, ROOT_LOCKED_MESSAGE } from "@/lib/auth";
import { ensureWallet } from "@/lib/finance";
import { getSetting } from "@/lib/settings";
import { logAction } from "@/lib/audit";
import { canViewIp } from "@/lib/permissions";
import { lookupCountry } from "@/lib/geo";
import { softDeleteUser, restoreUser, DeleteUserError } from "@/lib/user-deletion";
import { getUserStatsMap } from "@/lib/user-stats";

const actionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum([
    "verifyPhone", "unverifyPhone",

    "activate", "deactivate",
    "makeSpecial", "unmakeSpecial",
    "adjustCoins",
    "resetPassword",
    "changePhone",
    "editProfile",
    "messageLock", "messageUnlock",
    "toggleFake",
    "setRole",
    "deleteUser",
    "restoreUser",
  ]),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN", "CONTENT_ADMIN", "SUPPORT_ADMIN"]).optional(),
  reason: z.string().min(3).max(300).optional(),
  coins: z.coerce.number().int().min(-100_000).max(100_000).optional(),
  phone: z.string().min(10).max(15).optional(),
  profile: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    username: z.string().min(1),
    phone: z.string().min(10).max(15),
    gender: z.enum(["MALE", "FEMALE"]),
    age: z.coerce.number().int().min(18).max(99),
    height: z.coerce.number().int().min(100).max(250),
    weight: z.coerce.number().int().min(30).max(300),
    income: z.coerce.number().int().min(0),
    province: z.string().min(1),
    city: z.string().min(1),
    neighborhood: z.string().nullable().optional(),
    job: z.string().nullable().optional(),
    carModel: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
  }).optional(),
  lockDays: z.coerce.number().int().min(1).max(365).optional(),
  lockReason: z.string().min(1).max(500).optional(),
});

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() ?? "";
    const gender = searchParams.get("gender") ?? "";
    const province = searchParams.get("province") ?? "";
    const city = searchParams.get("city") ?? "";
    const verified = searchParams.get("verified") ?? "";
    const active = searchParams.get("active") ?? "";
    const tab = searchParams.get("tab") ?? "overview";
    const deletedOnly = searchParams.get("deleted") === "true";
    const skip = parseInt(searchParams.get("skip") ?? "0", 10);
    const take = parseInt(searchParams.get("take") ?? "100", 10);

    // با admins=true فقط حساب های ادمین نمایش داده می شوند (مدیریت نقش ها)
    const adminsOnly = searchParams.get("admins") === "true";
    const where: Record<string, unknown> = adminsOnly
      ? { role: { in: ["ADMIN", "SUPER_ADMIN", "CONTENT_ADMIN", "SUPPORT_ADMIN"] } }
      : { role: "USER" };
    // کاربران حذف شده به صورت پیش فرض پنهان هستند و فقط با فیلتر مخصوص دیده می شوند
    where.deletedAt = deletedOnly ? { not: null } : null;

    if (search) {
      const q = search.toLowerCase();
      where.OR = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { username: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    if (gender) where.gender = gender;
    if (province) where.province = province;
    if (city) where.city = city;

    if (verified === "verified") where.isVerified = true;
    if (verified === "unverified") where.isVerified = false;

    if (active === "active") where.isActive = true;
    if (active === "blocked") where.isActive = false;

    let orderBy: Prisma.UserOrderByWithRelationInput[] = [{ createdAt: "desc" }];
    switch (tab) {
      case "overview":
        orderBy = [{ createdAt: "desc" }];
        break;
      case "messageLocked":
        where.messageLockUntil = { gt: new Date() };
        break;
      case "blocked":
        where.isActive = false;
        break;
      case "special":
        where.isSpecial = true;
        break;
      case "verified":
        where.isVerified = true;
        break;
      case "female":
        where.gender = "FEMALE";
        break;
      case "male":
        where.gender = "MALE";
        break;
      case "subscribed":
        where.subscriptions = { some: { endsAt: { gt: new Date() } } };
        break;
      case "unsubscribed":
        where.subscriptions = { none: { endsAt: { gt: new Date() } } };
        break;
      case "mostCoins":
        orderBy = [{ wallet: { balance: "desc" } }];
        break;
      case "leastCoins":
        orderBy = [{ wallet: { balance: "asc" } }];
        break;
      case "fake":
        where.isFake = true;
        break;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          wallet: true,
          photos: { select: { id: true, url: true, isProfile: true }, where: { isDeletedByUser: false }, orderBy: { order: "asc" } },
          subscriptions: { where: { endsAt: { gt: new Date() } }, take: 1 },
        },
        orderBy,
        skip: Number.isNaN(skip) ? 0 : Math.max(0, skip),
        take: Number.isNaN(take) ? 100 : Math.min(200, Math.max(1, take)),
      }),
      prisma.user.count({ where }),
    ]);

    const statsMap = await getUserStatsMap(users.map((u) => u.id));
    const serialized = users.map(({ password: _password, ...u }) => ({
      ...u,
      messageLockUntil: u.messageLockUntil ? u.messageLockUntil.toISOString() : null,
      hasSubscription: u.subscriptions.length > 0,
      subscription: u.subscriptions[0]
        ? { startsAt: u.subscriptions[0].startsAt.toISOString(), endsAt: u.subscriptions[0].endsAt.toISOString() }
        : null,
      createdAt: u.createdAt.toISOString(),
      lastIpAt: u.lastIpAt ? u.lastIpAt.toISOString() : null,
      lastIp: canViewIp(admin.role) ? u.lastIp : null,
      lastCountry: lookupCountry(u.lastIp),
      deletedAt: u.deletedAt ? u.deletedAt.toISOString() : null,
      deletePurgeAfter: u.deletePurgeAfter ? u.deletePurgeAfter.toISOString() : null,
      stats: statsMap[u.id],
    }));

    return NextResponse.json({ users: serialized, total, hasMore: skip + serialized.length < total });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    console.error("[admin/users] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 400 });
    }
    const { userId, action, coins, phone, profile, lockDays, lockReason, role, reason } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    // حساب ریشه: یوزرنیم، موبایل و رمز آن به هیچ وجه تغییر نمی کند و حساب غیرفعال/حذف نمی شود
    const ROOT_ACTIONS_BLOCKED = new Set(["resetPassword", "changePhone", "editProfile", "deactivate", "deleteUser", "setRole"]);
    if (isProtectedRoot(user) && ROOT_ACTIONS_BLOCKED.has(action)) {
      return NextResponse.json({ error: ROOT_LOCKED_MESSAGE }, { status: 403 });
    }

    switch (action) {
      case "verifyPhone":
        await prisma.user.update({ where: { id: userId }, data: { phoneVerified: true } });
        await logAction(admin.id, "VERIFY_PHONE", "USER", userId);
        break;
      case "unverifyPhone":
        await prisma.user.update({ where: { id: userId }, data: { phoneVerified: false } });
        await logAction(admin.id, "UNVERIFY_PHONE", "USER", userId);
        break;
      case "activate":
        await prisma.user.update({ where: { id: userId }, data: { isActive: true } });
        await logAction(admin.id, "ACTIVATE", "USER", userId);
        break;
      case "deactivate":
        await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
        await logAction(admin.id, "DEACTIVATE", "USER", userId);
        break;
      case "makeSpecial":
        await prisma.user.update({ where: { id: userId }, data: { isSpecial: true } });
        await logAction(admin.id, "MAKE_SPECIAL", "USER", userId);
        break;
      case "unmakeSpecial":
        await prisma.user.update({ where: { id: userId }, data: { isSpecial: false } });
        await logAction(admin.id, "UNMAKE_SPECIAL", "USER", userId);
        break;
      case "adjustCoins": {
        if (!coins || coins === 0) {
          return NextResponse.json({ error: "مقدار سکه نامعتبر" }, { status: 400 });
        }
        const wallet = await ensureWallet(userId);
        if (wallet.balance + coins < 0) {
          return NextResponse.json({ error: "موجودی کاربر منفی می شود" }, { status: 400 });
        }
        const coinValue = await getSetting("COIN_VALUE");
        await prisma.$transaction([
          prisma.wallet.update({
            where: { userId },
            data: { balance: { increment: coins } },
          }),
          prisma.transaction.create({
            data: {
              userId,
              type: "ADMIN_ADJUST",
              coins,
              amountToman: Math.abs(coins) * coinValue,
              status: "COMPLETED",
              description: coins > 0 ? "شارژ سکه توسط مدیر" : "کسر سکه توسط مدیر",
            },
          }),
        ]);
        await logAction(admin.id, "ADJUST_COINS", "USER", userId, `${coins} coins`);
        break;
      }
      case "resetPassword": {
        // تولید رمز موقت ۶ رقمی — رمز کاربر همیشه عددی و ۵ تا ۷ رقم است
        const tempPassword = String(Math.floor(100000 + Math.random() * 900000));
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        await prisma.user.update({
          where: { id: userId },
          data: { password: hashedPassword, passwordChangedAt: new Date() },
        });
        console.log(`[admin] ${admin.id} reset password for user ${userId}`);
        await logAction(admin.id, "RESET_PASSWORD", "USER", userId);
        return NextResponse.json({ ok: true, tempPassword });
      }
      case "changePhone": {
        if (!phone) {
          return NextResponse.json({ error: "شماره موبایل لازم است" }, { status: 400 });
        }
        // بررسی تکراری نبودن شماره
        const existingPhone = await prisma.user.findUnique({ where: { phone } });
        if (existingPhone && existingPhone.id !== userId) {
          return NextResponse.json({ error: "این شماره قبلا ثبت شده است" }, { status: 400 });
        }
        const oldPhone = user.phone;
        await prisma.user.update({
          where: { id: userId },
          data: { phone, phoneVerified: false },
        });
        console.log(`[admin] ${admin.id} changed phone for user ${userId}: ${oldPhone} -> ${phone}`);
        await logAction(admin.id, "CHANGE_PHONE", "USER", userId, `${oldPhone} -> ${phone}`);
        return NextResponse.json({ ok: true, oldPhone, newPhone: phone });
      }
      case "editProfile": {
        if (!profile) {
          return NextResponse.json({ error: "داده پروفایل لازم است" }, { status: 400 });
        }
        // بررسی تکراری نبودن یوزرنیم
        const existingUsername = await prisma.user.findUnique({ where: { username: profile.username } });
        if (existingUsername && existingUsername.id !== userId) {
          return NextResponse.json({ error: "این یوزرنیم قبلا ثبت شده است" }, { status: 400 });
        }
        // بررسی تکراری نبودن شماره
        const existingPhone = await prisma.user.findUnique({ where: { phone: profile.phone } });
        if (existingPhone && existingPhone.id !== userId) {
          return NextResponse.json({ error: "این شماره قبلا ثبت شده است" }, { status: 400 });
        }
        await prisma.user.update({
          where: { id: userId },
          data: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            username: profile.username,
            phone: profile.phone,
            gender: profile.gender,
            age: profile.age,
            height: profile.height,
            weight: profile.weight,
            income: profile.income,
            province: profile.province,
            city: profile.city,
            neighborhood: profile.neighborhood ?? null,
            job: profile.job ?? null,
            carModel: profile.carModel ?? null,
            bio: profile.bio ?? null,
          },
        });
        console.log(`[admin] ${admin.id} edited profile for user ${userId}`);
        await logAction(admin.id, "EDIT_PROFILE", "USER", userId);
        return NextResponse.json({ ok: true });
      }
      case "messageLock": {
        if (!lockDays || !lockReason) {
          return NextResponse.json({ error: "مدت و دلیل قفل لازم است" }, { status: 400 });
        }
        const lockUntil = new Date();
        lockUntil.setDate(lockUntil.getDate() + lockDays);
        lockUntil.setHours(23, 59, 59, 999);
        await prisma.user.update({
          where: { id: userId },
          data: { messageLockUntil: lockUntil, messageLockReason: lockReason },
        });
        console.log(`[admin] ${admin.id} locked messaging for user ${userId} until ${lockUntil.toISOString()}`);
        await logAction(admin.id, "MESSAGE_LOCK", "USER", userId, `${lockDays} days: ${lockReason}`);
        return NextResponse.json({ ok: true });
      }
      case "messageUnlock": {
        await prisma.user.update({
          where: { id: userId },
          data: { messageLockUntil: null, messageLockReason: null },
        });
        console.log(`[admin] ${admin.id} unlocked messaging for user ${userId}`);
        await logAction(admin.id, "MESSAGE_UNLOCK", "USER", userId);
        return NextResponse.json({ ok: true });
      }
      case "toggleFake": {
        const newFake = !user.isFake;
        await prisma.user.update({
          where: { id: userId },
          data: { isFake: newFake },
        });
        console.log(`[admin] ${admin.id} toggled fake status for user ${userId}: ${newFake}`);
        await logAction(admin.id, "TOGGLE_FAKE", "USER", userId, `isFake=${newFake}`);
        return NextResponse.json({ ok: true, isFake: newFake });
      }
      case "setRole": {
        // فقط سوپر ادمین می تواند نقش کاربران را تغییر دهد
        if (admin.role !== "SUPER_ADMIN") {
          return NextResponse.json({ error: "فقط سوپر ادمین مجاز است" }, { status: 403 });
        }
        if (!role) {
          return NextResponse.json({ error: "نقش نامعتبر" }, { status: 400 });
        }
        // جلوگیری از تغییر نقش خود و قفل شدن دسترسی
        if (userId === admin.id) {
          return NextResponse.json({ error: "نمی توانید نقش خود را تغییر دهید" }, { status: 400 });
        }
        const oldRole = user.role;
        await prisma.user.update({ where: { id: userId }, data: { role } });
        console.log(`[admin] ${admin.id} changed role of user ${userId}: ${oldRole} -> ${role}`);
        await logAction(admin.id, "SET_ROLE", "USER", userId, `${oldRole} -> ${role}`);
        return NextResponse.json({ ok: true, role });
      }
      case "deleteUser": {
        // فقط سوپر ادمین و با دلیل اجباری؛ حذف نرم با ۳۰ روز مهلت بازیابی
        if (admin.role !== "SUPER_ADMIN") {
          return NextResponse.json({ error: "فقط سوپر ادمین مجاز است" }, { status: 403 });
        }
        if (!reason) {
          return NextResponse.json({ error: "ثبت دلیل حذف الزامی است" }, { status: 400 });
        }
        if (userId === admin.id) {
          return NextResponse.json({ error: "نمی توانید حساب خود را حذف کنید" }, { status: 400 });
        }
        try {
          await softDeleteUser(admin.id, userId, reason);
        } catch (e) {
          if (e instanceof DeleteUserError) {
            const msg = ({ NOT_FOUND: "کاربر یافت نشد", ALREADY_DELETED: "کاربر قبلاً حذف شده است", IS_ADMIN: "حساب مدیر را نمی توان حذف کرد" } as Record<string, string>)[e.code] ?? "خطا";
            return NextResponse.json({ error: msg }, { status: 400 });
          }
          throw e;
        }
        console.log(`[admin] ${admin.id} soft-deleted user ${userId}`);
        await logAction(admin.id, "DELETE_USER", "USER", userId, reason.slice(0, 200));
        return NextResponse.json({ ok: true });
      }
      case "restoreUser": {
        if (admin.role !== "SUPER_ADMIN") {
          return NextResponse.json({ error: "فقط سوپر ادمین مجاز است" }, { status: 403 });
        }
        try {
          await restoreUser(userId);
        } catch (e) {
          if (e instanceof DeleteUserError) {
            const msg = ({ NOT_DELETED: "کاربر حذف شده نیست", RESTORE_EXPIRED: "مهلت بازیابی تمام شده است", IDENTITY_CONFLICT: "شماره یا نام کاربری توسط حساب دیگری گرفته شده است" } as Record<string, string>)[e.code] ?? "خطا";
            return NextResponse.json({ error: msg }, { status: 400 });
          }
          throw e;
        }
        console.log(`[admin] ${admin.id} restored user ${userId}`);
        await logAction(admin.id, "RESTORE_USER", "USER", userId);
        return NextResponse.json({ ok: true });
      }
    }

    console.log(`[admin] ${admin.id} performed ${action} on user ${userId}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    console.error("[admin/users] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
