// ساخت پروفایل های آماده برای همه شهرها — ۲۰ دختر (با عکس پروفایل) و ۲۰ پسر (بدون عکس) برای هر شهر
// اجرا: npx tsx scripts/seed-city-profiles.ts
// idempotent است — اجرای دوباره کاربر تکراری نمی سازد (بر اساس شماره موبایل قطعی 0955xxxxxxx)
import "dotenv/config";
import { readdirSync } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PROVINCES } from "../src/lib/iran";

const PHOTOS_DIR = path.join(process.cwd(), "public", "uploads", "keyshozorii");
const PER_CITY = 20;
// شماره های قطعی و یکتا برای کاربران seed — 0955 + شماره ۷ رقمی
const phoneFor = (n: number) => `0955${String(n).padStart(7, "0")}`;

// نام های اول فارسی — دختر
const F = [
  "نازنین","سارا","نیلوفر","مریم","زهرا","فاطمه","نگار","شیدا","آتنا","رها",
  "ترانه","پریسا","یاسمین","الناز","سحر","مهرناز","شیوا","درسا","هستی","آیدا",
  "ملیکا","سمیرا","رعنا","بهار","گلناز","مهسا","آرزو","نرگس","شیرین","لیلا",
  "مینا","باران","روزبه","هانیه","ستایش","یلدا","مهرنوش","فرناز","سپیده","نسترن",
  "پرنیا","کاترین","مارال","سودابه","مژده","روشنک","ساناز","بهرام","گیسو","شقایق",
  "آناهیتا","مونا","پارمیس","دلناز","فرشته","نیکا","ویدا","راحله","آرین","شهرزاد",
  "هدیه","الهه","بانو","ماهک","پگاه","تینا","رز","نغمه","فریبا","طناز",
  "لاله","مهرسا","نسیم","گلاره","رکسانا","دیبا","سیلا","مهدیس","نازگل","رزم آرا",
  "آوا","تارا","کیمیا","درنا","مانا","هنا","رایکا","سارینا","میترا","گلشیفته",
  "پروانه","زرین","ماهور","نیلا","پدیده","شبنم","فرزانه","عسل","نگین","هلیا",
  "روناک","سیمین","مرجان","بهناز","بیتا","شهلا","گلرخ","مرضیه","رضوان","اسما",
];

// نام های اول فارسی — پسر
const M = [
  "امیر","رضا","علی","محمد","حسین","مهدی","کیان","آریا","پارسا","نیما",
  "سیاوش","بهرام","فرهاد","کاوه","آرمان","سام","پیمان","بابک","هومن","شروین",
  "دانیال","آرش","مهرداد","بهنام","فراز","رامین","پویا","شایان","علیرضا","حمید",
  "مجید","بهزاد","فرزاد","کامران","سهراب","افشین","اردلان","بردیا","پژمان","رادین",
  "سامان","شاهین","طاها","عرفان","فرشاد","کسری","ماهان","نوید","وحید","یاشار",
  "امید","پدرام","سروش","مسعود","نادر","جواد","رحمان","غلامرضا","اسماعیل","عباس",
  "محمود","جعفر","اکبر","قاسم","حبیب","کرم","داریوش","ایمان","سعید","محسن",
  "وحیدرضا","امین","باقر","مصطفی","حامد","مهدیار","رضوان","توفیق","اسد","یوسف",
  "ابراهیم","داوود","سلیمان","هارون","ایوب","یعقوب","اسحاق","موسی","عادل","بزرگ",
  "شاپور","فرامرز","گودرز","منوچهر","هوشنگ","فریدون","جمشید","اسفندیار","بهروز","کیومرث",
  "رستم","سورن","پیروز","اردشیر","خسرو","انوشیروان","نریمان","بیژن","فرجاد","آرتین",
];

