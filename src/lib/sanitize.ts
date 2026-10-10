// پاکسازی ورودی های متنی برای جلوگیری از XSS و injection
// trim + حذف کاراکترهای خطرناک HTML + محدودیت طول

const HTML_ENTITY_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

/**
 * پاکسازی یک رشته متنی
 * - trim
 * - escape کاراکترهای HTML
 * - حذف کاراکترهای کنترلی
 * - محدودیت طول
 */
export function sanitizeString(input: string, maxLength: number = 500): string {
  if (typeof input !== "string") return "";
  let result = input.trim();
  // حذف کاراکترهای کنترلی (به جز n\ و t\)
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // escape کاراکترهای HTML
  result = result.replace(/[&<>"'/]/g, (char) => HTML_ENTITY_MAP[char] ?? char);
  // محدودیت طول
  if (result.length > maxLength) {
    result = result.slice(0, maxLength);
  }
  return result;
}

/**
 * پاکسازی نام کاربری — فقط حروف انگلیسی، عدد و زیرخط
 */
export function sanitizeUsername(input: string): string {
  if (typeof input !== "string") return "";
  return input.trim().replace(/[^a-zA-Z0-9_]/g, "").slice(0, 30);
}

/**
 * پاکسازی bio — اجازه فارسی و کاراکترهای امن
 */
export function sanitizeBio(input: string): string {
  return sanitizeString(input, 500);
}

/**
 * پاکسازی نام و نام خانوادگی
 */
export function sanitizeName(input: string): string {
  return sanitizeString(input, 50);
}

/**
 * پاکسازی شغل
 */
export function sanitizeJob(input: string): string {
  return sanitizeString(input, 100);
}

/**
 * پاکسازی متن پیام چت
 */
export function sanitizeMessage(input: string): string {
  return sanitizeString(input, 2000);
}

/**
 * پاکسازی موضوع تیکت
 */
export function sanitizeSubject(input: string): string {
  return sanitizeString(input, 200);
}

/**
 * پاکسازی محتوای تیکت
 */
export function sanitizeTicketContent(input: string): string {
  return sanitizeString(input, 5000);
}

/**
 * پاکسازی شیء ورودی — تمام فیلدهای متنی را پاکسازی می کند
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  fieldRules: Partial<Record<keyof T, { type: "string"; max?: number } | { type: "username" }>>
): T {
  const result = { ...obj };
  for (const [field, rule] of Object.entries(fieldRules)) {
    if (!rule) continue;
    const key = field as keyof T;
    if (typeof result[key] !== "string") continue;
    const value = result[key] as string;
    if (rule.type === "username") {
      (result[key] as unknown) = sanitizeUsername(value);
    } else {
      (result[key] as unknown) = sanitizeString(value, rule.max ?? 500);
    }
  }
  return result;
}
