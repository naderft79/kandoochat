// ساخت انبوه کاربران زن با عکس های تایید شده تشخیص چهره، نام های فارسی یکتا و پروفایل کامل
// اجرا: npx tsx scripts/seed-female-users.ts
import "dotenv/config";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { PROVINCE_NAMES, PROVINCES } from "../src/lib/iran";

// نام های زنانه فارسی + لاتین برای ساخت یوزرنیم مرتبط — همه یکتا
const FIRST: [string, string][] = [
  ["نازنین", "nazanin"], ["سارا", "sara"], ["مریم", "maryam"], ["الناز", "elnaz"], ["شیرین", "shirin"],
  ["نگار", "negar"], ["آتوسا", "atosa"], ["درسا", "dorsa"], ["ترانه", "taraneh"], ["ریحانه", "reyhane"],
  ["یاسمین", "yasmin"], ["نسترن", "nastaran"], ["بهار", "bahar"], ["بهاره", "bahare"], ["مهسا", "mahsa"],
  ["مهدیس", "mahdis"], ["هستی", "hasti"], ["آیدا", "aida"], ["آناهیتا", "anahita"], ["پریسا", "parisa"],
  ["پریناز", "parinaz"], ["کیمیا", "kimia"], ["یلدا", "yalda"], ["نرگس", "narges"], ["مژگان", "mozhgan"],
  ["سپیده", "sepide"], ["شبنم", "shabnam"], ["گلناز", "golnaz"], ["گلاره", "golare"], ["لاله", "lale"],
  ["ثریا", "soraya"], ["فرناز", "farnaz"], ["فرشته", "fereshte"], ["فریبا", "fariba"], ["فاطمه", "fateme"],
  ["زهرا", "zahra"], ["مهرنوش", "mehrnush"], ["مهرناز", "mehrnaz"], ["مهناز", "mahnaz"], ["مینا", "mina"],
  ["مونا", "mona"], ["ناهید", "nahid"], ["نیلوفر", "nilufar"], ["ندا", "neda"], ["روژین", "rozhin"],
  ["رها", "raha"], ["روناک", "ronak"], ["روشنک", "roshanak"], ["سارینا", "sarina"], ["ساناز", "sanaz"],
  ["سولماز", "solmaz"], ["سودابه", "sudabe"], ["سیما", "sima"], ["شیوا", "shiva"], ["شقایق", "shaghayegh"],
  ["شکوفه", "shokufe"], ["شهلا", "shahla"], ["شهرزاد", "shahrzad"], ["شهرناز", "shahrnaz"], ["عسل", "asal"],
  ["غزال", "ghazal"], ["فروغ", "forugh"], ["فرزانه", "farzane"], ["گیسو", "gisu"], ["گلنار", "golnar"],
  ["هلیا", "helia"], ["هانیه", "hanie"], ["هدیه", "hedie"], ["یاس", "yas"], ["آزاده", "azade"],
  ["آرزو", "arezu"], ["آزیتا", "azita"], ["آدینه", "adine"], ["باران", "baran"], ["بیتا", "bita"],
  ["بانو", "banu"], ["پانته آ", "pantea"], ["پریا", "parya"], ["پوپک", "pupak"], ["پگاه", "pegah"],
  ["پونه", "pune"], ["تارا", "tara"], ["تمنا", "tamana"], ["تینا", "tina"], ["ثنا", "sana"],
  ["دنیا", "donya"], ["دلارام", "delaram"], ["دلسا", "delsa"], ["دیبا", "diba"], ["رکسانا", "roksana"],
  ["رزیتا", "rozita"], ["ریحان", "reyhan"], ["ژاله", "jale"], ["ژینا", "zhina"], ["ستاره", "setare"],
  ["سمیرا", "samira"], ["سحر", "sahar"], ["ساغر", "saghar"], ["سروین", "sarvin"], ["سوده", "sude"],
  ["سهیلا", "soheila"], ["سیندخت", "sindokht"], ["شادی", "shadi"], ["شایسته", "shayeste"], ["شیدا", "sheyda"],
  ["شمیم", "shamim"], ["شهربانو", "shahrbanu"], ["شورانگیز", "shurangiz"], ["شیلا", "sheila"], ["شیما", "shima"],
  ["صبا", "saba"], ["صدف", "sadaf"], ["طلا", "tala"], ["طناز", "tanaz"], ["طوبی", "tuba"],
  ["عاطفه", "atefe"], ["عفت", "effat"], ["فرانک", "faranak"], ["فروزان", "foruzan"], ["فهیمه", "fahime"],
  ["فیروزه", "firuze"], ["کبری", "kobra"], ["کامیلا", "kamila"], ["گلایول", "golayol"], ["گلبن", "golban"],
  ["گلپری", "golpari"], ["گلچین", "golchin"], ["گلدسته", "goldaste"], ["گلرخ", "golrokh"], ["گلسا", "golsa"],
  ["گلشن", "golshan"], ["گلشید", "golshid"], ["گلی", "goli"], ["گیتا", "gita"], ["لادن", "ladan"],
  ["لبنى", "lobna"], ["لیلا", "leila"], ["لیلیا", "lilia"], ["ماهدخت", "mahdokht"], ["ماهور", "mahur"],
  ["مائده", "maede"], ["مانا", "mana"], ["مرجان", "marjan"], ["مرجانه", "marjane"], ["مشکات", "meshkat"],
  ["مطهره", "motahare"], ["مرضیه", "marzie"], ["معصومه", "masume"], ["منیره", "munire"], ["مهتاب", "mahtab"],
  ["مهربانو", "mehrbanu"], ["مهرسا", "mahrsa"], ["مهشید", "mahshid"], ["مهکامه", "mahkame"], ["مینو", "minu"],
  ["مژده", "mojde"], ["میترا", "mitra"], ["ملینا", "melina"], ["نسیم", "nasim"], ["نشاط", "neshat"],
  ["نغمه", "naghme"], ["نفیسه", "nafise"], ["نوشین", "nushin"], ["نوشا", "nusha"], ["نوگل", "nogol"],
  ["نویده", "navide"], ["نوین", "navin"], ["نیکا", "nika"], ["نیکتا", "nikta"], ["نیکی", "niki"],
  ["نینا", "nina"], ["هاله", "hale"], ["هانا", "hana"], ["هلن", "helen"], ["هما", "homa"],
  ["هنگامه", "hangame"], ["هیوا", "hiva"], ["ونوس", "venus"], ["وحیده", "vahide"], ["ویس", "vis"],
  ["ویستا", "vista"], ["پارمیس", "parmis"], ["پارناز", "parnaz"], ["پانیذ", "paniz"], ["پارین", "parin"],
  ["پاکیزه", "pakize"], ["بتول", "batul"], ["بدور", "budur"], ["بهارک", "baharak"], ["بهناز", "behnaz"],
  ["بهنوش", "behnush"], ["پروانه", "parvane"], ["پرستو", "parastu"], ["تابان", "taban"], ["تیام", "tiam"],
  ["جینا", "jina"], ["جیران", "jiran"], ["دلبر", "delbar"], ["دلناز", "delnaz"], ["دلنواز", "delnavaz"],
  ["راحله", "rahele"], ["رخساره", "rokhsare"], ["رخشنده", "rokhshande"], ["رعنا", "raana"], ["رقیه", "roghiye"],
  ["رمیسا", "ramisa"], ["ریما", "rima"], ["زرین", "zarrin"], ["زیبا", "ziba"], ["زیتون", "zeytun"],
  ["ساجده", "sajede"], ["سلیما", "selima"], ["سنبل", "sonbol"], ["سولینا", "sulina"], ["شاهینه", "shahine"],
  ["شراره", "sharare"], ["شهره", "shahre"], ["شوریا", "shuria"], ["صنم", "sanam"], ["ضحا", "zaha"],
  ["عادیه", "adie"], ["عالیسا", "alisa"], ["غدیه", "ghadie"], ["فاخته", "fakhte"], ["فاطیما", "fatima"],
  ["فرنوش", "farnush"], ["فسان", "fasan"], ["فلک", "falak"], ["کاترین", "katerin"], ["کوثر", "kosar"],
  ["گل افروز", "gelafroz"], ["گل بهار", "golbahar"], ["گلپونه", "gelpune"], ["لاله رخ", "lalerokh"], ["ماه چهر", "mahchehr"],
  ["ماه لقا", "mahlegha"], ["ماه شید", "mahsheed"], ["ماه نو", "mahno"], ["مه روز", "mahruz"], ["مه نیار", "mahniar"],
  ["ناز چهر", "nazchehr"], ["نازپرور", "nazparvar"], ["نگین", "negin"], ["نوش فر", "nushfar"], ["هیلا", "hila"],
];

