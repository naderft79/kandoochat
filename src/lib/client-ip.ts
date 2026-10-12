// نشانی IP درخواست برای ثبت آخرین IP کاربر (نمایش در پنل ادمین)
// نکته امنیتی: این مقدار فقط وقتی قابل اعتماد است که پروکسی ورودی، هدر x-forwarded-for را خودش بازنویسی کند؛
// در غیر این صورت کاربر می تواند آن را جعل کند. این یکی از الزامات استقرار در docs/deployment.md است.
const MAX_IP_LENGTH = 45; // طول حداکثری IPv6 (با نگاشت IPv4)
const IP_PATTERN = /^[0-9a-fA-F:.]+$/;

export function getRequestIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip")?.trim() || "";
  if (!ip || ip.length > MAX_IP_LENGTH || !IP_PATTERN.test(ip)) return null;
  return ip;
}