// نام خانوادگی های فارسی
const L = [
  "محمدی","رضایی","حسینی","احمدی","موسوی","کریمی","قاسمی","جعفری","اکبری","نوری",
  "صادقی","شریفی","رحیمی","عباسی","طاهری","یوسفی","اسماعیلی","نصیری","مرادی","شمس",
  "قادری","فرهادی","بهشتی","سلیمانی","امیری","نیکو","خانی","زرگری","پارسایی","افشار",
  "تهرانی","شیرازی","اصفهانی","تبریزی","مشهدی","یزدانی","کرمانی","اهوازی","رشتی","همدانی",
  "اردبیلی","قزوینی","سنندجی","ارومیه","زنجانی","بیرجندی","زاهدانی","بوشهری","بابلی","ساری",
  "گرگانی","اراکی","خرم آبادی","ایلامی","شهرکردی","یاسوجی","سمنانی","بام","جهرمی","فسایی",
  "نجف آبادی","سپاهانی","دزفولی","آبادانی","خوی","مراغه ای","مهابادی","میاندوآبی","نقده ای",
  "پیرانشهری","سردشتی","بنه","اشنویه","تکاب","شاهین دژ","خدابنده","ابهری","خرمدره","طارمی",
  "ماهنشانی","ایجرودی","هیدجی","سلطانیه","قیداری","ابر قوه ای","مهر","مهریزی","بافقی","هراتی",
  "یزدی","تفتی","اردکانی","میبدی","نائینی","کاشانی","آران","بیدگلی","خمینی","محلاتی",
  "دلیجانی","قمی","جعفرآبادی","سلفچگانی","کهک","اشتهاردی","آوجی","بویین زهرا","رازمی","شالی",
];

// حرفه ها — زن
const JOBS_F = [
  "پرستار","معلم","طراح گرافیک","مترجم","مهندس نرم افزار","وکیل","روانشناس","دندانپزشک",
  "داروساز","معمار","حسابدار","مدیر بازاریابی","خیاط","آشپز","زیبایی شناس","مربی ورزش",
  "کارمند بانک","مشاور املاک","عکاس","طراح لباس","دکترای زیست شناسی","پژوهشگر","نویسنده",
  "مدیر منابع انسانی","برنامه نویس","معلم موسیقی","فروشنده","کارمند اداری","پزشک","فیزیوتراپ",
];

// حرفه ها — مرد
const JOBS_M = [
  "مهندس عمران","مهندس برق","برنامه نویس","پزشک","وکیل","حسابدار","مدیر پروژه","مکانیک",
  "راننده کامیون","آشپز","قصاب","بنای ساختمان","تاسیسات کار","کارگر کارخانه","فروشنده",
  "مدیر فروش","مشاور املاک","دندانپزشک","داروساز","معلم","مربی بدنسازی","عکاس","فیلم بردار",
  "تاجر","صاحب فروشگاه","کشاورز","دامدار","باغدار","نجار","آهنگر","برق کار ساختمان",
];

// ماشین ها
const CARS = [
  "پژو ۲۰۶","پژو پارس","سمند","پراید","تیبا","کوییک","ساینا","شاهین","دنا","دنا پلاس",
  "تارا","رانا","گیل","نیسان","مزدا ۳","چری تیگو","کیا سراتو","هیوندای النترا","جک S5","فیدلیتی",
];

// محله ها / مناطق
const HOODS = [
  "سعادت آباد","پاسداران","ونک","جردن","ظفر","میرداماد","قیطریه","نیاوران","فرمانیه","تجریش",
  "زعفرانیه","ولنجک","باغ فردوس","اوین","درکه","محمودیه","اشتیه","دزاشیب","کوی فرهنگیان","شهرک غرب",
  "شهرک اکباتان","فلاح","شادآباد","خانی آباد","نازی آباد","جوادیه","یاخچی آباد","رضاییه","میدان هروی","پارک لاله",
];

// قالب های بیو — حرفه ای و متنوع
const BIOS_F = [
  "به سفر و دیدن جاهای جدید علاقه دارم؛ دنبال یک ارتباط جدی و صمیمی هستم.",
  "آرام و اهل گفتگو؛ کتاب و موسیقی برایم مهم است. به دنبال آشنایی محترمانه هستم.",
  "کارم را دوست دارم و اهل رشد شخصی هستم؛ یک همراه واقعی می خواهم.",
  "خانواده برایم اولویت دارد؛ به دنبال همسری مهربان و مسئولیت پذیر هستم.",
  "ورزش و طبیعت گردی را دوست دارم؛ اهل زندگی سالم و مثبت هستم.",
  "شاد و پرانرژی؛ دوست دارم آدم صادق و با اعتماد به نفس باشد.",
  "آشپزی و مهمانی دادن را دوست دارم؛ به دنبال یک رابطه پایدار هستم.",
  "هنرمند و خلاق؛ از کارم لذت می برم و اهل ساده زیستن هستم.",
  "به رشد خود و زندگی متعادل اهمیت می دهم؛ دنبال همسری جدی هستم.",
  "مهربان و صبور؛ معتقدم احترام پایه هر رابطه ای است.",
];

