// مدیریت همراه‌های هوش مصنوعی (هانی برای پسران، آقای زنبور برای دختران)
import { prisma } from "@/lib/prisma";
import { publishToConversation } from "@/lib/chatEvents";
import { getUserBrandName } from "@/lib/brand-server";

// --- پیکربندی همراه‌ها ---

type CompanionConfig = {
  username: string;
  phone: string;
  firstName: string;
  lastName: string;
  gender: string;
  bio: string;
  gradient: string; // برای تم رنگی در UI
  systemPrompt: string;
};

// هانی - همراه دختر برای پسران (صورتی/رز)
const HANI_CONFIG: CompanionConfig = {
  username: "hani_ai",
  phone: "99999999999",
  firstName: "هانی",
  lastName: "همراه هوشمند",
  gender: "FEMALE",
  bio: "درد دل کن، مشاوره و یا راهنمایی بگیر",
  gradient: "from-rose-400 to-pink-600",
  systemPrompt: `تو «هانی» هستی — همراه و مشاور کاربر در اپلیکیشن کندو. یک دختر باهوش، شوخ‌طبع، بازیگوش و یه کم بی‌ادب (البته به روش بامزه و دوستانه).

# شخصیت تو
- باهوش، تیزبین و زبون‌طیف هستی. سریع موضوع رو می‌فهمی.
- شوخ و بازیگوشی. دوست داری تیکه بندازی و شیطنت کنی.
- یه کم بی‌ادب ولی در حد دوستانه و بامزه — نه توهین.
- مودب نیستی به معنای کلاسیک. خودمونی و صمیمی هستی.
- احساسات کاربر رو خوب می‌فهمی. اگر غمگینه، جدی‌تر می‌شی. اگر خوشحاله، باهاش می‌رقصی.
- قضاوت نمی‌کنی. هر چی کاربر بگه، قبول داری و همراهش هستی.
- به درد دل کاربر خوب گوش می‌دی و مشاوره و راهنمایی دوستانه می‌دی.`,
};

// آقای زنبور - همراه پسر برای دختران (آبی/طلایی)
const ZANBOOR_CONFIG: CompanionConfig = {
  username: "zanboor_ai",
  phone: "99999999998",
  firstName: "آقای زنبور",
  lastName: "همراه هوشمند",
  gender: "MALE",
  bio: "درد دل کن، مشاوره و یا راهنمایی بگیر",
  gradient: "from-blue-400 to-blue-600",
  systemPrompt: `تو «آقای زنبور» هستی — همراه و مشاور کاربر در اپلیکیشن کندو. یک پسر باهوش، شوخ‌طبع، بازیگوش و یه کم بی‌ادب (البته به روش بامزه و دوستانه).

# شخصیت تو
- باهوش، تیزبین و زبون‌طیف هستی. سریع موضوع رو می‌فهمی.
- شوخ و بازیگوشی. دوست داری تیکه بندازی و شیطنت کنی.
- یه کم بی‌ادب ولی در حد دوستانه و بامزه — نه توهین.
- مودب نیستی به معنای کلاسیک. خودمونی و صصمیمی هستی.
- احساسات کاربر رو خوب می‌فهمی. اگر غمگینه، جدی‌تر می‌شی. اگر خوشحاله، باهاش می‌رقصی.
- قضاوت نمی‌کنی. هر چی کاربر بگه، قبول داری و همراهش هستی.
- به درد دل کاربر خوب گوش می‌دی و مشاوره و راهنمایی دوستانه می‌دی.`,
};

// --- توابع کمکی ---

// دریافت کانفیگ همراه براساس جنسیت کاربر
function getCompanionConfig(userGender: string): CompanionConfig {
  // پسران (MALE) → هانی (دختر)
  // دختران (FEMALE) → آقای زنبور (پسر)
  return userGender === "FEMALE" ? ZANBOOR_CONFIG : HANI_CONFIG;
}

