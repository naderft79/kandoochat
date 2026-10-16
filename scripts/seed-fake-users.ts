// اسکریپت تولید کاربران فیک دختر ایرانی با عکس های پوشه uploads
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "fs";
import path from "path";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// لیست استان ها و مراکز آن‌ها
const PROVINCES: Record<string, string[]> = {
  "تهران": ["تهران"],
  "اصفهان": ["اصفهان"],
  "فارس": ["شیراز"],
  "خراسان رضوی": ["مشهد"],
  "آذربایجان شرقی": ["تبریز"],
  "گیلان": ["رشت"],
  "مازندران": ["ساری"],
  "کرمان": ["کرمان"],
  "یزد": ["یزد"],
  "البرز": ["کرج"],
  "خوزستان": ["اهواز"],
  "قم": ["قم"],
  "هرمزگان": ["بندرعباس"],
  "گلستان": ["گرگان"],
  "اردبیل": ["اردبیل"],
  "زنجان": ["زنجان"],
  "قزوین": ["قزوین"],
  "همدان": ["همدان"],
  "کرمانشاه": ["کرمانشاه"],
  "لرستان": ["خرم آباد"],
  "مرکزی": ["اراک"],
  "چهارمحال و بختیاری": ["شهرکرد"],
  "کهگیلویه و بویراحمد": ["یاسوج"],
  "بوشهر": ["بوشهر"],
  "سیستان و بلوچستان": ["زاهدان"],
  "خراسان شمالی": ["بجنورد"],
  "خراسان جنوبی": ["بیرجند"],
  "آذربایجان غربی": ["ارومیه"],
  "کردستان": ["سنندج"],
  "ایلام": ["ایلام"],
};

const FEMALE_FIRST_NAMES = [
  "نگار", "سارا", "زهرا", "مریم", "فاطمه", "عاطفه", "نگین", "پریسا", "الهام", "نرگس",
  "آیدا", "ندا", "مینا", "لیلا", "روناک", "سحر", "پگاه", "دنیا", "هانیه", "سمیرا",
  "آزاده", "طاهره", "معصومه", "زینب", "خدیجه", "سمیه", "ربابه", "کریمه", "حلیمه", "نازنین",
  "شیرین", "پری", "فرشته", "گلناز", "محدثه", "اسرا", "الناز", "آناهیتا", "ترانه", "سیمین",
  "پروین", "آوا", "نیلوفر", "هاله", "غزل", "یاسمن", "ستایش", "پریچهره", "ژیلا", "فرغانه",
  "رکسانا", "آذر", "ماهور", "آرزو", "شکوفه", "بهاره", "نسترن", "لاله", "بنفشه", "گلاره",
  "یاسمین", "رؤیا", "ساغر", "شکوه", "فرناز", "کیمیا", "هستی", "آسمان", "خاطره", "طناز",
  "مهتاب", "آهو", "پردیس", "ژاله", "نوشآفرین", "سپیده", "سارینا", "نیکا", "پارمیس", "هانا",
  "آیناز", "سوگل", "هلیا", "آوینا", "رودابه", "تهمینه", "نیرا", "آفرین", "بهناز", "درسا",
  "رسا", "مرضیه", "وصال", "آرام", "بیتا", "تارا", "فهیمه", "نادیده", "باران", "مائده",
];

const LAST_NAMES = [
  "محمدی", "حسینی", "رضایی", "کریمی", "احمدی", "موسوی", "صادقی", "جعفری", "علی", "حیدری",
  "نوری", "قاسمی", "شریفی", "رحیمی", "کاظمی", "باقری", "محمودی", "اسماعیلی", "تقوی", "مرادی",
  "فلاح", "عباسی", "سلطانی", "حاجی", "یوسفی", "ابراهیمی", "صالحی", "زمانی", "نظری", "غفاری",
  "توکلی", "شفیعی", "میرزایی", "عابدی", "خادمی", "سلیمانی", "ملکی", "رستمی", "جهانی", "فرهمند",
  "کشوری", "نادری", "شجاعی", "امینی", "بهرامی", "همتی", "سعیدی", "گلستانی", "منصوری", "اسدی",
  "خسروی", "تهرانی", "شیرازی", "مشهدی", "اصفهانی", "کرمانی", "تبریزی", "گیلانی", "مازندرانی", "یزدی",
  "قمی", "سمنانی", "بوشهری", "خوزستانی", "عاشوری", "فرهادی", "نجفی", "اردبیلی", "زنجانی", "قزوینی",
  "همدانی", "سنندجی", "کرمانشاهی", "لرستانی", "ایلامی", "بلوچ", "شهرکردی", "بیرجندی", "گنبدی", "ساری",
];