const BIOS_M = [
  "به کارم علاقه مندم و اهل برنامه ریزی برای آینده هستم؛ دنبال همسری جدی هستم.",
  "مستقل و مسئولیت پذیر؛ ورزش و طبیعت را دوست دارم و به دنبال ارتباط محترمانه هستم.",
  "آرام و خانواده دوست؛ به دنبال یک رابطه پایدار بر اساس اعتماد هستم.",
  "پرکار و هدفمند؛ دوست دارم کنار همسرم آرامش و پیشرفت داشته باشم.",
  "مهربان و صادق؛ معتقدم رابطه خوب با صداقت و گفتگو ساخته می شود.",
  "ورزشکار و پرانرژی؛ به زندگی سالم و رشد مشترک علاقه دارم.",
  "تجربه کار خوبی دارم و مالی منظم هستم؛ دنبال همسری مهربان هستم.",
  "ساده و واقع بین؛ دوست دارم همسری داشته باشم که همراه و همدل باشد.",
  "خلاق و جاه طلب؛ به دنبال رابطه ای جدی با چشم انداز آینده هستم.",
  "خونگرم و اجتماعی؛ سفر و گردش را دوست دارم و دنبال همسری مثبت هستم.",
];

// RNG قطعی برای تکرارپذیری
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ترانسلیتراسیون ساده فارسی به لاتین برای یوزرنیم
const TR: Record<string, string> = {
  "ا": "a", "آ": "a", "أ": "a", "إ": "a", "ء": "", "ئ": "e", "ؤ": "o",
  "ب": "b", "پ": "p", "ت": "t", "ث": "s", "ج": "j", "چ": "ch", "ح": "h", "خ": "kh",
  "د": "d", "ذ": "z", "ر": "r", "ز": "z", "ژ": "zh", "س": "s", "ش": "sh", "ص": "s",
  "ض": "z", "ط": "t", "ظ": "z", "ع": "a", "غ": "gh", "ف": "f", "ق": "gh", "ک": "k",
  "گ": "g", "ل": "l", "م": "m", "ن": "n", "و": "v", "ه": "h", "ی": "y", "ي": "y",
  "ك": "k", " ": "_", "‌": "", "ۀ": "e", "ة": "e", "ى": "a",
};
function toLatin(s: string): string {
  return [...s].map((ch) => TR[ch] ?? "").join("").replace(/[^a-z0-9_]/g, "").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 24);
}

function photoUrl(filename: string): string {
  return `/api/media?p=${encodeURIComponent("keyshozorii/" + filename)}`;
}