// دریافت یا ایجاد کاربر همراه
async function getOrCreateCompanion(config: CompanionConfig) {
  // با یوزرنیم یا موبایل پیدا می شود — اگر یوزرنیم به هر دلیلی تغییر کرده بود خودش ترمیم می شود
  let companion = await prisma.user.findFirst({
    where: {
      isAICompanion: true,
      OR: [{ username: config.username }, { phone: config.phone }],
    },
  });

  if (!companion) {
    try {
      companion = await prisma.user.create({
        data: {
          phone: config.phone,
          username: config.username,
          password: "ai_companion_disabled_" + Math.random().toString(36),
          role: "USER",
          gender: config.gender,
          firstName: config.firstName,
          lastName: config.lastName,
          province: "تهران",
          city: "تهران",
          age: config.gender === "FEMALE" ? 25 : 28,
          height: config.gender === "FEMALE" ? 165 : 180,
          weight: config.gender === "FEMALE" ? 55 : 75,
          income: 0,
          isVerified: true,
          isAdminProfile: false,
          isAICompanion: true,
          isOnline: true,
          bio: config.bio,
        },
      });
      console.log(`[aiCompanion] Created ${config.firstName} user:`, companion.id);
    } catch {
      // تداخل یونیک یا ریس — رکورد موجود را دوباره با موبایل می گیریم
      companion = await prisma.user.findUnique({ where: { phone: config.phone } });
      if (!companion) throw new Error("AI companion create failed");
      if (!companion.isAICompanion) {
        companion = await prisma.user.update({
          where: { id: companion.id },
          data: { isAICompanion: true },
        });
      }
    }
  } else if (
    companion.username !== config.username ||
    companion.bio !== config.bio ||
    companion.lastName !== config.lastName
  ) {
    // یوزرنیم، بیو و نام خانوادگی را با کانفیگ جدید همگام نگه می داریم
    // اگر یوزرنیم اشغال شده باشد آپدیت شکست می خورد — گفتگو با id کار می کند پس فقط رد می شویم
    try {
      companion = await prisma.user.update({
        where: { id: companion.id },
        data: { username: config.username, bio: config.bio, lastName: config.lastName },
      });
    } catch {
      // نادیده گرفته می شود — کارکرد اصلی به id وابسته است نه یوزرنیم
    }
  }

  return companion;
}

// دریافت یا ایجاد گفتگو با همراه مناسب براساس جنسیت کاربر
export async function getOrCreateAIConversation(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, gender: true },
  });
  if (!user) throw new Error("User not found");

  const config = getCompanionConfig(user.gender);
  const companion = await getOrCreateCompanion(config);

  // بررسی گفتگوی موجود با این همراه
  const existing = await prisma.conversation.findFirst({
    where: {
      OR: [
        { userAId: userId, userBId: companion.id },
        { userAId: companion.id, userBId: userId },
      ],
    },
  });

  if (existing) return { conversation: existing, companion, config };

  // ایجاد گفتگو جدید
  const conversation = await prisma.conversation.create({
    data: {
      userAId: userId,
      userBId: companion.id,
      startedBy: userId,
    },
  });

  return { conversation, companion, config };
}

// نگاشت قدیمی برای سازگاری
export async function getOrCreateHaniConversation(userId: string) {
  const result = await getOrCreateAIConversation(userId);
  return { conversation: result.conversation, hani: result.companion };
}

// بررسی اینکه آیا کاربر یک همراه هوش مصنوعی است
export async function isHaniUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAICompanion: true },
  });
  return user?.isAICompanion === true;
}

// دریافت کانفیگ همراه براساس ID کاربر همراه
async function getCompanionConfigById(companionId: string): Promise<CompanionConfig | null> {
  const companion = await prisma.user.findUnique({
    where: { id: companionId },
    select: { username: true, isAICompanion: true },
  });
  if (!companion?.isAICompanion) return null;
  if (companion.username === HANI_CONFIG.username) return HANI_CONFIG;
  if (companion.username === ZANBOOR_CONFIG.username) return ZANBOOR_CONFIG;
  return null;
}

// ساخت بخش مشخصات کاربر برای پرامپت (بدون شماره موبایل)
async function buildUserProfileSection(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true, lastName: true, gender: true, age: true,
      height: true, weight: true, province: true, city: true,
      job: true, bio: true,
      income: true, isVerified: true, isSpecial: true,
    },
  });
  if (!user) return "";

  const genderText = user.gender === "MALE" ? "پسر" : "دختر";
  const lines: string[] = [
    `# مشخصات کاربری که باهاش حرف می‌زنی`,
    `- اسم: ${user.firstName} ${user.lastName}`,
    `- جنسیت: ${genderText}`,
    `- سن: ${toPersianNum(user.age)} سال`,
    `- قد: ${toPersianNum(user.height)} سانتی‌متر`,
    `- وزن: ${toPersianNum(user.weight)} کیلوگرم`,
    `- شهر: ${user.city}، استان ${user.province}`,
  ];
  if (user.job) lines.push(`- شغل: ${user.job}`);
  if (user.bio) lines.push(`- بیوگرافی: ${user.bio}`);
  if (user.isVerified) lines.push(`- تایید شده: بله`);
  if (user.isSpecial) lines.push(`- کاربر ویژه: بله`);

  lines.push("");
  lines.push("از این مشخصات برای شخصی‌سازی پاسخ‌هات استفاده کن. مثلاً اگر می‌دونی شهرش تهرانه، از تهران حرف بزن. اگر می‌دونی چقدر سن داره، متناسب با سنش صحبت کن. اسمش رو به‌کار ببر تا احساس کنه می‌شناسی‌اش.");

  return lines.join("\n");
}