// نام های خانوادگی فارسی — همه یکتا
const LAST: string[] = [
  "محمدی", "حسینی", "رضایی", "موسوی", "احمدی", "قاسمی", "جعفری", "کریمی", "رستمی", "نجفی",
  "یوسفی", "صادقی", "ابراهیمی", "عباسی", "مرادی", "اکبری", "شریفی", "رحیمی", "اسماعیلی", "خسروی",
  "غلامی", "توکلی", "جلالی", "نادری", "فلاح", "دهقان", "صدر", "امینی", "باقری", "گودرزی",
  "کیانی", "ملکی", "نظری", "طالبی", "عزیزی", "فرهادی", "قنبری", "لطفی", "میرزایی", "نصیری",
  "هاشمی", "یزدانی", "زارعی", "سلیمی", "شمس", "شایان", "طهرانی", "عالمی", "فتحی", "گنجی",
  "مظاهری", "نوذری", "رحمانی", "سعیدی", "صالحی", "ضیایی", "طباطبایی", "عادلی", "فرجام", "قدوسی",
  "کاظمی", "لشکری", "مطهری", "نیکبخت", "هدایتی", "واحدی", "یاری", "اصغری", "بابایی", "ترابی",
  "چگینی", "خادمی", "دانشور", "ذوقی", "رضوان", "سبحانی", "شفیعی", "صیاد", "عبدی", "فلاحتی",
  "قهاری", "کاشانی", "لسانی", "ماهانی", "نجار", "هنری", "واعظی", "یاوری", "زرندی", "سلطانی",
  "شفیق", "صادق پور", "عشقی", "فدایی", "قاسم پور", "کبیری", "مقدم", "نیکوکار", "هژبری", "وفایی",
  "یگانه", "زرگر", "سبزواری", "شایگان", "طلوعی", "عموزاده", "فیروزی", "قدیانی", "کلاهدوز", "لهستانی",
  "مدرس", "نیک خواه", "هوشیار", "ورمزیار", "زنجانی", "شیرازی", "تبریزی", "اصفهانی", "گرجی", "لاریجانی",
  "سمنانی", "قمی", "کرمانی", "یزدی", "شیروانی", "بجنوردی", "نیشابوری", "خوانساری", "افشار", "ایلخانی",
  "بهرامی", "پوراحمد", "جوادی", "خدابنده", "داوودی", "رستگار", "سعادت", "شجاعی", "صفوی", "عرب زاده",
  "فیروزنیا", "قلی زاده", "کمالی", "لقمانی", "مهدوی", "نیک پی", "همت", "واثقی", "زمانی", "شرمندی",
  "طالقانی", "عسگری", "فرزاد", "قادرزاده", "کشاورز", "لشگری", "منبری", "کوهستانی", "دقیقی", "رادمهر",
  "سپهری", "شادروان", "طالقانی نژاد", "عبدالهی", "فرامرزی", "قدیمی", "کامکار", "لواسانی", "مازندرانی", "نوروزی",
  "هوشیاری", "وزیری", "یزدان پناه", "ژاله پور", "سیاهپوش", "شریعت", "طوسی", "عمادی", "فرهنگی", "قائمی",
  "کردستانی", "لاله", "مهاجر", "نیک رفتار", "هراتی", "ولایی", "یزدان دوست", "زارع زاده", "سرمست", "شفیع پور",
  "طالش", "علی نژاد", "فرجی", "قوچانی", "کسمایی", "لاهوتی", "مهرآبادی", "نیک فر", "هویدا", "واحدیان",
  "یادگاری", "زندیه", "ستوده", "شرافت", "طالع", "علم الهدی", "فرشباف", "قزوینی", "کامیاران", "لارستانی",
  "مهرگان", "نیک مهر", "همدانی", "ورده", "یاسین", "زرین کوب", "سعادت پور", "شریف زاده", "طباطبایی نژاد", "علی پور",
  "فرهاد پور", "قلعه نو", "کامران", "لیوانی", "مهدووند", "نیک آرا", "هدایت", "واثق", "یاوران",
];

