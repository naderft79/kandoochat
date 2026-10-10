// OTP مبتنی بر شماره موبایل برای ثبت نام و بازیابی رمز + توکن اثبات (proof) کوتاه عمر
import { createHash, randomInt, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { sendOtpSms } from "@/lib/sms";

export type OtpPurpose = "REGISTER" | "RESET";

const TTL_MS = 2 * 60 * 1000;
const RESEND_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const PROOF_TTL = "10m";

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

const hashCode = (phone: string, purpose: OtpPurpose, code: string) =>
  createHash("sha256").update(`${phone}:${purpose}:${code}`).digest("hex");

/** ارسال کد؛ خروجی cooldown در صورت درخواست زودهنگام */
export async function issueOtp(phone: string, purpose: OtpPurpose) {
  const last = await prisma.phoneOtp.findFirst({ where: { phone, purpose }, orderBy: { createdAt: "desc" } });
  if (last && Date.now() - last.createdAt.getTime() < RESEND_MS) {
    return { ok: false as const, retryAfterSec: Math.ceil((RESEND_MS - (Date.now() - last.createdAt.getTime())) / 1000) };
  }
  const code = randomInt(100000, 1000000).toString();
  await prisma.$transaction([
    prisma.phoneOtp.deleteMany({ where: { phone, purpose } }),
    prisma.phoneOtp.create({ data: { phone, purpose, codeHash: hashCode(phone, purpose, code), expiresAt: new Date(Date.now() + TTL_MS) } }),
  ]);
  const sent = await sendOtpSms(phone, code);
  if (!sent) return { ok: false as const, failed: true as const };
  // فقط در توسعه و با فلگ صریح، کد برای تست خودکار برگردانده می شود
  const devCode = process.env.NODE_ENV !== "production" && process.env.OTP_DEV_ECHO === "1" ? code : undefined;
  return { ok: true as const, devCode };
}

/** بررسی کد؛ در صورت موفقیت توکن proof برمی گرداند */
export async function checkOtp(phone: string, purpose: OtpPurpose, code: string) {
  const otp = await prisma.phoneOtp.findFirst({ where: { phone, purpose }, orderBy: { createdAt: "desc" } });
  if (!otp) return { ok: false as const, error: "کد تایید یافت نشد. دوباره درخواست کنید" };
  if (new Date() > otp.expiresAt) {
    await prisma.phoneOtp.delete({ where: { id: otp.id } });
    return { ok: false as const, error: "کد تایید منقضی شده است" };
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    await prisma.phoneOtp.delete({ where: { id: otp.id } });
    return { ok: false as const, error: "تعداد تلاش ها بیش از حد مجاز است. دوباره درخواست کنید" };
  }
  const a = Buffer.from(hashCode(phone, purpose, code));
  const b = Buffer.from(otp.codeHash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await prisma.phoneOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return { ok: false as const, error: "کد تایید اشتباه است" };
  }
  await prisma.phoneOtp.delete({ where: { id: otp.id } });
  const proof = await new SignJWT({ phone, purpose })
    .setProtectedHeader({ alg: "HS512" })
    .setIssuedAt()
    .setIssuer("kandoo")
    .setAudience("kandoo-otp")
    .setExpirationTime(PROOF_TTL)
    .sign(secret());
  return { ok: true as const, proof };
}

/** اعتبارسنجی proof برای شماره و هدف مشخص */
export async function verifyProof(proof: string | undefined, phone: string, purpose: OtpPurpose) {
  if (!proof) return false;
  try {
    const { payload } = await jwtVerify(proof, secret(), { issuer: "kandoo", audience: "kandoo-otp" });
    return payload.phone === phone && payload.purpose === purpose;
  } catch {
    return false;
  }
}