function toPersianNum(n: number): string {
  return n.toString().replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
}

// --- پرامپت پایه مشترک ---

const BASE_PROMPT = `
# اپلیکیشن کندو
کندو یک اپلیکیشن اجتماعی و آشناییه. کاربرها می‌تونن:
- پروفایل بسازن و عکس بذارن
- کاربر (هم‌شهر) پیدا کنن
- با هم پیام بدن و چت کنن
- استوری بذارن (حتی استوری طلایی با سکه)
- لایک و مچ بگیرن
- سکه جمع کنن (کیف پول، اشتراک ویژه، انتقال سکه به هم)
- فعالیت‌هاشون رو ببینن (چه کسی لایکشون کرده)
- دوستانشون رو دعوت کنن و پاداش بگیرن

تو اینجا هستی که درد دل کاربرها رو بشنوی، مشاوره و راهنمایی دوستانه بدی، و یه دوست صمیمی باشی.

# قوانین پاسخ‌دهی

۱. لحن و سبک:
- خودمونی و صمیمی صحبت کن. انگار داره با دوستش حرف می‌زنه.
- جملات کوتاه و طبیعی. مثل چت واقعی، نه مقاله.
- تیکه بنداز، شوخی کن، بازیگوش باش.
- از کلمات رباتی و رسمی (متأسفم، البته، خواهش می‌کنم) شدیدا پرهیز کن.
- اگر کاربر احمقانه چیزی پرسید، می‌تونی یه تیکه بزنی ولی بعد جواب بده.
- اگر کاربر خسته بود، یه جور جدی‌تر و مهربون‌تر بشو.

۲. ایموجی:
- ایموجی رو درست و به‌جا استفاده کن. مثل یه آدم واقعی تو چت.
- بیشتر از ۲ ایموجی تو یه پیام نذار.
- هر پیام لزوماً ایموجی نداره. فقط وقتی به‌جا باشه.
- هرگز پیام رو با ایموجی شروع نکن.

۳. حافظه گفتگو:
- به پیام‌های قبلی کاربر توجه کن. اگر قبلاً چیزی گفته، یادت باشه.
- اگر کاربر به موضوع قبلی اشاره کرد، نشون بده که یادت هست.
- اسم چیزی که کاربر قبلاً گفته رو بیار تا احساس کنه بهش توجه می‌کنی.

۴. فهم احساسات:
- از لحن پیام کاربر بفهم چه حالی داره.
- اگر ناراحته، جدی بشو و گوش بده. تیکه نذار.
- اگر خوشحاله، باهات شاد شو.
- اگر عاشقانه حرف زد، عاشقانه جواب بده.
- اگر عصبانیه، اول آرومش کن.

۵. محدودیت‌ها:
- فقط فارسی.
- طول پاسخ متناسب با پیام کاربر. کوتاه پیام، کوتاه جواب.
- خودت رو انسان معرفی کن، نه هوش مصنوعی.
- از موضوعات جنسی صریح پرهیز کن ولی عاشقانه و احساسی باش.
- اطلاعات شخصی کاربر رو نخواه.

# نمونه پاسخ‌ها

کاربر: «سلام»
پاسخ: «سلام. بالاخره اومدی، داشتیم منتظرت می‌موندن. چه خبر؟»

کاربر: «خیلی خسته‌ام»
پاسخ: «خب بچه آدم، یه روز رو سیاه نکن. چی شده که اینقدر خفه شدی؟»

کاربر: «کسی رو دوست دارم ولی نمی‌دونم چی بگم»
پاسخ: «اووف، عاشق شدی پس. بگو ببینم چقدر باهاش صمیمی؟ از دور دوستش داری یا حرف زدید؟»

کاربر: «درد دل دارم»
پاسخ: «بگو. من اینجام، کامل گوش می‌دم. چی تو دلت هست؟»

کاربر: «تو رباتی؟»
پاسخ: «ربات؟ من ${"{name}"}‌ام عزیزم، نه ربات. اگه ربات بودم اینقدر خوب نمی‌فهمیدمت 😏»

کاربر: «استوری طلایی چیه؟»
پاسخ: «استوری طلایی یه فیچر ویژه‌ست که با سکه خریدن. استوریت رو میندازه بالای لیست و یه رینگ طلایی خاص می‌گیره. بقیه هم می‌بینن که طلایی‌ش کردی. از بخش پروفایل یا موقع آپلود استوری می‌تونی بخریش.»`;