const JOBS = [
  "پرستار", "معلم", "پزشک", "داروساز", "مهندس نرم افزار", "معمار", "طراح لباس", "آرایشگر", "خیاط", "قاشقه چی",
  "روانشناس", "وکیل", "حسابدار", "مدرس دانشگاه", "مترجم", "عکاس", "آشپز", "کنفیکتور", "فروشنده", "مدیر فروش",
  "کارمند بانک", "منشی", "مربی ورزش", "خبرنگار", "نویسنده", "گرافیست", "طراح داخلی", "مهماندار", "تور لیدر", "دانشجو",
  "دامپزشک", "فیزیوتراپیست", "ماما", "دندانپزشک", "کارآفرین", "بلاگر", "یوگا تراپیست", "موسیقیدان", "بازیگر", "گل فروش",
];

const CARS = ["پراید", "پژو ۲۰۶", "سمند", "دنا", "تیبا", "ساینا", "کوییک", "شاهین", "پژو ۲۰۷", "رانا", "تارا", "سراتو", "النترا", "چری تیگو", "جک S5"];

const BIOS = [
  "عاشق سفر و کوهنوردی، به دنبال یک رابطه جدی و صمیمی",
  "کتابخون و قهوه خور، اهل گفتگوی عمیق",
  "ورزشکار و پرانرژی، صبح ها پیاده روی می کنم",
  "علاقمند به موسیقی و فیلم های کلاسیک",
  "آشپزی حرفه ای من است، عاشق طبیعت گردی",
  "به دنبال کسی که صادق و مهربون باشه",
  "عاشق بچه ها و حیوانات، اهل خانه داری",
  "کار و زندگی رو جدی می گیرم ولی کنارش تفریح هم مهم است",
  "با ارزوی سفر دور دنیا، اهل تجربه های جدید",
  "ساکت و آروم، اهل قرارهای دونفره",
  "عاشق شعر و ادبیات فارسی",
  "دنبال یه همراه واقعی برای زندگی",
  "مستقل و جاه طلب، اهل رشد شخصی",
  "عکاسی و طبیعت دوتا علاقه اصلی من",
  "به دنبال ازدواج و تشکیل خانواده",
  "خوشگذرون و خنده رو، اهل دورهمی های دوستانه",
  "آدم صبور و با حوصله ای هستم",
  "عاشق یادگیری زبان های جدید",
  "دل باز و صادق، دنبال همون صداقت از طرف مقابل",
  "علاقه مند به هنر و نقاشی",
  "سبک زندگی سالم برای من مهم است",
  "عاشق دریا و ساحل، بوی بارون",
  "با فیلم های رمانتیک بزرگ شدم",
  "اهل تفاوت ها هستم و به استقلال اهمیت می دهم",
  "دنبال کسی که به حرف هام گوش بده",
  "خونگرم و بیشتر اهل خونه نشینی",
  "مهمونی و رقص جزئی از زندگی من",
  "باشگاه و سلامتی اولویت اول من",
  "ساده و بی ادعا، دنبال آرامش",
  "رویا پرداز ولی واقع بین",
];

