// ساخت نشست تستی با JWT مستقیم (بدون UI لاگین)
import "dotenv/config";
import { SignJWT } from "jose";
import type { BrowserContext } from "@playwright/test";

export const E2E_PREFIX = "E2E";

export async function sessionToken(userId: string, role = "USER") {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS512" })
    .setIssuedAt()
    .setIssuer("kandoo")
    .setAudience("kandoo-web")
    .setExpirationTime("2h")
    .sign(new TextEncoder().encode(secret));
}

export async function loginAs(context: BrowserContext, userId: string, baseURL = "http://localhost:3000", role = "USER") {
  const token = await sessionToken(userId, role);
  const url = new URL(baseURL);
  await context.addCookies([
    { name: "kandoo_session", value: token, domain: url.hostname, path: "/", httpOnly: true, sameSite: "Lax" },
  ]);
}
