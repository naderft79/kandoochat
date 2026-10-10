// API مدیریت کاربران فیک — لیست، افزودن، ویرایش، حذف، تولید خودکار
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";

// GET — لیست کاربران فیک
export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const where: Record<string, unknown> = { isFake: true };
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { username: { contains: search } },
      { city: { contains: search } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        gender: true,
        age: true,
        city: true,
        province: true,
        bio: true,
        isActive: true,
        isVerified: true,
        job: true,
        photos: { select: { id: true, url: true, isProfile: true }, where: { isDeletedByUser: false }, take: 3 },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  // آمار هر فیک
  const usersWithStats = await Promise.all(
    users.map(async (u) => {
      const [msgSent, likesSent, giftsSent, matches] = await Promise.all([
        prisma.botLog.count({ where: { senderId: u.id, botType: "MESSAGE", status: "SENT" } }),
        prisma.botLog.count({ where: { senderId: u.id, botType: "LIKE", status: "SENT" } }),
        prisma.botLog.count({ where: { senderId: u.id, botType: "GIFT", status: "SENT" } }),
        prisma.botLog.count({ where: { senderId: u.id, botType: "MATCH", status: "SENT" } }),
      ]);
      return { ...u, stats: { msgSent, likesSent, giftsSent, matches } };
    })
  );

  return NextResponse.json({
    users: usersWithStats,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// POST — افزودن یا تولید خودکار کاربر فیک
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const body = await request.json();
  const { action } = body;

  if (action === "generate") {
    return await generateFakeUsers(body.count || 1);
  }

  // افزودن دستی
  const { firstName, lastName, gender, age, city, province, bio, job, username, password } = body;

  if (!firstName || !gender || !age || !city) {
    return NextResponse.json({ error: "نام، جنسیت، سن و شهر الزامی است" }, { status: 400 });
  }

  const fakeUser = await prisma.user.create({
    data: {
      firstName,
      lastName: lastName || "فیک",
      username: username || `fake_${Date.now()}`,
      password: password || "fake_pass_123",
      phone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
      gender,
      age: parseInt(age, 10),
      city,
      province: province || city,
      height: 170 + Math.floor(Math.random() * 20),
      weight: 60 + Math.floor(Math.random() * 20),
      income: 0,
      bio: bio || "",
      job: job || null,
      isFake: true,
      isActive: true,
      isVerified: Math.random() > 0.5,
    },
  });

  return NextResponse.json({ user: fakeUser });
}

// PUT — ویرایش کاربر فیک
export async function PUT(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const body = await request.json();
  const { id, firstName, lastName, bio, job, city, province, age, isActive, isVerified } = body;

  if (!id) {
    return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (firstName !== undefined) data.firstName = firstName;
  if (lastName !== undefined) data.lastName = lastName;
  if (bio !== undefined) data.bio = bio;
  if (job !== undefined) data.job = job;
  if (city !== undefined) data.city = city;
  if (province !== undefined) data.province = province;
  if (age !== undefined) data.age = parseInt(age, 10);
  if (isActive !== undefined) data.isActive = isActive;
  if (isVerified !== undefined) data.isVerified = isVerified;

  const user = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ user });
}

// DELETE — حذف کاربر فیک
export async function DELETE(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// بانک نام‌های ایرانی برای تولید خودکار
const FIRST_NAMES_MALE = ["علی", "محمد", "حسین", "رضا", "امیر", "سینا", "آرش", "بهراد", "کاوه", "فرزاد"];
const FIRST_NAMES_FEMALE = ["مریم", "زهرا", "نگار", "پریسا", "الهام", "سارا", "نازنین", "آیدا", "شکوفه", "رها"];
const CITIES = ["تهران", "اصفهان", "شیراز", "مشهد", "تبریز", "کرج", "اهواز", "کرمان", "رشت", "قم"];
const JOBS = ["مهندس", "معلم", "پزشک", "طراح", "دانشجو", "کارمند", "حسابدار", "نویسنده", "عکاس", "مدیر"];

// تولید خودکار کاربران فیک
async function generateFakeUsers(count: number) {
  const created = [];
  for (let i = 0; i < count; i++) {
    const isMale = Math.random() > 0.5;
    const firstName = isMale
      ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)]
      : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)];
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const age = 22 + Math.floor(Math.random() * 15);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName: "فیک",
        username: `fake_${Date.now()}_${i}`,
        password: `fake_pass_${Math.random().toString(36).substring(7)}`,
        phone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
        gender: isMale ? "MALE" : "FEMALE",
        age,
        city,
        province: city,
        height: 160 + Math.floor(Math.random() * 30),
        weight: 55 + Math.floor(Math.random() * 25),
        income: 0,
        bio: `سلام، از ${city} هستم، دوست دارم آدم‌های جدید رو بشناسم`,
        job: JOBS[Math.floor(Math.random() * JOBS.length)],
        isFake: true,
        isActive: true,
        isVerified: Math.random() > 0.4,
      },
    });
    created.push(user);
  }

  return NextResponse.json({ created: created.length, users: created });
}
