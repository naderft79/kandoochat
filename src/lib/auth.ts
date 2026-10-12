// سیستم احراز هویت با JWT امن (jose) و کوکی httpOnly
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const COOKIE_NAME = "kandoo_session";
export const ADMIN_BACKUP_COOKIE = "kandoo_admin_backup";

export const USER_ROLE = "USER";
export const ADMIN_ROLE = "ADMIN"; // نقش قدیمی ادمین برای سازگاری
export const SUPER_ADMIN_ROLE = "SUPER_ADMIN";
export const CONTENT_ADMIN_ROLE = "CONTENT_ADMIN";
export const SUPPORT_ADMIN_ROLE = "SUPPORT_ADMIN";
export const ADMIN_ROLES = [ADMIN_ROLE, SUPER_ADMIN_ROLE, CONTENT_ADMIN_ROLE, SUPPORT_ADMIN_ROLE];

export type UserRole = typeof USER_ROLE | typeof ADMIN_ROLE | typeof SUPER_ADMIN_ROLE | typeof CONTENT_ADMIN_ROLE | typeof SUPPORT_ADMIN_ROLE;
export const USER_ROLES: UserRole[] = [USER_ROLE, ADMIN_ROLE, SUPER_ADMIN_ROLE, CONTENT_ADMIN_ROLE, SUPPORT_ADMIN_ROLE];

export type SessionPayload = {
  userId: string;
  role: UserRole;
  iat?: number;
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  if (secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

const isProduction = process.env.NODE_ENV === "production";

// ساخت توکن و ست کردن کوکی
export async function createSession(userId: string, role: UserRole) {
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS512" })
    .setIssuedAt()
    .setIssuer("kandoo")
    .setAudience("kandoo-web")
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

// حذف کوکی نشست
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// خواندن نشست از کوکی (بدون رفتن به دیتابیس)
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: "kandoo",
      audience: "kandoo-web",
    });
    return {
      userId: payload.userId as string,
      role: payload.role as UserRole,
      iat: payload.iat,
    };
  } catch {
    return null;
  }
}

// سشن صادر شده قبل از آخرین تغییر رمز معتبر نیست
function sessionPrecedesPasswordChange(session: SessionPayload, passwordChangedAt: Date | null) {
  if (!passwordChangedAt || !session.iat) return false;
  return session.iat * 1000 < passwordChangedAt.getTime() - 1000;
}

// گرفتن کاربر جاری از دیتابیس
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { wallet: true, photos: { where: { isRejected: false, isDeletedByUser: false }, select: { url: true, order: true, isProfile: true, isVerified: true }, orderBy: { order: "asc" }, take: 1 } },
  });
  if (!user || !user.isActive) return null;
  if (sessionPrecedesPasswordChange(session, user.passwordChangedAt)) return null;
  return user;
}

// الزام به ورود (برای API ها) — بدون join های wallet و photos ولی با تمام فیلدهای کاربر
export async function requireUser() {
  const session = await getSession();
  if (!session) throw new AuthError("UNAUTHORIZED");
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user || !user.isActive) throw new AuthError("UNAUTHORIZED");
  if (sessionPrecedesPasswordChange(session, user.passwordChangedAt)) throw new AuthError("UNAUTHORIZED");
  return user;
}

// الزام به داشتن یکی از نقش‌های مشخص
export async function requireRole(...allowedRoles: UserRole[]) {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role as UserRole)) throw new AuthError("FORBIDDEN");
  return user;
}

// الزام به نقش مدیر (هر یک از نقش‌های ادمین)
export async function requireAdmin() {
  return requireRole(...(ADMIN_ROLES as UserRole[]));
}

// الزام به نقش سوپر ادمین
export async function requireSuperAdmin() {
  return requireRole(SUPER_ADMIN_ROLE);
}

export class AuthError extends Error {
  constructor(public code: "UNAUTHORIZED" | "FORBIDDEN") {
    super(code);
  }
}

// ذخیره سشن ادمین و ورود به حساب کاربر (impersonate)
export async function impersonateUser(adminUserId: string, targetUserId: string, targetRole: UserRole) {
  const cookieStore = await cookies();
  // ذخیره سشن فعلی ادمین در کوکی backup
  const currentToken = cookieStore.get(COOKIE_NAME)?.value;
  if (currentToken) {
    cookieStore.set(ADMIN_BACKUP_COOKIE, currentToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60, // 1 ساعت
    });
  }
  // ساخت سشن جدید برای کاربر هدف
  await createSession(targetUserId, targetRole);
}

// بازگشت از حساب کاربر به پنل ادمین
export async function restoreAdminSession() {
  const cookieStore = await cookies();
  const backupToken = cookieStore.get(ADMIN_BACKUP_COOKIE)?.value;
  if (!backupToken) return false;
  const backup = await verifySessionToken(backupToken);
  const admin = backup
    ? await prisma.user.findUnique({ where: { id: backup.userId }, select: { role: true, isActive: true } })
    : null;
  if (!admin || !admin.isActive || !(ADMIN_ROLES as readonly string[]).includes(admin.role)) {
    cookieStore.delete(ADMIN_BACKUP_COOKIE);
    return false;
  }
  // بازگردانی سشن ادمین
  cookieStore.set(COOKIE_NAME, backupToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  // حذف کوکی backup
  cookieStore.delete(ADMIN_BACKUP_COOKIE);
  return true;
}

// بررسی اینکه آیا در حالت impersonate هستیم
export async function isImpersonating(): Promise<boolean> {
  const cookieStore = await cookies();
  return !!cookieStore.get(ADMIN_BACKUP_COOKIE)?.value;
}
