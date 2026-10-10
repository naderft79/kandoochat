// اسکریپت مقداردهی اولیه دیتابیس: مدیر، تنظیمات و پروفایل های نمونه
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { deflateSync } from "node:zlib";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const avatarDir = path.join(process.cwd(), "public", "uploads", "seed-avatars");

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function createPng(width: number, height: number, pixels: Buffer) {
  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    scanlines[rowStart] = 0;
    pixels.copy(scanlines, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(scanlines)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function createAvatar(username: string, gender: string, index: number) {
  const palette = gender === "FEMALE"
    ? ["#f472b6", "#fb7185", "#f9a8d4", "#fdf2f8"]
    : ["#38bdf8", "#6366f1", "#93c5fd", "#eff6ff"];
  const start = hexToRgb(palette[index % palette.length]);
  const end = hexToRgb(palette[(index + 1) % palette.length]);
  const width = 512;
  const height = 512;
  const pixels = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = (x + y) / (width + height - 2);
      let r = Math.round(start.r * (1 - t) + end.r * t);
      let g = Math.round(start.g * (1 - t) + end.g * t);
      let b = Math.round(start.b * (1 - t) + end.b * t);
      const dx = x - 256;
      const dy = y - 190;
      const head = dx * dx + dy * dy < 86 * 86;
      const body = y > 284 && ((x - 256) * (x - 256)) / (148 * 148) + ((y - 430) * (y - 430)) / (170 * 170) < 1;
      if (head || body) {
        r = Math.round(r * 0.28 + 255 * 0.72);
        g = Math.round(g * 0.28 + 255 * 0.72);
        b = Math.round(b * 0.28 + 255 * 0.72);
      }
      const offset = (y * width + x) * 4;
      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = 255;
    }
  }

  const fileName = `${username}.png`;
  writeFileSync(path.join(avatarDir, fileName), createPng(width, height, pixels));
  return `/uploads/seed-avatars/${fileName}`;
}

