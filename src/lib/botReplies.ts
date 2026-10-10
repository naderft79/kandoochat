// بانک پاسخ‌های گفتگوی ربات — برای ادامه گفتگو با کاربرانی که جواب داده‌اند
// دسته‌بندی پاسخ‌ها بر اساس محتوای پیام کاربر

export type ReplyCategory =
  | "GREETING"
  | "QUESTION_AGE"
  | "QUESTION_CITY"
  | "QUESTION_JOB"
  | "COMPLIMENT_RESPONSE"
  | "QUESTION_HOBBIES"
  | "CLOSING"
  | "GENERIC"
  | "LAUGH"
  | "AGREEMENT";

export interface BotReply {
  text: string;
  category: ReplyCategory;
  weight?: number;
}

// بانک پاسخ‌ها
const REPLY_BANK: BotReply[] = [
  // سلام و احوال‌پرسی
  { text: "سلام عزیزم، خوبی؟", category: "GREETING", weight: 3 },
  { text: "سلام، حالت چطوره؟", category: "GREETING", weight: 2 },
  { text: "سلام، روزت بخیر", category: "GREETING", weight: 2 },
  { text: "سلام، خوشحالم ازت می‌شنوم", category: "GREETING", weight: 2 },

  // سوال سن
  { text: "۲۵ سالمه", category: "QUESTION_AGE", weight: 2 },
  { text: "۲۸ سالمه، تو چندت؟", category: "QUESTION_AGE", weight: 2 },
  { text: "۲۳ سالمه", category: "QUESTION_AGE", weight: 1 },

  // سوال شهر
  { text: "تهران هستم، تو؟", category: "QUESTION_CITY", weight: 3 },
  { text: "اصفهان زندگی می کنم", category: "QUESTION_CITY", weight: 2 },
  { text: "شیرازیم، تو کجایی؟", category: "QUESTION_CITY", weight: 2 },

  // سوال شغل
  { text: "طراح گرافیکم، تو چی کار می کنی؟", category: "QUESTION_JOB", weight: 2 },
  { text: "دانشجوم، مهندسی نرم افزار", category: "QUESTION_JOB", weight: 1 },
  { text: "معلمم، عاشق کارمم", category: "QUESTION_JOB", weight: 1 },

  // جواب به تعریف
  { text: "ممنونم، تو هم خیلی مهربونی", category: "COMPLIMENT_RESPONSE", weight: 3 },
  { text: "خجالت‌م ندار، ممنون", category: "COMPLIMENT_RESPONSE", weight: 2 },
  { text: "تو هم همینطور، عجب شخصیتی داری", category: "COMPLIMENT_RESPONSE", weight: 2 },

  // سوال سرگرمی
  { text: "فیلم دیدن و موسیقی دوست دارم، تو؟", category: "QUESTION_HOBBIES", weight: 2 },
  { text: "ورزش و کوهنوردی عاشقشم، تو چی؟", category: "QUESTION_HOBBIES", weight: 1 },
  { text: "کتاب خوندن و آشپزی، تو چه سرگرمی داری؟", category: "QUESTION_HOBBIES", weight: 2 },

  // خداحافظی و پایان
  { text: "باید برم، بعدا حرف می زنیم، خدا نگهدار", category: "CLOSING", weight: 3 },
  { text: "کار دارم باید برم، میل می کنم حرف بزنیم", category: "CLOSING", weight: 2 },
  { text: "عزیزم فعلا باید برم، بعدا در می‌یابیم", category: "CLOSING", weight: 2 },

  // خندیدن
  { text: "ههههه خنده‌داری", category: "LAUGH", weight: 2 },
  { text: "آخیش، خندوندی منو", category: "LAUGH", weight: 1 },
  { text: "خیلی بامزه‌ای", category: "LAUGH", weight: 1 },

  // موافقت
  { text: "کاملا موافقم", category: "AGREEMENT", weight: 2 },
  { text: "حق با توست", category: "AGREEMENT", weight: 2 },
  { text: "دقیقا، همینطوره", category: "AGREEMENT", weight: 1 },

  // عمومی
  { text: "جالبه، بیشتر بگو", category: "GENERIC", weight: 3 },
  { text: "واقعا؟ نمی‌گما", category: "GENERIC", weight: 2 },
  { text: "خوبه، ادامه بده", category: "GENERIC", weight: 2 },
  { text: "موافقم بات، بعدش چی شد؟", category: "GENERIC", weight: 2 },
  { text: "عجب، بعدش چی؟", category: "GENERIC", weight: 1 },
];

// تشخیص دسته پاسخ بر اساس محتوای پیام کاربر
export function detectReplyCategory(userMessage: string): ReplyCategory {
  const msg = userMessage.toLowerCase();

  if (/سلام|درود| Hi|hello/.test(msg)) return "GREETING";
  if (/سن|چند سال|چندت/.test(msg)) return "QUESTION_AGE";
  if (/شهر|کجا|اصلاح/.test(msg)) return "QUESTION_CITY";
  if (/شغل|کار|چی کار|چیکار|درس/.test(msg)) return "QUESTION_JOB";
  if (/تعریف|خوبی|زیبا|قشنگ|عالی/.test(msg)) return "COMPLIMENT_RESPONSE";
  if (/سرگرمی|علاقه|دوست داری|هیجان/.test(msg)) return "QUESTION_HOBBIES";
  if (/خداحافظ|برم|فعلا|باید برم|خدا نگهدار/.test(msg)) return "CLOSING";
  if (/هه|هاها|خندید|خنده/.test(msg)) return "LAUGH";
  if (/موافق|درست|حق/.test(msg)) return "AGREEMENT";

  return "GENERIC";
}

// انتخاب پاسخ بر اساس دسته
export function pickReply(category: ReplyCategory): BotReply | null {
  const pool = REPLY_BANK.filter((r) => r.category === category);
  if (pool.length === 0) {
    const generic = REPLY_BANK.filter((r) => r.category === "GENERIC");
    if (generic.length === 0) return null;
    return generic[Math.floor(Math.random() * generic.length)];
  }

  // انتخاب با وزن
  const weighted: BotReply[] = [];
  for (const r of pool) {
    const w = r.weight ?? 1;
    for (let i = 0; i < w; i++) weighted.push(r);
  }
  return weighted[Math.floor(Math.random() * weighted.length)];
}