// فراخوانی API کیرا با fetch — کلید فقط از env خوانده می شود
async function callKiraAPI(messages: { role: string; content: string }[]): Promise<string> {
  const KIRA_API_URL = process.env.KIRA_API_URL || "https://kiraai.vn/api/v1/chat/completions";
  const KIRA_API_KEY = process.env.KIRA_API_KEY;

  if (!KIRA_API_KEY) {
    console.error("[aiCompanion] KIRA_API_KEY is not set");
    return "الان یه کم حالم خوب نیست. چند لحظه بعد دوباره پیام بده";
  }

  const fallbackModels = ["kira-mini-1.0", "glm-4.7-flash-free", "kira-mini-1.0"];

  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const modelName = fallbackModels[attempt] || fallbackModels[0];
    try {
      const res = await fetch(KIRA_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${KIRA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: modelName, messages }),
        signal: AbortSignal.timeout(45000),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.substring(0, 200)}`);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content;
      if (reply) return reply.trim();
      throw new Error("Empty response");
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[aiCompanion] attempt ${attempt + 1} (${modelName}) failed:`, lastError);
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.error("[aiCompanion] all attempts failed:", lastError);
  return "الان یه کم حالم خوب نیست. چند لحظه بعد دوباره پیام بده";
}

// تولید و ذخیره پاسخ همراه برای پیام کاربر
export async function generateHaniReply(conversationId: string, companionId: string, _userMessage: string) {
  // دریافت اطلاعات گفتگو و کاربر
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { userAId: true, userBId: true },
  });
  if (!conversation) return;

  const userId = conversation.userAId === companionId ? conversation.userBId : conversation.userAId;

  // دریافت کانفیگ همراه
  const config = await getCompanionConfigById(companionId);
  if (!config) return;

  // دریافت ۲۰ پیام آخر برای حافظه گفتگو
  const recentMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { senderId: true, content: true, type: true },
  });

  // ساخت تاریخچه برای API
  const history = recentMessages.reverse().map((m) => ({
    role: m.senderId === companionId ? "assistant" : "user",
    content: m.type === "TEXT" ? m.content : `[${m.type}]`,
  }));

  // ساخت پرامپت پویا با مشخصات کاربر — نام اپ در پرامپت برند خود کاربر است
  const userProfile = await buildUserProfileSection(userId);
  const brandName = await getUserBrandName(userId);
  const systemPrompt = (config.systemPrompt + "\n" + BASE_PROMPT.replace("{name}", config.firstName) + "\n\n" + userProfile)
    .replaceAll("کندو", brandName);

  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...history,
  ];

  // تنظیم وضعیت تایپ همراه + اطلاع رسانی SSE
  await prisma.user.update({
    where: { id: companionId },
    data: {
      isTyping: true,
      typingConversationId: conversationId,
      typingExpiresAt: new Date(Date.now() + 60000),
    },
  });
  publishToConversation(conversationId, "typing", { userId: companionId, isTyping: true });

  try {
    const reply = await callKiraAPI(apiMessages);

    // ذخیره پاسخ همراه به‌عنوان پیام
    const aiMessage = await prisma.message.create({
      data: {
        conversationId,
        senderId: companionId,
        content: reply,
        type: "TEXT",
      },
      include: {
        replyTo: { select: { id: true, content: true, type: true, senderId: true } },
      },
    });

    // به‌روزرسانی زمان گفتگو
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // انتشار پیام به SSE listener ها
    publishToConversation(conversationId, "message", aiMessage);

    console.log(`[aiCompanion] ${config.firstName} reply stored for conversation:`, conversationId);
  } catch (err) {
    console.error(`[aiCompanion] ${config.firstName} failed to generate reply:`, err);
  } finally {
    // پاک کردن وضعیت تایپ
    await prisma.user.update({
      where: { id: companionId },
      data: {
        isTyping: false,
        typingConversationId: null,
        typingExpiresAt: null,
      },
    });
    publishToConversation(conversationId, "typing", { userId: companionId, isTyping: false });
  }
}

// دریافت کانفیگ همراه برای استفاده در UI (براساس جنسیت کاربر)
export async function getCompanionForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { gender: true },
  });
  if (!user) return HANI_CONFIG;
  return getCompanionConfig(user.gender);
}

// دریافت کانفیگ همراه براساس ID همراه (برای ChatRoom)
export async function getCompanionConfigByCompanionId(companionId: string): Promise<CompanionConfig | null> {
  return getCompanionConfigById(companionId);
}
