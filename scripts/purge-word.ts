// حذف کلمه ممنوع از کد/مستندات (و با --db از دیتابیس). استفاده: tsx scripts/purge-word.ts [--db] [--dry]
import * as fs from "fs";
import * as path from "path";

const DRY = process.argv.includes("--dry");
const DB = process.argv.includes("--db");

// ترتیب مهم است: عبارت های خاص قبل از عمومی
export const REPLACEMENTS: [string, string][] = [
  ["همسانی در شهر شما نیست", "کاربری در شهر شما نیست"],
  ["هیچ همسانی یافت نشد", "هیچ کاربری یافت نشد"],
  ["با همه همسان های شهر خودتان", "با همه کاربران شهر خودتان"],
  ["با همه همشان ها", "با همه کاربران"],
  ["با همشان های آن شهر", "با کاربران آن شهر"],
  ["با همشان ها", "با کاربران"],
  ["همسان جدید", "گفتگوی جدید"],
  ["همسان (هم‌شهر)", "کاربر (هم‌شهر)"],
  ["کارت پروفایل همسان", "کارت پروفایل کاربر"],
  ["از لیست همشان های شما", "از لیست کاربران شما"],
  ["همسان های اولیه", "کاربران اولیه"],
  ["همشان های شهرهای دیگر", "کاربران شهرهای دیگر"],
  ["همشان های شهر شما", "کاربران شهر شما"],
  ["همسان های شهر دیگری", "کاربران شهر دیگری"],
  ["استوری های همشان ها", "استوری های کاربران"],
  ["استوری همشان ها", "استوری کاربران"],
  ["۵ همسان", "۵ پروفایل"],
  ["۱۰ همسان", "۱۰ پروفایل"],
  ["همسان ها", "پروفایل ها"],
  ["همشان ها", "پروفایل ها"],
  ["همسان های", "پروفایل های"],
  ["همشان های", "پروفایل های"],
];

export function purge(s: string) {
  for (const [a, b] of REPLACEMENTS) s = s.split(a).join(b);
  return s;
}

function walk(dir: string, out: string[] = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["node_modules", ".next", "generated"].includes(e.name)) continue;
      walk(p, out);
    } else if (/\.(tsx?|md|json|prisma|sql|css)$/.test(e.name)) out.push(p);
  }
  return out;
}

async function files() {
  for (const f of ["src", "prisma", "scripts", "docs"].flatMap((d) => walk(d))) {
    if (f.endsWith("check-ui.ts") || f.endsWith("purge-word.ts")) continue;
    const s = fs.readFileSync(f, "utf8");
    if (!/همسان|همشان/.test(s)) continue;
    const out = purge(s);
    console.log(DRY ? "[dry] would fix" : "fixed", f);
    if (!DRY) fs.writeFileSync(f, out);
  }
}

// دیتابیس: همه ستون های متنی با SQL replace تو در تو (ترتیب REPLACEMENTS)
async function db() {
  await import("dotenv/config");
  const { prisma } = await import("../src/lib/prisma");
  const cols = await prisma.$queryRawUnsafe<{ table_name: string; column_name: string }[]>(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND data_type IN ('text','character varying')`
  );
  const esc = (x: string) => x.replace(/'/g, "''");
  let total = 0;
  for (const { table_name: t, column_name: c } of cols) {
    const like = `"${c}" LIKE '%همسان%' OR "${c}" LIKE '%همشان%'`;
    const [{ n }] = await prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT COUNT(*) AS n FROM "${t}" WHERE ${like}`);
    if (!Number(n)) continue;
    total += Number(n);
    console.log(DRY ? "[dry]" : "update", `${t}.${c}`, Number(n));
    if (DRY) continue;
    let expr = `"${c}"`;
    for (const [a, b] of REPLACEMENTS) expr = `replace(${expr}, '${esc(a)}', '${esc(b)}')`;
    await prisma.$executeRawUnsafe(`UPDATE "${t}" SET "${c}" = ${expr} WHERE ${like}`);
  }
  console.log("db values touched:", total);
  await prisma.$disconnect();
}

files().then(() => (DB ? db() : undefined));
