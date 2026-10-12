// تشخیص کشور از روی IP با دیتابیس محلی DB-IP Lite (فقط سرور؛ IP هرگز به سرویس بیرونی ارسال نمی شود)
import { existsSync, readFileSync } from "fs";
import { isIP } from "net";
import path from "path";
import { Reader, type CountryResponse } from "maxmind";
import { normalizeCountryCode } from "@/lib/country";

export { countryNameFa } from "@/lib/country";

const DEFAULT_DB = path.join(process.cwd(), "data", "geo", "dbip-country-lite.mmdb");

let reader: Reader<CountryResponse> | null = null;
let loadFailed = false;

function getReader(): Reader<CountryResponse> | null {
  if (reader || loadFailed) return reader;
  const dbPath = process.env.GEOIP_DB_PATH || DEFAULT_DB;
  if (!existsSync(dbPath)) {
    loadFailed = true;
    console.warn(`[geo] country database not found at ${dbPath}; run npm run geoip:download`);
    return null;
  }
  try {
    reader = new Reader<CountryResponse>(readFileSync(dbPath));
    return reader;
  } catch (err) {
    loadFailed = true;
    console.error("[geo] failed to open country database:", err);
    return null;
  }
}

// کد دو حرفی کشور (مثلاً IR) یا null؛ IP نامعتبر یا بدون داده، null برمی گرداند
export function lookupCountry(ip: string | null | undefined): string | null {
  if (!ip || isIP(ip) === 0) return null;
  const db = getReader();
  if (!db) return null;
  return normalizeCountryCode(db.get(ip)?.country?.iso_code);
}