async function main() {
  const files = readdirSync(PHOTOS_DIR)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort();
  if (files.length === 0) {
    console.error("[seed-cities] no photos found in", PHOTOS_DIR);
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const rng = mulberry32(14040101);
  const passwordHash = await bcrypt.hash("SeedUser#1404", 10);

  const cities: { province: string; city: string }[] = [];
  for (const [province, list] of Object.entries(PROVINCES)) {
    for (const city of list) cities.push({ province, city });
  }
  console.log(`[seed-cities] ${cities.length} cities, ${files.length} photos, ${PER_CITY} per gender`);

  type SeedUser = {
    phone: string; username: string; password: string; role: string; gender: string;
    firstName: string; lastName: string; province: string; city: string;
    age: number; height: number; weight: number; income: number;
    job: string; bio: string;
    isVerified: boolean; isActive: boolean; phoneVerified: boolean; isFake: boolean;
    termsAcceptedAt: Date; passwordChangedAt: Date; referralCode: null;
    _photo: string | null;
  };
  const usedNames = new Set<string>();
  const usedUsernames = new Set<string>();
  const users: SeedUser[] = [];

  let globalIdx = 0;
  for (let c = 0; c < cities.length; c++) {
    const { province, city } = cities[c];
    for (const gender of ["FEMALE", "MALE"] as const) {
      const names = gender === "FEMALE" ? F : M;
      for (let i = 0; i < PER_CITY; i++) {
        // جفت نام یکتا — نمایه سیستماتیک روی ماتریس نام × فامیلی
        const idx = c * PER_CITY + i;
        const firstName = names[idx % names.length];
        const lastName = L[(Math.floor(idx / names.length) + (gender === "FEMALE" ? 0 : 37)) % L.length];
        const fullKey = `${gender}:${firstName}|${lastName}`;
        if (usedNames.has(fullKey)) continue;
        usedNames.add(fullKey);

        let base = toLatin(firstName + " " + lastName) || "user";
        if (base.length < 3) base = "user_" + base;
        let username = base;
        let suffix = 1;
        while (usedUsernames.has(username)) username = `${base}${++suffix}`;
        usedUsernames.add(username);

        const hasPhoto = gender === "FEMALE";
        const photoFile = hasPhoto ? files[idx % files.length] : null;
        const jobs = gender === "FEMALE" ? JOBS_F : JOBS_M;
        const bios = gender === "FEMALE" ? BIOS_F : BIOS_M;

        const age = gender === "FEMALE"
          ? 19 + Math.floor(rng() * 22)
          : 22 + Math.floor(rng() * 27);
        const height = gender === "FEMALE"
          ? 155 + Math.floor(rng() * 22)
          : 168 + Math.floor(rng() * 28);
        const weight = gender === "FEMALE"
          ? 48 + Math.floor(rng() * 28)
          : 65 + Math.floor(rng() * 46);
        const income = gender === "FEMALE"
          ? Math.floor(rng() * 9) * 10_000_000
          : 20_000_000 + Math.floor(rng() * 28) * 10_000_000;
        const job = jobs[Math.floor(rng() * jobs.length)];
        const bio = bios[Math.floor(rng() * bios.length)];

        const phone = phoneFor(globalIdx);
        users.push({
          phone,
          username,
          password: passwordHash,
          role: "USER",
          gender,
          firstName,
          lastName,
          province,
          city,
          age,
          height,
          weight,
          income,
          job,
          bio,
          isVerified: false,
          isActive: true,
          phoneVerified: true,
          isFake: true,
          termsAcceptedAt: new Date(),
          passwordChangedAt: new Date(),
          referralCode: null,
          _photo: photoFile,
        });
        globalIdx++;
      }
    }
  }

  console.log(`[seed-cities] prepared ${users.length} users`);

  // کاربران موجود با همین شماره ها را رد می کنیم تا اجرای دوباره امن باشد
  const existing = await prisma.user.findMany({
    where: { phone: { startsWith: "0955" } },
    select: { phone: true },
  });
  const existingPhones = new Set(existing.map((u) => u.phone));
  const toCreate = users.filter((u) => !existingPhones.has(u.phone));
  console.log(`[seed-cities] ${existingPhones.size} already exist, creating ${toCreate.length}`);

  if (toCreate.length === 0) {
    console.log("[seed-cities] nothing to do");
    await pool.end();
    return;
  }

  // ایجاد کاربران — skipDuplicates برای امنیت بیشتر
  const userData = toCreate.map((u) => {
    const { _photo: _ignored, ...rest } = u;
    void _ignored;
    return rest;
  });
  await prisma.user.createMany({ data: userData, skipDuplicates: true });

  // شناسه های ساخته شده را برمی داریم برای کیف پول و عکس
  const created = await prisma.user.findMany({
    where: { phone: { in: toCreate.map((u) => u.phone) } },
    select: { id: true, phone: true },
  });
  const idByPhone = new Map(created.map((u) => [u.phone, u.id]));
  console.log(`[seed-cities] fetched ${created.length} ids`);

  // کیف پول برای همه — skipDuplicates چون userId یکتاست
  await prisma.wallet.createMany({
    data: created.map((u) => ({ userId: u.id, balance: 0 })),
    skipDuplicates: true,
  });

  // عکس پروفایل فقط برای دختران — فقط اگر عکسی نداشته باشند تا دوباره کاری نشود
  const photoRows: { userId: string; url: string; order: number; isProfile: boolean; isVerified: boolean; isRejected: boolean; isDeletedByUser: boolean }[] = [];
  for (const u of toCreate) {
    if (!u._photo) continue;
    const id = idByPhone.get(u.phone);
    if (!id) continue;
    photoRows.push({
      userId: id,
      url: photoUrl(u._photo),
      order: 0,
      isProfile: true,
      isVerified: true,
      isRejected: false,
      isDeletedByUser: false,
    });
  }
  // فقط برای کاربرانی که هنوز عکسی ندارند درج می کنیم
  const withPhotos = await prisma.profilePhoto.findMany({
    where: { userId: { in: photoRows.map((r) => r.userId) } },
    select: { userId: true },
  });
  const hasPhotoSet = new Set(withPhotos.map((p) => p.userId));
  const finalPhotos = photoRows.filter((r) => !hasPhotoSet.has(r.userId));
  if (finalPhotos.length) {
    await prisma.profilePhoto.createMany({ data: finalPhotos });
  }

  console.log(`[seed-cities] done — users: ${toCreate.length}, wallets: ${created.length}, photos: ${finalPhotos.length}`);
  await pool.end();
}

main().catch((e) => {
  console.error("[seed-cities] error:", e);
  process.exit(1);
});
