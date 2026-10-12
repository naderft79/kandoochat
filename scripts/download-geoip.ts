// دریافت ماهانه دیتابیس کشور DB-IP Lite برای تشخیص کشور IP (در سرور اجرا شود؛ فایل داخل گیت نیست)
import { mkdirSync, writeFileSync } from "fs";
import { gunzipSync } from "zlib";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "data", "geo");
const OUT_FILE = path.join(OUT_DIR, "dbip-country-lite.mmdb");

function monthCandidates(): string[] {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return [now, prev].map((d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
}

async function main() {
  for (const month of monthCandidates()) {
    const url = `https://download.db-ip.com/free/dbip-country-lite-${month}.mmdb.gz`;
    console.log(`[geoip] trying ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`[geoip] ${res.status} for ${month}`);
      continue;
    }
    const data = gunzipSync(Buffer.from(await res.arrayBuffer()));
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(OUT_FILE, data);
    console.log(`[geoip] saved ${data.length} bytes to ${OUT_FILE}`);
    return;
  }
  console.error("[geoip] no database could be downloaded");
  process.exit(1);
}

main().catch((err) => {
  console.error("[geoip] failed:", err);
  process.exit(1);
});
