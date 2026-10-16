// محافظت از مسیرها + CSRF Protection
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_ROLES, COOKIE_NAME } from "@/lib/auth";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: "kandoo",
      audience: "kandoo-web",
    });
    return payload as { userId: string; role: string };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  // صفحه ورود مدیریت پیشوند /admin دارد ولی صفحه عمومی است — از همه محافظت ها معاف
  if (pathname === "/admin-login") return NextResponse.next();

  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isApi = pathname.startsWith("/api/");

  const token = (isProtected || isAuthPage) ? request.cookies.get(COOKIE_NAME)?.value : null;
  const session = token ? await verifyToken(token) : null;

  // CSRF Protection فقط برای mutation های API
  if (isApi && ["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return NextResponse.json({ error: "درخواست از منبع نامعتبر" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "درخواست نامعتبر" }, { status: 403 });
      }
    } else if (referer) {
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.host !== host) {
          return NextResponse.json({ error: "درخواست از منبع نامعتبر" }, { status: 403 });
        }
      } catch {
        // referer نامعتبر — رد نمی کنیم
      }
    } else if (request.cookies.has(COOKIE_NAME) && process.env.NODE_ENV === "production") {
      // درخواست با کوکی نشست ولی بدون Origin و Referer — احتمال CSRF
      return NextResponse.json({ error: "درخواست از منبع نامعتبر" }, { status: 403 });
    }
  }

  // کاربر وارد نشده و صفحه محافظت شده
  if (isProtected && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const isAdminSession = !!session && ADMIN_ROLES.includes(session.role as any);

  // مسیر ادمین فقط برای نقش های ادمین
  if (pathname.startsWith("/admin") && !isAdminSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // نقش های مدیریت در اپ اصلی پروفایل ندارند — همیشه به پنل می روند
  // در حالت impersonate نقش سشن نقش کاربر است پس این قانون اثر ندارد
  if (isAdminSession && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // کاربر وارد شده نباید صفحه ورود/ثبت نام ببیند
  // فقط ریدایرکت می کنیم؛ حذف کوکی اینجا باعث خروج کاربر بعد از ورود می شد (prefetch صفحه ثبت نام)
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL(isAdminSession ? "/admin" : "/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
