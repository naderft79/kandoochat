// ارسال Web Push با VAPID + FCM برای اپ اندروید — نیازمند کلیدها در .env
import webpush from "web-push";
import { getBrandById } from "@/lib/brands";
import { JWT } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { SITE_DOMAIN } from "@/lib/site";

function vapidReady(): boolean {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function initVapid() {
  if (!vapidReady()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || `mailto:admin@${SITE_DOMAIN}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  return true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
};

// --- FCM (اندروید) — پوش واقعی وقتی اپ بسته است ---
// نیازمند FCM_SERVICE_ACCOUNT (JSON سرویس اکانت فایربیس) در .env

type FcmServiceAccount = { project_id: string; client_email: string; private_key: string };

let fcmAuth: { client: JWT; projectId: string } | null | undefined;

function getFcmProject() {
  if (fcmAuth === undefined) {
    fcmAuth = null;
    const raw = process.env.FCM_SERVICE_ACCOUNT;
    if (raw) {
      try {
        const sa = JSON.parse(raw) as FcmServiceAccount;
        fcmAuth = {
          client: new JWT({
            email: sa.client_email,
            key: sa.private_key,
            scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
          }),
          projectId: sa.project_id,
        };
      } catch (e) {
        console.error("[FCM] invalid FCM_SERVICE_ACCOUNT:", e);
      }
    }
  }
  return fcmAuth;
}

// ارسال یک پیام FCM به توکن دستگاه — عنوان با نام برند دستگاه شروع می شود
async function sendFcmMessage(token: string, payload: PushPayload, brandName?: string | null): Promise<boolean> {
  const fcm = getFcmProject();
  if (!fcm) return false;
  try {
    const title = brandName ? `${brandName} — ${payload.title}` : payload.title;
    const access = await fcm.client.getAccessToken();
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${fcm.projectId}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${access.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body: payload.body },
          data: { url: payload.url ?? "/dashboard/notifications" },
          android: {
            priority: "HIGH",
            notification: {
              icon: "ic_stat_kandoo",
              channel_id: "kandoo_alerts",
              click_action: "OPEN_APP",
            },
          },
        },
      }),
    });
    if (res.ok) return true;
    const err = await res.json().catch(() => ({}));
    // توکن نامعتبر یا منقضی — حذف از دیتابیس
    const code = err?.error?.details?.[0]?.errorCode ?? err?.error?.status;
    if (code === "UNREGISTERED" || res.status === 404) {
      await prisma.fcmToken.deleteMany({ where: { token } }).catch(() => {});
    }
    console.error(`[FCM] send failed (${res.status}):`, JSON.stringify(err).slice(0, 300));
    return false;
  } catch (e) {
    console.error("[FCM] send error:", e);
    return false;
  }
}

/**
 * ارسال push به همه اشتراک های یک کاربر — وب (VAPID) + اندروید (FCM)
 * غیرفعال: اعلان ها فقط داخل برنامه (مرکز اعلان + SSE) نمایش داده می شوند تا
 * سایت به خاطر اسپم نوتیفیکیشن پلی نخورد. برای برگرداندن، PUSH_ENABLED=1 ست کنید.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (process.env.PUSH_ENABLED !== "1") return 0;
  const [subs, fcmTokens] = await Promise.all([
    prisma.pushSubscription.findMany({ where: { userId } }),
    prisma.fcmToken.findMany({ where: { userId } }),
  ]);
  let sent = 0;

  const vapidOk = initVapid();
  for (const sub of subs) {
    if (!vapidOk) break;
    // نام برند دستگاه به payload اضافه می شود تا نوتیف با نام اپ خودش دیده شود
    const subBrand = sub.brand ? getBrandById(sub.brand) : null;
    const brandedPayload =
      subBrand && subBrand.id !== "kandoo"
        ? { ...payload, appName: subBrand.name }
        : payload;
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(brandedPayload)
      );
      sent++;
    } catch (err) {
      // حذف اشتراک های منقضی یا نامعتبر
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
      console.error(`[push] send failed for sub ${sub.id}:`, (err as Error)?.message ?? err);
    }
  }

  for (const t of fcmTokens) {
    const tBrand = t.brand ? getBrandById(t.brand) : null;
    const tBrandName = tBrand && tBrand.id !== "kandoo" ? tBrand.name : null;
    if (await sendFcmMessage(t.token, payload, tBrandName)) sent++;
  }

  return sent;
}

/**
 * ارسال push به چند کاربر
 */
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<number> {
  let total = 0;
  for (const userId of userIds) {
    total += await sendPushToUser(userId, payload);
  }
  return total;
}