const NEIGHBORHOODS = [
  "نیاوران", "ونک", "سعادت آباد", "شهرک غرب", "جردن", "ظفر", "فرمانیه", "تجریش", "قلهک", "دربند",
  "پاسداران", "هروی", "مدنی", "عباس آباد", "یوسف آباد", "امیر آباد", "کریم خان", "فاطمی", "کشاورز", "ولیعصر",
  "اندیشه", "فردیس", "گلشن", "صادقیه", "اکباتان", "جنوب", "پیروزی", "نارمک", "مجیدیه", "تهرانپارس",
];

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[rnd(0, arr.length - 1)];
const shuffle = <T,>(arr: T[]): T[] => arr.map((v) => [v, Math.random()] as const).sort((a, b) => a[1] - b[1]).map(([v]) => v);

async function main() {
  // ۱) حذف همه کاربران به جز ادمین و همراهان هوش مصنوعی
  const keep = await prisma.user.findMany({
    where: { OR: [{ phone: "1" }, { isAICompanion: true }] },
    select: { id: true },
  });
  const keepIds = keep.map((u) => u.id);
  const deleted = await prisma.user.deleteMany({ where: { id: { notIn: keepIds } } });
  console.log(`[seed] deleted ${deleted.count} users, kept ${keepIds.length}`);

  // ۲) عکس های معتبر تشخیص چهره
  const faces = JSON.parse(readFileSync("scripts/_faces.json", "utf-8")) as { ok: string[] };
  const pool = shuffle(faces.ok);
  if (pool.length < 450) throw new Error("not enough verified photos");

  // ۳) ساخت کاربران
  const hash = await bcrypt.hash("Kandoo-user-1404", 10);
  const interests = await prisma.interest.findMany({ select: { id: true } });
  const firsts = shuffle(FIRST);
  const lasts = shuffle(LAST);
  const COUNT = Math.min(215, firsts.length, lasts.length);

  // چرخه عکس گالری: هر عکس حداکثر ۲ بار در کل سایت استفاده شود
  const galleryCycle = shuffle([...pool, ...shuffle(pool)]); // دو دور مخلوط — تکرار پخش شده
  let galleryIdx = 0;
  const nextGallery = (exclude: Set<string>) => {
    for (let tries = 0; tries < galleryCycle.length; tries++) {
      const f = galleryCycle[(galleryIdx + tries) % galleryCycle.length];
      if (!exclude.has(f)) {
        galleryIdx = (galleryIdx + tries + 1) % galleryCycle.length;
        return f;
      }
    }
    return pool[0];
  };

  let featuredCount = 0;
  for (let i = 0; i < COUNT; i++) {
    const [firstName, latin] = firsts[i];
    const lastName = lasts[i];
    const province = pick(PROVINCE_NAMES);
    const city = pick(PROVINCES[province]);
    const username = `${latin}${pick(["", "_"])}${pick(["", "official", "real", "ir", "x", "love", "life", "me", "plus", "shop"])}${rnd(11, 999)}`.replace(/^_+|_+$/g, "");

    const profilePhoto = pool[i];
    const used = new Set([profilePhoto]);
    const galleryCount = rnd(2, 3);
    const gallery = Array.from({ length: galleryCount }, () => { const f = nextGallery(used); used.add(f); return f; });

    const hasSub = Math.random() < 0.35;
    const hadSub = !hasSub && Math.random() < 0.12;
    const coins = Math.random() < 0.3 ? 0 : rnd(20, 2500);
    const online = Math.random() < 0.3;

    const user = await prisma.user.create({
      data: {
        phone: `0912${String(1000000 + i).slice(-7)}`,
        username: await uniqueUsername(username),
        password: hash,
        role: "USER",
        gender: "FEMALE",
        firstName,
        lastName,
        province,
        city,
        neighborhood: Math.random() < 0.6 ? pick(NEIGHBORHOODS) : null,
        age: rnd(19, 45),
        height: rnd(150, 182),
        weight: rnd(45, 78),
        income: pick([0, 0, 8000000, 15000000, 25000000, 40000000, 60000000]),
        carModel: Math.random() < 0.5 ? pick(CARS) : null,
        job: pick(JOBS),
        bio: pick(BIOS),
        isVerified: Math.random() < 0.45,
        phoneVerified: true,
        isOnline: online,
        lastSeen: online ? new Date() : new Date(Date.now() - rnd(5, 4320) * 60000),
        referralCode: "KD" + randomBytes(4).toString("hex").toUpperCase(),
        termsAcceptedAt: new Date(),
        photos: {
          create: [
            { url: `/uploads/keyshozorii/${profilePhoto}`, order: 0, isProfile: true, isVerified: true },
            ...gallery.map((f, gi) => ({ url: `/uploads/keyshozorii/${f}`, order: gi + 1, isProfile: false, isVerified: true })),
          ],
        },
        wallet: { create: { balance: coins } },
      },
    });

    if (hasSub) {
      await prisma.subscription.create({
        data: { userId: user.id, tier: pick(["BASIC", "PREMIUM", "VIP"]), endsAt: new Date(Date.now() + rnd(7, 45) * 86400000), coinsPaid: 0 },
      });
    } else if (hadSub) {
      await prisma.subscription.create({
        data: { userId: user.id, tier: "BASIC", startsAt: new Date(Date.now() - 60 * 86400000), endsAt: new Date(Date.now() - rnd(3, 30) * 86400000), coinsPaid: 0 },
      });
    }

    // علایق تصادفی برای حدود ۶۰٪ کاربران
    if (interests.length && Math.random() < 0.6) {
      const picks = shuffle(interests).slice(0, rnd(2, 4));
      await prisma.userInterest.createMany({ data: picks.map((x) => ({ userId: user.id, interestId: x.id })) });
    }

    // چند کاربر در بخش ویژه تایید شده
    if (featuredCount < 10 && Math.random() < 0.06) {
      await prisma.featuredListing.create({
        data: { userId: user.id, status: "APPROVED", costCoins: 100, approvedAt: new Date() },
      });
      featuredCount++;
    }

    if (i % 25 === 0) console.log(`[seed] ${i}/${COUNT}`);
  }
  console.log(`[seed] done: ${COUNT} female users, ${featuredCount} featured`);
}

async function uniqueUsername(base: string): Promise<string> {
  let u = base.slice(0, 28);
  while (await prisma.user.findUnique({ where: { username: u }, select: { id: true } })) {
    u = `${base.slice(0, 24)}${rnd(10, 99)}`;
  }
  return u;
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