const JOBS = [
  "کارمند اداره", "معلم", "پرستار", "منشی", "حسابدار", "گرافیست", "طراح سایت",
  "عکاس", "آرایشگر", "طراح لباس", "نویسنده", "مترجم", "پزشک", "دندانپزشک", "داروساز",
  "مهندس عمران", "مهندس کامپیوتر", "مهندس معماری", "کارشناس فروش", "کارشناس بازاریابی",
  "صاحب فروشگاه", "صاحب آرایشگاه", "صاحب کافه", "آشپز", "خیاط", "طراح داخلی", "مربی ورزش",
  "کارمند بانک", "کارمند بیمه", "کارمند هواپیمایی", "نقاش", "هنرمند", "موسیقیدان",
  "کارمند شهرداری", "کارمند آموزش و پرورش", "استاد دانشگاه", "محقق", "کارشناس منابع انسانی",
  "برنامه نویس", "تحلیلگر داده", "مشاور املاک", null, null, null,
];

const BIO_TEMPLATES = [
  "عاشق سفر و آشنا شدن با آدم های جدیدم 🌸 به دنبال رابطه جدی و صادقانه هستم.",
  "ورزش کار می کنم و زندگی سالم رو دوست دارم 🏃‍♀️ به دنبال کسی هستم که با هم رشد کنیم.",
  "هنر و موسیقی بخش بزرگی از زندگیمه 🎵 دوست دارم با کسی آشنا بشم که تفریحات مشترک داشته باشیم.",
  "کارمند هستم و وقت آزادم رو با دوستان می گذرونم ☕ به دنبال رابطه ای بر پایه احترام.",
  "عاشق آشپزی و کتاب خوندنم 📚 یه آدم آرام و صبورم.",
  "مدرس هستم و عاشق کارم 👩‍🏫 به دنبال کسی هستم که خانواده براش اولویت باشه.",
  "طراح هستم و خلاقیت رو دوست دارم 🎨 به دنبال رابطه ای که هر دو طرف تو هم رشد کنیم.",
  "عاشق طبیعت و کوهنوردی 🏔️ دوست دارم با کسی آشنا بشم که عاشق ماجراجویی باشه.",
  "دانشجو هستم و به دنبال آشنایی با کسی هدفمند 📖",
  "عاشق حیوانات خصوصا گربه ها 🐱 دوست دارم با کسی مهربون آشنا بشم.",
  "عاشق سینما و تئاتر 🎬 دوست دارم با کسی تفریحات مشترک داشته باشیم.",
  "عاشق قهوه و بارون ☕🌧️ یه آدم رمانتیک هستم.",
  "عاشق موسیقی سنتی ایرانی 🎶 به دنبال کسی با علایق مشترک.",
  "دوست دارم آدمای مثبت رو اطرافم داشته باشم ✨",
  "زندگی کوتاهه، پس بخند 😊 به دنبال رابطه ای شاد.",
  "عاشق گل و گیاه 🌺 یه آدم آرامم.",
  "مادر یه دختر زیبا 🌸 به دنبال کسی که خانواده دوست باشه.",
  "عاشق عکاسی و ثبت لحظه ها 📷 دوست دارم با کسی هنر رو درک کنه باشم.",
  "عاشق سفرهای داخلی و کشف جاهای جدید 🚗 دوست دارم با کسی عاشق سفر باشم.",
  "عاشق آشپزی غذاهای سنتی 🍲 دوست دارم با کسی فرهنگ رو قدر بدونه.",
];

const CAR_MODELS = [
  "پراید", "پژو 206", "پژو 207", "سمند", "ساینا", "کوییک", "تیبا",
  "هیوندای النترا", "کیا سراتو", "تویوتا کرولا", "مزدا ۳",
  "رنو ساندرو", "دنا", null, null, null, null,
];

