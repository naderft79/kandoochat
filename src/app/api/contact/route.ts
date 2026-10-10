// API فرم تماس با ما — ذخیره پیام و ارسال نوتیفیکیشن به ادمین
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sanitizeString, sanitizeName } from "@/lib/sanitize";

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(1000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "اطلاعات نامعتبر است" }, { status: 400 });
    }

    const { name, email, message } = parsed.data;
    const cleanName = sanitizeName(name);
    const cleanMessage = sanitizeString(message, 1000);

    // ذخیره پیام به عنوان تیکت عمومی
    const ticket = await prisma.ticket.create({
      data: {
        subject: `پیام تماس: ${cleanName}`,
        status: "OPEN",
        priority: "LOW",
        category: "عمومی",
        userId: "contact-form",
        messages: {
          create: {
            senderId: "contact-form",
            content: `از: ${cleanName}\nایمیل: ${email}\n\n${cleanMessage}`,
            isFromAdmin: false,
          },
        },
      },
    });

    console.log(`[contact] ticket created: ${ticket.id} from ${email}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
