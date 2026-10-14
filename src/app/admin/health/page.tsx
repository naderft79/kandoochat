// سلامت سیستم — وضعیت زیرساخت ها برای مدیران؛ هیچ آدرس یا کلیدی نمایش داده نمی شود
import { prisma } from "@/lib/prisma";
import { HeartPulse, Database, Zap, ScanFace, CreditCard, HardDrive, BellRing, MessageSquare, Server } from "lucide-react";
import AutoRefresh from "@/components/admin/AutoRefresh";

export const dynamic = "force-dynamic";

type Check = {
  name: string;
  status: "ok" | "error" | "off";
  detail?: string;
  ms?: number;
};

async function timeIt(fn: () => Promise<void>): Promise<{ ok: boolean; ms: number }> {
  const t = Date.now();
  try {
    await fn();
    return { ok: true, ms: Date.now() - t };
  } catch {
    return { ok: false, ms: Date.now() - t };
  }
}

// هر پاسخ HTTP یعنی سرویس بالاست؛ خطای شبکه یعنی خاموش یا غیرقابل دسترس
async function reachable(url: string, timeout = 4000): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeout), cache: "no-store" });
    return res.status < 500;
  } catch {
    return false;
  }
}

export default async function AdminHealthPage() {
  const checks: Check[] = [];

  // دیتابیس
  const db = await timeIt(() => prisma.$queryRaw`SELECT 1`.then(() => {}));
  checks.push({ name: "دیتابیس PostgreSQL", status: db.ok ? "ok" : "error", ms: db.ms });

  // Redis
  if (process.env.REDIS_URL) {
    const r = await timeIt(async () => {
      const { getRedis } = await import("@/lib/redis");
      const redis = getRedis();
      if (!redis) throw new Error("no client");
      await redis.ping();
    });
    checks.push({ name: "Redis", status: r.ok ? "ok" : "error", ms: r.ms });
  } else {
    checks.push({ name: "Redis", status: "off", detail: "پیکربندی نشده" });
  }

  // سرویس تشخیص چهره
  if (process.env.FACE_DETECTOR_URL) {
    const f = await timeIt(async () => {
      if (!(await reachable(process.env.FACE_DETECTOR_URL!))) throw new Error("down");
    });
    checks.push({ name: "سرویس تشخیص چهره", status: f.ok ? "ok" : "error", ms: f.ms });
  } else {
    checks.push({ name: "سرویس تشخیص چهره", status: "off", detail: "پیکربندی نشده" });
  }

  // درگاه کندوپی
  if (process.env.KANDOOPAY_URL) {
    const k = await timeIt(async () => {
      if (!(await reachable(process.env.KANDOOPAY_URL!))) throw new Error("down");
    });
    checks.push({ name: "درگاه کندوپی", status: k.ok ? "ok" : "error", ms: k.ms });
  } else {
    checks.push({ name: "درگاه کندوپی", status: "off", detail: "پیکربندی نشده" });
  }

  // پیکربندی سرویس های جانبی (فقط تنظیم شده یا نه)
  const s3 = !!(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID);
  checks.push({
    name: "ذخیره سازی فایل",
    status: s3 ? "ok" : process.env.NODE_ENV === "production" ? "error" : "off",
    detail: s3 ? "S3" : "محلی (public/uploads)",
  });
  checks.push({
    name: "پوش نوتیفیکیشن وب",
    status: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY ? "ok" : "off",
    detail: "VAPID",
  });
  checks.push({
    name: "پیامک",
    status: process.env.KANDOOPAY_URL && process.env.KANDOOPAY_SHARED_SECRET ? "ok" : "off",
    detail: "KandooPay → صبانوین",
  });

  const icons = [Database, Zap, ScanFace, CreditCard, HardDrive, BellRing, MessageSquare];

  // شاخص های اپ
  const mem = process.memoryUsage();
  const [userCount, messageCount, openTickets, pendingVerifies] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.message.count(),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.verificationRequest.count({ where: { status: "PENDING" } }),
  ]);

  const uptimeSec = Math.floor(process.uptime());
  const days = Math.floor(uptimeSec / 86400);
  const hours = Math.floor((uptimeSec % 86400) / 3600);
  const mins = Math.floor((uptimeSec % 3600) / 60);
  const overall = checks.some((c) => c.status === "error") ? "degraded" : "ok";

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={30000} />
      <div className="lux-card p-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-black text-[#e8e8e8] flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-[#d4af37]" />
            سلامت سیستم
          </h1>
          <p className="text-[#888] mt-1 text-xs">بررسی هر ۳۰ ثانیه به صورت خودکار</p>
        </div>
        <span
          className={`px-4 py-1.5 rounded-full text-xs font-bold ${
            overall === "ok" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          }`}
        >
          {overall === "ok" ? "همه چیز سالم است" : "اختلال وجود دارد"}
        </span>
      </div>

      {/* کارت های سرویس */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((c, i) => {
          const Icon = icons[i] ?? Server;
          return (
            <div key={c.name} className="lux-card p-4 flex items-center gap-3">
              <span
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  c.status === "ok"
                    ? "bg-green-500/10 text-green-400"
                    : c.status === "error"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-white/5 text-[#888]"
                }`}
              >
                <Icon className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#e8e8e8]">{c.name}</p>
                <p className="text-xs text-[#888] mt-0.5">
                  {c.status === "ok"
                    ? `سالم${c.ms !== undefined ? ` · ${c.ms}ms` : ""}${c.detail ? ` · ${c.detail}` : ""}`
                    : c.status === "error"
                      ? "خطا در اتصال"
                      : c.detail ?? "غیرفعال"}
                </p>
              </div>
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  c.status === "ok" ? "bg-green-400" : c.status === "error" ? "bg-red-400 animate-pulse" : "bg-[#555]"
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* اطلاعات سیستم */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="lux-card p-5">
          <h2 className="text-sm font-bold text-[#d4af37] flex items-center gap-2 mb-3">
            <Server className="w-4 h-4" />
            سرور اپلیکیشن
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#888]">آپتایم</dt>
              <dd className="text-[#e8e8e8] font-bold" dir="ltr">
                {days > 0 ? `${days}d ` : ""}{hours}h {mins}m
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#888]">نسخه Node</dt>
              <dd className="text-[#e8e8e8] font-bold" dir="ltr">{process.version}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#888]">حافظه مصرفی</dt>
              <dd className="text-[#e8e8e8] font-bold" dir="ltr">
                {Math.round(mem.rss / 1024 / 1024)} MB
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#888]">محیط</dt>
              <dd className="text-[#e8e8e8] font-bold">{process.env.NODE_ENV === "production" ? "پروداکشن" : "توسعه"}</dd>
            </div>
          </dl>
        </div>

        <div className="lux-card p-5">
          <h2 className="text-sm font-bold text-[#d4af37] flex items-center gap-2 mb-3">
            <Database className="w-4 h-4" />
            شاخص های اپ
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#888]">کاربران فعال</dt>
              <dd className="text-[#e8e8e8] font-bold">{userCount.toLocaleString("fa-IR")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#888]">کل پیام ها</dt>
              <dd className="text-[#e8e8e8] font-bold">{messageCount.toLocaleString("fa-IR")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#888]">تیکت های باز</dt>
              <dd className="text-[#e8e8e8] font-bold">{openTickets.toLocaleString("fa-IR")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#888]">احراز هویت در انتظار</dt>
              <dd className="text-[#e8e8e8] font-bold">{pendingVerifies.toLocaleString("fa-IR")}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