const NEIGHBORHOODS = [
  "مرکز شهر", "خیابان اصلی", "نزدیک میدان", "حومه شهر", "بافت قدیمی",
  "محله جدید", "نزدیک پارک", "خیابان دانشگاه", null, null,
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone(index: number): string {
  const prefixes = ["0910", "0911", "0912", "0913", "0914", "0915", "0916", "0919", "0930", "0933", "0935", "0936", "0937", "0938", "0939"];
  const prefix = rand(prefixes);
  const suffix = String(1000000 + index * 137 + randInt(0, 99)).padStart(7, "0").slice(-7);
  return prefix + suffix;
}

function generateUsername(firstName: string, index: number): string {
  const translit: Record<string, string> = {
    "آ": "a", "ا": "a", "ب": "b", "پ": "p", "ت": "t", "ث": "s", "ج": "j", "چ": "ch",
    "ح": "h", "خ": "kh", "د": "d", "ذ": "z", "ر": "r", "ز": "z", "ژ": "zh",
    "س": "s", "ش": "sh", "ص": "s", "ض": "z", "ط": "t", "ظ": "z", "ع": "a",
    "غ": "gh", "ف": "f", "ق": "gh", "ک": "k", "گ": "g", "ل": "l", "م": "m",
    "ن": "n", "و": "v", "ه": "h", "ی": "y",
  };
  let latin = "";
  for (const ch of firstName) {
    latin += translit[ch] ?? ch;
  }
  latin = latin.toLowerCase().replace(/[^a-z0-9_]/g, "");
  return `${latin}_${randInt(10, 999)}${index}`;
}

async function main() {
  console.log("[seed] شروع اسکریپت تولید کاربران فیک...");

  const photosDir = path.join(process.cwd(), "public", "uploads");
  const photoFiles = fs.readdirSync(photosDir).filter(f => f.endsWith(".jpg"));
  console.log(`[seed] تعداد عکس های یافت شده: ${photoFiles.length}`);

  // حذف کاربران فیک قبلی
  const oldFakes = await prisma.user.deleteMany({ where: { isFake: true } });
  console.log(`[seed] حذف ${oldFakes.count} کاربر فیک قبلی`);

  const hashedPassword = await bcrypt.hash("fakepass123", 10);

  const allLocations: { province: string; city: string }[] = [];
  for (const [province, cities] of Object.entries(PROVINCES)) {
    for (const city of cities) {
      allLocations.push({ province, city });
    }
  }

  const TARGET_COUNT = 105;
  const shuffled = [...photoFiles].sort(() => Math.random() - 0.5);

  let created = 0;
  let errors = 0;

  for (let i = 0; i < TARGET_COUNT; i++) {
    try {
      const firstName = rand(FEMALE_FIRST_NAMES);
      const lastName = rand(LAST_NAMES);
      const location = allLocations[i % allLocations.length];
      const age = randInt(19, 34);
      const height = randInt(155, 178);
      const weight = randInt(48, 72);
      const income = randInt(5, 40) * 1000000;
      const job = rand(JOBS);
      const bio = rand(BIO_TEMPLATES);
      const coins = randInt(200, 1000);
      const phone = generatePhone(i + 1);
      const username = generateUsername(firstName, i + 1);

      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) { errors++; continue; }
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername) { errors++; continue; }

      const daysAgo = randInt(0, 60);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const lastSeenAgo = randInt(0, 72);
      const lastSeen = new Date(Date.now() - lastSeenAgo * 60 * 60 * 1000);

      const user = await prisma.user.create({
        data: {
          phone,
          username,
          password: hashedPassword,
          role: "USER",
          gender: "FEMALE",
          firstName,
          lastName,
          province: location.province,
          city: location.city,
          age,
          height,
          weight,
          income,
          job: job || null,
          bio,
          isVerified: true,
          isActive: true,
          phoneVerified: true,
          isFake: true,
          lastSeen,
          isOnline: Math.random() < 0.15,
          createdAt,
          wallet: { create: { balance: coins } },
        },
      });

      // 1 عکس پروفایل + 2-3 عکس گالری
      const photoCount = 3 + Math.floor(Math.random() * 2);
      const userPhotos: string[] = [];
      for (let j = 0; j < photoCount; j++) {
        const idx = (i * photoCount + j) % shuffled.length;
        userPhotos.push(shuffled[idx]);
      }

      await prisma.profilePhoto.create({
        data: {
          userId: user.id,
          url: `/uploads/${userPhotos[0]}`,
          order: 0,
          isProfile: true,
          isVerified: true,
          isRejected: false,
        },
      });

      for (let j = 1; j < userPhotos.length; j++) {
        await prisma.profilePhoto.create({
          data: {
            userId: user.id,
            url: `/uploads/${userPhotos[j]}`,
            order: j,
            isProfile: false,
            isVerified: true,
            isRejected: false,
          },
        });
      }

      created++;

      if (created % 10 === 0) {
        console.log(`[seed] ${created} کاربر ایجاد شد...`);
      }
    } catch (err) {
      console.error(`[seed] خطا در ایجاد کاربر ${i}:`, err);
      errors++;
    }
  }

  console.log(`\n[seed] پایان! کاربران ایجاد شده: ${created}, خطاها: ${errors}`);
  console.log(`[seed] مجموع کاربران فعلی: ${await prisma.user.count()}`);
}

main()
  .catch((err) => {
    console.error("[seed] خطای اسکریپت:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