async function main() {
  mkdirSync(avatarDir, { recursive: true });

  // تنظیمات پیش فرض
  const settings: Array<[string, string]> = [
    ["COIN_VALUE", "10000"],
    ["SUBSCRIPTION_PRICE", "398000"],
    ["MIN_WITHDRAW_COINS", "50"],
  ];
  for (const [key, value] of settings) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  console.log("[seed] settings created");

  // کاربر مدیر
  const adminPassword = await bcrypt.hash("Admin@Kandoo1404", 10);
  await prisma.user.upsert({
    where: { phone: "09120000000" },
    update: { username: "admin" },
    create: {
      phone: "09120000000",
      password: adminPassword,
      role: "ADMIN",
      username: "admin",
      gender: "MALE",
      firstName: "مدیر",
      lastName: "کندو",
      province: "تهران",
      city: "تهران",
      age: 35,
      height: 180,
      weight: 80,
      income: 0,
      isVerified: true,
      phoneVerified: true,
      wallet: { create: { balance: 0 } },
    },
  });
  console.log("[seed] admin user created (phone: 09120000000)");

  // پروفایل های نمونه تایید شده
  const samplePassword = await bcrypt.hash("Sample@1234", 10);
  const samples = [
    { firstName: "امیر", lastName: "رضایی", gender: "MALE", city: "تهران", age: 31, height: 182, weight: 84, income: 45_000_000, job: "مهندس نرم افزار", carModel: "سوناتا", neighborhood: "سعادت آباد", phone: "09121000001", username: "amir.rezaei", bio: "علاقه مند به سفر، قهوه و گفتگوهای صمیمی هستم." },
    { firstName: "سارا", lastName: "محمدی", gender: "FEMALE", city: "تهران", age: 27, height: 165, weight: 58, income: 25_000_000, job: "گرافیست", carModel: "۲۰۶", neighborhood: "پاسداران", phone: "09121000002", username: "sara.mohammadi", bio: "طراحی، موسیقی و قدم زدن عصرگاهی را دوست دارم." },
    { firstName: "کیان", lastName: "کاوه", gender: "MALE", city: "همدان", age: 29, height: 178, weight: 76, income: 32_000_000, job: "معمار", carModel: "دنا پلاس", neighborhood: "باغ میوه", phone: "09121000003", username: "kian.kaveh", bio: "آدم آرامی هستم و از طبیعت گردی لذت می برم." },
    { firstName: "نازنین", lastName: "احمدی", gender: "FEMALE", city: "همدان", age: 26, height: 168, weight: 55, income: 18_000_000, job: "معلم", carModel: null, neighborhood: "اعتمادیه", phone: "09121000004", username: "nazanin.ahmadi", bio: "کتاب، سینما و ارتباط محترمانه برایم مهم است." },
    { firstName: "علی", lastName: "حسینی", gender: "MALE", city: "تهران", age: 34, height: 185, weight: 88, income: 55_000_000, job: "وکیل", carModel: "مزدا ۳", neighborhood: "یوسف آباد", phone: "09121000005", username: "ali.hosseini", bio: "به دنبال آشنایی جدی و گفتگوی شفاف هستم." },
    { firstName: "مریم", lastName: "نوری", gender: "FEMALE", city: "تهران", age: 25, height: 163, weight: 54, income: 22_000_000, job: "پرستار", carModel: "کوییک", neighborhood: "جنت آباد", phone: "09121000006", username: "maryam.noori", bio: "مهربانی، صداقت و خانواده برایم ارزش اصلی است." },
    { firstName: "رضا", lastName: "قاسمی", gender: "MALE", city: "همدان", age: 33, height: 176, weight: 79, income: 40_000_000, job: "مدیر فروش", carModel: "سانتافه", neighborhood: "شهرک فرهنگیان", phone: "09121000007", username: "reza.ghasemi", bio: "اهل ورزش و برنامه ریزی برای آینده هستم." },
    { firstName: "فاطمه", lastName: "موسوی", gender: "FEMALE", city: "همدان", age: 28, height: 170, weight: 60, income: 24_000_000, job: "حسابدار", carModel: "تیبا", neighborhood: "مدنی", phone: "09121000008", username: "fateme.mousavi", bio: "آدم مثبت اندیشی هستم و رابطه سالم می خواهم." },
    { firstName: "حسین", lastName: "جعفری", gender: "MALE", city: "تهران", age: 36, height: 179, weight: 86, income: 70_000_000, job: "کارآفرین", carModel: "BMW 530", neighborhood: "زعفرانیه", phone: "09121000009", username: "hossein.jafari", bio: "رشد فردی و آرامش دو نفره برایم مهم است." },
    { firstName: "زهرا", lastName: "صادقی", gender: "FEMALE", city: "تهران", age: 30, height: 167, weight: 59, income: 35_000_000, job: "داروساز", carModel: "جک S5", neighborhood: "ونک", phone: "09121000010", username: "zahra.sadeghi", bio: "از سفر، آشپزی و یادگیری چیزهای تازه لذت می برم." },
    { firstName: "آرش", lastName: "مهرابی", gender: "MALE", city: "تهران", age: 28, height: 181, weight: 78, income: 36_000_000, job: "تحلیلگر داده", carModel: "تارا", neighborhood: "اکباتان", phone: "09121000011", username: "arash.mehrabi", bio: "داده، فیلم و کافه گردی بخشی از روزمره من است." },
    { firstName: "نگار", lastName: "رستمی", gender: "FEMALE", city: "تهران", age: 24, height: 164, weight: 53, income: 20_000_000, job: "دانشجوی ارشد", carModel: null, neighborhood: "تهرانپارس", phone: "09121000012", username: "negar.rostami", bio: "به هنر، کتاب و آدم های با انرژی خوب علاقه دارم." },
    { firstName: "سامان", lastName: "اکبری", gender: "MALE", city: "همدان", age: 32, height: 174, weight: 75, income: 30_000_000, job: "مدرس زبان", carModel: "پارس", neighborhood: "میدان بیمه", phone: "09121000013", username: "saman.akbari", bio: "زبان، موسیقی و سفرهای کوتاه را دوست دارم." },
    { firstName: "الهام", lastName: "کریمی", gender: "FEMALE", city: "همدان", age: 29, height: 166, weight: 57, income: 27_000_000, job: "کارشناس منابع انسانی", carModel: "۲۰۷", neighborhood: "خواجه رشید", phone: "09121000014", username: "elham.karimi", bio: "رابطه محترمانه و همراهی واقعی برایم مهم است." },
    { firstName: "محمد", lastName: "زارعی", gender: "MALE", city: "تهران", age: 30, height: 177, weight: 81, income: 44_000_000, job: "پزشک عمومی", carModel: "تیگو ۷", neighborhood: "گیشا", phone: "09121000015", username: "mohammad.zarei", bio: "آرام، مسئولیت پذیر و علاقه مند به ورزش هستم." },
    { firstName: "پریسا", lastName: "کاظمی", gender: "FEMALE", city: "تهران", age: 27, height: 169, weight: 58, income: 29_000_000, job: "طراح لباس", carModel: "ام وی ام X22", neighborhood: "مرزداران", phone: "09121000016", username: "parisa.kazemi", bio: "طراحی، مد، موسیقی و گفتگوهای عمیق را دوست دارم." },
    { firstName: "میلاد", lastName: "شریفی", gender: "MALE", city: "همدان", age: 35, height: 183, weight: 87, income: 48_000_000, job: "مهندس عمران", carModel: "هایما", neighborhood: "پردیس", phone: "09121000017", username: "milad.sharifi", bio: "خانواده دوست، اهل سفر و برنامه ریزی هستم." },
    { firstName: "آیدا", lastName: "مرادی", gender: "FEMALE", city: "همدان", age: 25, height: 162, weight: 52, income: 19_000_000, job: "عکاس", carModel: null, neighborhood: "چهارراه تختی", phone: "09121000018", username: "aida.moradi", bio: "عکاسی، طبیعت و آدم های صادق را دوست دارم." },
    { firstName: "پوریا", lastName: "یزدانی", gender: "MALE", city: "تهران", age: 27, height: 180, weight: 77, income: 34_000_000, job: "برنامه نویس", carModel: "دنا", neighborhood: "نارمک", phone: "09121000019", username: "pouria.yazdani", bio: "تکنولوژی، بازی فکری و کافه را دوست دارم." },
    { firstName: "رها", lastName: "اسدی", gender: "FEMALE", city: "تهران", age: 31, height: 171, weight: 62, income: 33_000_000, job: "روانشناس", carModel: "کیا سراتو", neighborhood: "شهرک غرب", phone: "09121000020", username: "raha.asadi", bio: "گفتگوی سالم، رشد شخصی و آرامش را ارزشمند می دانم." },
    { firstName: "مانی", lastName: "فتحی", gender: "MALE", city: "همدان", age: 26, height: 175, weight: 72, income: 26_000_000, job: "طراح محصول", carModel: "شاهین", neighborhood: "استادان", phone: "09121000021", username: "mani.fathi", bio: "طراحی، ورزش و ساختن تجربه های خوب را دوست دارم." },
    { firstName: "شیدا", lastName: "حیدری", gender: "FEMALE", city: "همدان", age: 32, height: 167, weight: 59, income: 31_000_000, job: "مدیر مارکتینگ", carModel: "کراس لند", neighborhood: "آرامگاه بوعلی", phone: "09121000022", username: "sheida.heydari", bio: "اهل انرژی مثبت و رابطه با ثبات هستم." },
    { firstName: "امیرحسین", lastName: "بهرامی", gender: "MALE", city: "تهران", age: 38, height: 184, weight: 90, income: 80_000_000, job: "مدیر پروژه", carModel: "لکسوس NX", neighborhood: "فرمانیه", phone: "09121000023", username: "amirhossein.bahrami", bio: "جدی، خانواده دوست و علاقه مند به سفر هستم." },
    { firstName: "مهسا", lastName: "عباسی", gender: "FEMALE", city: "تهران", age: 29, height: 165, weight: 56, income: 28_000_000, job: "کارشناس حقوقی", carModel: "۲۰۶", neighborhood: "صادقیه", phone: "09121000024", username: "mahsa.abbasi", bio: "صداقت و احترام دو طرفه برایم اولویت دارد." },
    { firstName: "سینا", lastName: "نیکزاد", gender: "MALE", city: "همدان", age: 30, height: 179, weight: 82, income: 37_000_000, job: "مدیر رستوران", carModel: "آریزو ۵", neighborhood: "باغ ایرانی", phone: "09121000025", username: "sina.nikzad", bio: "غذا، سفر و ساختن لحظه های خوب را دوست دارم." },
    { firstName: "ترانه", lastName: "صفری", gender: "FEMALE", city: "همدان", age: 26, height: 166, weight: 55, income: 21_000_000, job: "مربی ورزش", carModel: "کوییک", neighborhood: "جاده مرادبیگ", phone: "09121000026", username: "tarane.safari", bio: "ورزش، موسیقی و زندگی سالم برایم مهم است." },
    { firstName: "بهزاد", lastName: "کمالی", gender: "MALE", city: "تهران", age: 33, height: 181, weight: 83, income: 52_000_000, job: "مشاور مالی", carModel: "کمری", neighborhood: "قیطریه", phone: "09121000027", username: "behzad.kamali", bio: "اهل برنامه ریزی، مطالعه و زندگی متعادل هستم." },
    { firstName: "نیلوفر", lastName: "سلطانی", gender: "FEMALE", city: "تهران", age: 28, height: 170, weight: 61, income: 30_000_000, job: "معمار داخلی", carModel: "کپچر", neighborhood: "نیاوران", phone: "09121000028", username: "niloufar.soltani", bio: "طراحی داخلی، هنر و طبیعت برایم الهام بخش است." },
    { firstName: "پارسا", lastName: "مقدم", gender: "MALE", city: "همدان", age: 24, height: 176, weight: 73, income: 23_000_000, job: "دانشجوی پزشکی", carModel: null, neighborhood: "کلپا", phone: "09121000029", username: "parsa.moghadam", bio: "درس، ورزش و معاشرت سالم بخشی از زندگی من است." },
    { firstName: "سپیده", lastName: "جلالی", gender: "FEMALE", city: "همدان", age: 34, height: 168, weight: 60, income: 36_000_000, job: "دندانپزشک", carModel: "اسپورتیج", neighborhood: "شهرک مدنی", phone: "09121000030", username: "sepide.jalali", bio: "آرامش، احترام و نگاه مثبت به زندگی را دوست دارم." },
    { firstName: "عرفان", lastName: "کریمیان", gender: "MALE", city: "تهران", age: 29, height: 186, weight: 85, income: 41_000_000, job: "مربی بدنسازی", carModel: "جک J4", neighborhood: "پیروزی", phone: "09121000031", username: "erfan.karimian", bio: "ورزشکار، اجتماعی و علاقه مند به رابطه سالم هستم." },
    { firstName: "لیلا", lastName: "امینی", gender: "FEMALE", city: "تهران", age: 33, height: 164, weight: 57, income: 34_000_000, job: "مدیر آموزش", carModel: "النترا", neighborhood: "میدان ولیعصر", phone: "09121000032", username: "leila.amini", bio: "آدمی منظم، مهربان و علاقه مند به خانواده هستم." },
  ];

  for (const [index, s] of samples.entries()) {
    const avatarUrl = createAvatar(s.username, s.gender, index);
    const user = await prisma.user.upsert({
      where: { phone: s.phone },
      update: {
        username: s.username,
        gender: s.gender,
        firstName: s.firstName,
        lastName: s.lastName,
        province: s.city === "تهران" ? "تهران" : "همدان",
        city: s.city,
        age: s.age,
        height: s.height,
        weight: s.weight,
        income: s.income,
        job: s.job,
        carModel: s.carModel,
        neighborhood: s.neighborhood,
        isVerified: true,
        phoneVerified: true,
        bio: s.bio,
        lastSeen: new Date(Date.now() - index * 1000 * 60 * 23),
        isOnline: index % 4 === 0,
      },
      create: {
        phone: s.phone,
        password: samplePassword,
        role: "USER",
        username: s.username,
        gender: s.gender,
        firstName: s.firstName,
        lastName: s.lastName,
        province: s.city === "تهران" ? "تهران" : "همدان",
        city: s.city,
        age: s.age,
        height: s.height,
        weight: s.weight,
        income: s.income,
        job: s.job,
        carModel: s.carModel,
        neighborhood: s.neighborhood,
        isVerified: true,
        phoneVerified: true,
        bio: s.bio,
        lastSeen: new Date(Date.now() - index * 1000 * 60 * 23),
        isOnline: index % 4 === 0,
        wallet: { create: { balance: 250 + index * 15 } },
      },
    });

    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, balance: 250 + index * 15 },
    });
    await prisma.profilePhoto.deleteMany({ where: { userId: user.id } });
    await prisma.profilePhoto.create({
      data: { userId: user.id, url: avatarUrl, order: 0 },
    });
  }
  console.log(`[seed] ${samples.length} safe sample profiles created`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("[seed] done");
  })
  .catch(async (e) => {
    console.error("[seed] error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
