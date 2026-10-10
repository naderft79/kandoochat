// تایید کد؛ در صورت موفقیت توکن اثبات (proof) برای ثبت نام / تغییر رمز برمی گرداند
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { checkOtp } from "@/lib/phoneOtp";

const schema = z.object({
  phone: z.string().regex(/^09\d{9}$/),
  purpose: z.enum(["REGISTER", "RESET"]),
  code: z.string().regex(/^\d{6}$/, "کد باید ۶ رقم باشد"),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "درخواست نامعتبر" }, { status: 400 });
    const { phone, purpose, code } = parsed.data;
    const rl = await rateLimit(`pverify:${getClientIdentifier(request)}:${phone}`, { windowMs: 15 * 60 * 1000, maxRequests: 15 });
    if (!rl.allowed) return NextResponse.json({ error: "تلاش های زیاد؛ بعدا دوباره امتحان کنید" }, { status: 429 });
    const r = await checkOtp(phone, purpose, code);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, proof: r.proof });
  } catch (err) {
    console.error("[auth/otp/verify] error:", err);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
