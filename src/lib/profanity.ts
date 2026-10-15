// فیلتر الفاظ رکیک و سکسی — فقط برای نام، نام خانوادگی و یوزرنیم (نه متن چت)
// منطق: ورودی نرمال می شود (واریانت های عربی، لیت اسپیک لاتین، جداکننده ها) و بعد substring چک می شود
// استثناها اسم های واقعی فارسی/لاتین هستند که بخشی از یک کلمه رکیک را در خود دارند

// نام های واقعی که اجزای مشابه کلمه رکیک دارند و نباید رد شوند
const EXCEPTIONS = [
  "کسری", "کسرا", "اکسیر", "رکسانا", "رکسان", "کوثر", "کوکب", "منیره", "منیژه",
  "ساکت", "کثیر", "کاسنی", "کسنیا", "دولت",
  "kasra", "kasri", "saghi", "saken", "coskun", "essex", "sakineh", "sakina",
  "sakine", "sakura", "masaki", "osaki", "faghih", "fagih", "mamad", "dawlat",
  "fakhri", "fakhr", "fakher", "fakhteh", "fakhry", "fakhar",
];

// کلمات رکیک و سکسی فارسی — روی متن نرمال شده چک می شوند
const FA_TERMS = [
  "کیر", "کون", "جنده", "جندگی", "فاحشه", "جق", "سکس", "سکسی", "ممه", "ساک",
  "گایید", "گایش", "گاییدن", "خارکسه", "خارکصه", "کسکش", "کسشر", "کص", "کصکش",
  "کثافت", "جاکش", "دیوث", "پادجه", "ننت", "تخم", "بیشرف", "ناموس", "زنازاده",
  "حرومزاده", "حرومی", "مادرجنده", "ننهجنده", "خارتو", "خرتو", "کونی",
  "آبکیر", "شاش", "گوزو", "زنازادگی", "دهنکج", "لخت", "نود", "پورن",
  "سکسچت", "هوسباز", "ساکزدن", "کیرم", "کیرت", "کیرش", "کونم", "کونت", "کونش",
];

// کلمات رکیک و سکسی لاتین + فینگیلیش — روی متن نرمال شده چک می شوند
const LATIN_TERMS = [
  // انگلیسی
  "fuck", "fuk", "fck", "fcuk", "phuck", "fack", "fak", "shit", "sex", "sexy", "sext", "porn",
  "prn", "xxx", "dick", "dik", "cock", "cok", "pussy", "pusy", "cunt", "cnt",
  "slut", "whore", "bitch", "bich", "boob", "tit", "cum", "jizz", "anal",
  "nude", "naked", "horny", "orgasm", "dildo", "milf", "clit", "vagina",
  "penis", "wank", "fap", "hentai", "escort", "hooker", "asshole", "arse",
  "bastard", "blowjob", "handjob", "rimjob", "gangbang", "erotic",
  "nipple", "genital", "masturbat", "ejaculat", "sperm", "pimp", "incest",
  "molest", "rape", "pedo", "nazi", "nigga", "nigger", "faggot",
  // فینگیلیش (فارسی با حروف لاتین)
  "kos", "koss", "kir", "kiri", "kon", "koon", "kooni", "koony", "jende",
  "jendeh", "jakesh", "jaksh", "koskesh", "koskhol", "kharkose", "kharkos",
  "madarjende", "nanejende", "nanat", "jagh", "jaghal", "mameh",
  "sakzadan", "gayid", "gaeed", "goshad", "goushad", "khayeh",
  "khayemal", "khayemale", "tokhmi", "pedarsag", "halekhoon",
  "dayus", "dayoos", "laxt", "berahne", "sekse", "seksi",
];

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[يﻱﻯ]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ؤ]/g, "و")
    .replace(/[ئ]/g, "ی")
    .replace(/[ةۀ]/g, "ه")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    // لیت اسپیک روی لاتین — برای دور زدن فیلتر
    .replace(/[0134578@$!]/g, (ch) => ({ "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", "$": "s", "!": "i" })[ch] ?? ch)
    // حذف جداکننده ها و کاراکترهای غیرکلمه ای
    .replace(/[\s\u200C\-_.*#'"(),؛،؟?!~+={}\[\]\\|/<>^%&;:]/g, "");
}

// بررسی رکیک بودن مقدار — برای نام، نام خانوادگی و یوزرنیم
export function containsProfanity(input: string | null | undefined): boolean {
  if (!input) return false;
  let s = normalize(input);
  if (!s) return false;
  // استثناها: نام های واقعی که شبیه کلمه رکیک هستند — ابتدا حذفشان می کنیم تا false positive نشود
  for (const e of EXCEPTIONS) {
    s = s.split(e).join("");
  }
  if (!s) return false;
  return [...FA_TERMS, ...LATIN_TERMS].some((t) => s.includes(t));
}
