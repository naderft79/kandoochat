// قالب پیام های ربات تشویقی — مکالمه ای، شیطنت آمیز، طبیعی
// همه پیام ها از پروفایل فیک زنانه به مردان ارسال می شوند
// ایموجی کم، حس واقعی، انگار یک زن واقعی داره چت می کنه

import { prisma } from "@/lib/prisma";

export type BotTemplateCategory =
  | "CHAT_START"
  | "FLIRTY"
  | "CASUAL"
  | "COMPLIMENT"
  | "CURIOSITY"
  | "PLAYFUL"
  | "WARM";

export type BotTemplate = {
  id: string;
  text: string;
  category: BotTemplateCategory;
  senderGender: "FEMALE";
  targetGender: "MALE";
  weight?: number;
};

export const BOT_TEMPLATES: BotTemplate[] = [
  // --- شروع گفتگو ---
  { id: "1", text: "سلام عزیزم، اسمت چیه؟", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "2", text: "سلام، چه جالب همشهری هستیم", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "3", text: "سلام، پروفایلت رو دیدم خوشم اومد", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "4", text: "سلام، بیوگرافی قشنگی داشتی", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "5", text: "سلام، از کدوم شهر هستی؟", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "6", text: "سلام، فکر می کردم کسی از شهر خودمون اینجا نباشه", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "7", text: "سلام، عکست رو دیدم، خیلی جذاب بود", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "8", text: "سلام، گفتم حتما پیام بدم، پروفایلت توجهم رو جلب کرد", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "9", text: "سلام، چه شغلی داری؟", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "10", text: "سلام، چند وقته عضو اینجایی؟", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "11", text: "سلام، گفتم اولین نفر باشم که پیام میده", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "12", text: "سلام، عکست خیلی خوب بود، گفتم سلام بکنم", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "13", text: "سلام، از همون شهرم که هستی، گفتم حتما سلام بکنم", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "14", text: "سلام، گفتم یه پیام بدم شاید خوشمان بیاید", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "15", text: "سلام، گفتم ببینم کی هستی", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "16", text: "سلام، پروفایلت رو نگاه کردم، گفتم پیام بدم", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "17", text: "سلام، گفتم حتما آشنا بشیم", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "18", text: "سلام، دلم می خواست یه نفر جدید پیدا کنم، گفتم پیام بدم", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "19", text: "سلام، گفتم یه چت کوتاه داشته باشیم", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "20", text: "سلام، گفتم ببینم چه کسی پشت این پروفایله", category: "CHAT_START", senderGender: "FEMALE", targetGender: "MALE" },

  // --- شیطنت آمیز ---
  { id: "21", text: "سلام، فکر می کنی از من خوشت میاد؟", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "22", text: "سلام، گفتم ببینم اونقدر جذابی که پروفایلت میگه", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "23", text: "سلام، عجیبه که تا حالا کسی بهت پیام نداده", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "24", text: "سلام، گفتم یه امتحونت بکنم ببینم چطور آدمی هستی", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "25", text: "سلام، می تونی از من خوشت بیاد یا نه، ولی گفتم پیام بدم", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "26", text: "سلام، عکست رو دیدم، گفتم حتما باید پیام بدم", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "27", text: "سلام، گفتم ببینم اونقدر خوش تیپی که میگی", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "28", text: "سلام، گفتم یه امتحونت بکنم، شاید خوشم اومد", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "29", text: "سلام، تا حالا کسی بهت گفته که عکست قشنگه؟", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "30", text: "سلام، گفتم ببینم چرا هنوز کسی رو پیدا نکردی", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "31", text: "سلام، فکر می کنی من و شما میشه؟", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "32", text: "سلام، گفتم ببینم اونقدر باهوشی که بیوت میگه", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "33", text: "سلام، گفتم یه امتحونت بکنم، شاید از خوشت اومد", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "34", text: "سلام، گفتم ببینم واقعا همونقدر جذابی که میگی", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "35", text: "سلام، گفتم حتما پیام بدم، شاید از منم خوشت اومد", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "36", text: "سلام، گفتم ببینم چه کسی هستی، شاید خوشم اومد", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "37", text: "سلام، گفتم یه چت داشته باشیم، شاید هم خوشمان بیاد", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "38", text: "سلام، گفتم ببینم اونقدر باهوشی که فکر می کنی", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "39", text: "سلام، گفتم حتما پیام بدم، شاید هم از خوشت اومد", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "40", text: "سلام، گفتم ببینم واقعا همونقدر جذابی که عکست نشون می ده", category: "FLIRTY", senderGender: "FEMALE", targetGender: "MALE" },

  // --- راحت و دوستانه ---
  { id: "41", text: "سلام، امروز چطور بود؟", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "42", text: "سلام، چه خبر؟ من خوبم", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "43", text: "سلام، امروز چه برنامه ای داری؟", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "44", text: "سلام، از چی خبر؟", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "45", text: "سلام، امروز رو چطور گذروندی؟", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "46", text: "سلام، وقت داری یه چت کوتاه بکنیم؟", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "47", text: "سلام، امروز حوصله داری حرف بزنی؟", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "48", text: "سلام، چه روزی داشتی؟", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "49", text: "سلام، گفتم ببینم چطور هستی", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "50", text: "سلام، امروز خسته نباشی", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "51", text: "سلام، چه کارایی کردی امروز؟", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "52", text: "سلام، گفتم یه سلام بکنم ببینم چطوری", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "53", text: "سلام، امروز کلی کار داشتم، خسته شدم، تو چطور؟", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "54", text: "سلام، گفتم ببینم هنوز آنلاین هستی یا نه", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "55", text: "سلام، چه خبرا؟ چی میشه؟", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "56", text: "سلام، امروز روز خوبی بود؟", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "57", text: "سلام، گفتم ببینم چه خبرا ازت", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "58", text: "سلام، وقت آزاد داری؟", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "59", text: "سلام، گفتم یه چت بکنیم، وقتت هست؟", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "60", text: "سلام، امروز چه کار کردی؟", category: "CASUAL", senderGender: "FEMALE", targetGender: "MALE" },

  // --- تعریف و تمجید ---
  { id: "61", text: "سلام، عکست خیلی قشنگ بود، گفتم حتما پیام بدم", category: "COMPLIMENT", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "62", text: "سلام، قد و وزنت خیلی تناسب خوبی داره", category: "COMPLIMENT", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "63", text: "سلام، شغلت رو دیدم، خیلی جالب بود", category: "COMPLIMENT", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "64", text: "سلام، لبخندت تو عکست خیلی قشنگ بود", category: "COMPLIMENT", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "65", text: "سلام، بیوگرافی قشنگی داشتی، گفتم پیام بدم", category: "COMPLIMENT", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "66", text: "سلام، گفتم ببینم اونقدر جذابی که عکست نشون می ده", category: "COMPLIMENT", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "67", text: "سلام، استایلت تو عکسا خیلی خوب بود", category: "COMPLIMENT", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "68", text: "سلام، گفتم حتما پیام بدم، عکست واقعا قشنگ بود", category: "COMPLIMENT", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "69", text: "سلام، نگاهت تو عکست خیلی جذاب بود", category: "COMPLIMENT", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "70", text: "سلام، گفتم ببینم کسی که اینقدر قشنگه چطور هنوز تنهاست", category: "COMPLIMENT", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "71", text: "سلام، عکست رو دیدم، واقعا خوش تیپی هستی", category: "COMPLIMENT", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "72", text: "سلام، گفتم حتما پیام بدم، خیلی جذاب بودی", category: "COMPLIMENT", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "73", text: "سلام، عکسات رو دیدم، همهشون قشنگ بودن", category: "COMPLIMENT", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "74", text: "سلام، گفتم ببینم این همه جذابیت واقعیه یا نه", category: "COMPLIMENT", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "75", text: "سلام، پروفایلت خیلی کامل و جذاب بود", category: "COMPLIMENT", senderGender: "FEMALE", targetGender: "MALE" },

  // --- کنجکاوی ---
  { id: "76", text: "سلام، گفتم ببینم چی دوست داری، علایقت رو دیدم", category: "CURIOSITY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "77", text: "سلام، چه کارایی تو وقت آزاد انجام می دی؟", category: "CURIOSITY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "78", text: "سلام، گفتم ببینم چه موسیقی گوش می دی", category: "CURIOSITY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "79", text: "سلام، به چه چیزی تو یه رابطه اهمیت می دی؟", category: "CURIOSITY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "80", text: "سلام، گفتم ببینم چه برنامه ای برای آینده داری", category: "CURIOSITY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "81", text: "سلام، دوست داری یه روز عادی ات چطور باشه؟", category: "CURIOSITY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "82", text: "سلام، گفتم ببینم چه چیزی تو یه نفر برات مهمه", category: "CURIOSITY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "83", text: "سلام، گفتم ببینم از چه چیزی لذت می بری", category: "CURIOSITY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "84", text: "سلام، گفتم ببینم چه ویژگی هایی رو تو یه نفر دوست داری", category: "CURIOSITY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "85", text: "سلام، گفتم ببینم چرا هنوز تنها هستی", category: "CURIOSITY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "86", text: "سلام، گفتم ببینم چه هدفی داری تو زندگی", category: "CURIOSITY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "87", text: "سلام، گفتم ببینم از چه چیزی می ترسی", category: "CURIOSITY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "88", text: "سلام، گفتم ببینم دوست داری یه رابطه چطور باشه", category: "CURIOSITY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "89", text: "سلام، گفتم ببینم چی برات مهمه تو یه آدم", category: "CURIOSITY", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "90", text: "سلام، گفتم ببینم چه چیزی باعث میشه از کسی خوشت بیاد", category: "CURIOSITY", senderGender: "FEMALE", targetGender: "MALE" },

  // --- شوخ طبعانه ---
  { id: "91", text: "سلام، گفتم ببینم اونقدر خنده داری که فکر می کنی", category: "PLAYFUL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "92", text: "سلام، می دونستم یه روزی یه نفر پیدا میشه که بهم پیام بده، ولی گفتم خودم زودتر باشم", category: "PLAYFUL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "93", text: "سلام، گفتم ببینم اونقدر باهوشی که میگی یا فقط عکست خوبه", category: "PLAYFUL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "94", text: "سلام، گفتم یه امتحونت بکنم، شاید خوشحال شدم", category: "PLAYFUL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "95", text: "سلام، گفتم ببینم چطور آدمی هستی، شاید خوشم اومد", category: "PLAYFUL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "96", text: "سلام، گفتم ببینم اونقدر جذابی که میگی یا فقط فاز خوبی داری", category: "PLAYFUL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "97", text: "سلام، گفتم ببینم واقعا همونقدر جذابی که عکست نشون می ده، یا یه کم توی ذهنم باشه", category: "PLAYFUL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "98", text: "سلام، گفتم ببینم اونقدر باهوشی که فکر می کنی، یا فقط قیافه خوبی داری", category: "PLAYFUL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "99", text: "سلام، گفتم ببینم چطور آدمی هستی، شاید هم از خوشت اومد", category: "PLAYFUL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "100", text: "سلام، گفتم ببینم اونقدر خنده داری که فکر می کنی، یا فقط فاز جدی داری", category: "PLAYFUL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "101", text: "سلام، گفتم ببینم اونقدر جذابی که میگی، یا فقط عکست خوبه", category: "PLAYFUL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "102", text: "سلام، گفتم ببینم چطور آدمی هستی، شاید خوشم اومد، شاید هم نه", category: "PLAYFUL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "103", text: "سلام، گفتم ببینم اونقدر باهوشی که میگی، یا فقط قیافه خوبی داری", category: "PLAYFUL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "104", text: "سلام، گفتم ببینم واقعا همونقدر جذابی که فکر می کنی", category: "PLAYFUL", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "105", text: "سلام، گفتم ببینم چطور آدمی هستی، شاید خوشم اومد، شاید هم نه، ولی پیام بده", category: "PLAYFUL", senderGender: "FEMALE", targetGender: "MALE" },

  // --- گرم و صمیمی ---
  { id: "106", text: "سلام عزیزم، خواستم ببینم چطوری", category: "WARM", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "107", text: "سلام جان، امروز روز خوبی داشتی؟", category: "WARM", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "108", text: "سلام عزیزم، گفتم یه پیام بدم ببینم چه خبر", category: "WARM", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "109", text: "سلام جانم، امروز چطور بود؟", category: "WARM", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "110", text: "سلام عزیزم، گفتم حتما سلام بکنم", category: "WARM", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "111", text: "سلام جان، گفتم ببینم حالت چطوره", category: "WARM", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "112", text: "سلام عزیزم، گفتم یه پیام دلتنگی بدم", category: "WARM", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "113", text: "سلام جانم، گفتم ببینم امروز چه کارایی کردی", category: "WARM", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "114", text: "سلام عزیزم، گفتم حتما پیام بدم، دلم می خواست", category: "WARM", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "115", text: "سلام جان، گفتم ببینم هنوز آنلاین هستی یا نه", category: "WARM", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "116", text: "سلام عزیزم، گفتم یه چت کوتاه داشته باشیم", category: "WARM", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "117", text: "سلام جانم، گفتم ببینم چه خبرا ازت", category: "WARM", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "118", text: "سلام عزیزم، گفتم حتما سلام بکنم، دلم برات تنگ شده بود", category: "WARM", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "119", text: "سلام جان، گفتم ببینم امروز چطور گذروندی", category: "WARM", senderGender: "FEMALE", targetGender: "MALE" },
  { id: "120", text: "سلام عزیزم، گفتم یه پیام بدم ببینم حالت خوبه", category: "WARM", senderGender: "FEMALE", targetGender: "MALE" },
];

export const TEMPLATES_BY_CATEGORY: Record<BotTemplateCategory, BotTemplate[]> = {
  CHAT_START: BOT_TEMPLATES.filter((t) => t.category === "CHAT_START"),
  FLIRTY: BOT_TEMPLATES.filter((t) => t.category === "FLIRTY"),
  CASUAL: BOT_TEMPLATES.filter((t) => t.category === "CASUAL"),
  COMPLIMENT: BOT_TEMPLATES.filter((t) => t.category === "COMPLIMENT"),
  CURIOSITY: BOT_TEMPLATES.filter((t) => t.category === "CURIOSITY"),
  PLAYFUL: BOT_TEMPLATES.filter((t) => t.category === "PLAYFUL"),
  WARM: BOT_TEMPLATES.filter((t) => t.category === "WARM"),
};

export const CATEGORY_LABELS: Record<BotTemplateCategory, string> = {
  CHAT_START: "شروع گفتگو",
  FLIRTY: "شیطنت آمیز",
  CASUAL: "راحت و دوستانه",
  COMPLIMENT: "تعریف و تمجید",
  CURIOSITY: "کنجکاوی",
  PLAYFUL: "شوخ طبعانه",
  WARM: "گرم و صمیمی",
};

// جایگزینی متغیرهای پویا در متن قالب
export function replaceVariables(
  text: string,
  user: { firstName?: string; city?: string; age?: number; job?: string | null }
): string {
  return text
    .replace(/\{name\}/g, user.firstName ?? "")
    .replace(/\{city\}/g, user.city ?? "")
    .replace(/\{age\}/g, user.age ? String(user.age) : "")
    .replace(/\{job\}/g, user.job ?? "");
}

// دریافت قالب‌های داینامیک از دیتابیس
export async function getDynamicTemplates(
  category?: BotTemplateCategory | "RANDOM",
  targetGender?: string
): Promise<BotTemplate[]> {
  const where: Record<string, unknown> = { isActive: true };
  if (category && category !== "RANDOM") {
    where.category = category;
  }
  if (targetGender) {
    where.targetGender = targetGender;
  }
  const rows = await prisma.botTemplate.findMany({ where });
  return rows.map((r) => ({
    id: r.id,
    text: r.text,
    category: r.category as BotTemplateCategory,
    senderGender: "FEMALE" as const,
    targetGender: "MALE" as const,
    weight: r.weight,
  }));
}

// انتخاب قالب تصادفی بر اساس شرایط — با پشتیبانی از قالب‌های داینامیک
export async function pickTemplateAsync(
  category: BotTemplateCategory | "RANDOM",
  _senderGender: string,
  targetGender: string,
  useDynamic: boolean
): Promise<BotTemplate | null> {
  let staticPool: BotTemplate[];
  if (category === "RANDOM") {
    staticPool = BOT_TEMPLATES.filter((t) => t.targetGender === targetGender);
  } else {
    staticPool = BOT_TEMPLATES.filter(
      (t) => t.category === category && t.targetGender === targetGender
    );
  }

  let pool = staticPool;

  if (useDynamic) {
    const dynamic = await getDynamicTemplates(category, targetGender);
    pool = [...staticPool, ...dynamic];
  }

  if (pool.length === 0) return null;

  // انتخاب با وزن
  const weighted: BotTemplate[] = [];
  for (const t of pool) {
    const w = t.weight ?? 1;
    for (let i = 0; i < w; i++) weighted.push(t);
  }

  return weighted[Math.floor(Math.random() * weighted.length)];
}

// نسخه sync برای backward compatibility
export function pickTemplate(
  category: BotTemplateCategory | "RANDOM",
  _senderGender: string,
  targetGender: string
): BotTemplate | null {
  let pool: BotTemplate[];
  if (category === "RANDOM") {
    pool = BOT_TEMPLATES.filter((t) => t.targetGender === targetGender);
  } else {
    pool = BOT_TEMPLATES.filter(
      (t) => t.category === category && t.targetGender === targetGender
    );
  }
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
