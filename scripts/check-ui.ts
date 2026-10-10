// Design lint پنل کاربر: بررسی رنگ، گرادیان، فونت، تصویر خام و کلمه ممنوع
// استفاده: tsx scripts/check-ui.ts [--strict] [--verbose]
import * as fs from "fs";
import * as path from "path";

const STRICT = process.argv.includes("--strict");
const VERBOSE = process.argv.includes("--verbose");

// مسیرهای پنل کاربر (ادمین و صفحات ثابت خارج از دامنه)
const UI_DIRS = [
  "src/components/dashboard",
  "src/components/ui",
  "src/components/auth",
  "src/app/dashboard",
  "src/app/login",
  "src/app/register",
  "src/app/forgot-password",
  "src/app/profile",
];
const UI_FILES = ["src/components/AlertModal.tsx", "src/components/ToastProvider.tsx"];
// کلمه ممنوع در کل پروژه بررسی می شود
const WORD_DIRS = ["src", "prisma", "scripts", "docs"];
const WORD_EXCLUDE = ["src/generated", "scripts/check-ui.ts", "scripts/purge-word.ts"];

type Rule = { id: string; re: RegExp; msg: string };

const UI_RULES: Rule[] = [
  { id: "gradient", re: /\b(bg-gradient-to-\w+|(?:from|via|to)-[a-z]+-\d+|ig-gradient(?:-text)?)\b/g, msg: "گرادیان مجاز نیست (فقط حلقه استوری)" },
  { id: "color-family", re: /\b(?:bg|text|border|ring|fill|stroke|divide|outline)-(amber|yellow|emerald|green|pink|rose|purple|indigo|orange|cyan|violet|sky|teal|lime|fuchsia|red|blue)-\d+/g, msg: "خانواده رنگ غیرمجاز؛ از توکن ها استفاده شود" },
  { id: "tiny-font", re: /text-\[(8|9|10|11)px\]/g, msg: "حداقل اندازه متن ۱۲px" },
  { id: "raw-img", re: /<img\b/g, msg: "از next/image استفاده شود" },
  { id: "browser-dialog", re: /(?<![.\w])(alert|confirm)\(/g, msg: "alert/confirm مرورگر ممنوع" },
  { id: "no-zoom", re: /userScalable:\s*false|maximumScale:\s*1\b/g, msg: "قفل زوم ممنوع" },
];
const WORD_RULE: Rule = { id: "forbidden-word", re: /همسان|همشان/g, msg: "کلمه ممنوع" };

function walk(dir: string, out: string[] = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name).replace(/\\/g, "/");
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next") continue;
      walk(p, out);
    } else if (/\.(tsx?|css|md|prisma|json)$/.test(e.name)) out.push(p);
  }
  return out;
}

const counts = new Map<string, number>();
const perFile = new Map<string, number>();
const details: string[] = [];

function scan(file: string, rules: Rule[]) {
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n");
  for (const r of rules) {
    lines.forEach((line, i) => {
      // سایه مشکی محو روی عکس (برای خوانایی متن) مجاز است
      if (r.id === "gradient" && /(?:from|via|to)-black\/\d+/.test(line) && !/(?:from|via|to)-(?:neutral|gray)-\d+/.test(line)) return;
      // پیش نمایش blob (ویرایشگر استوری) با کامنت eslint صریح مستثنی است
      if (r.id === "raw-img" && i > 0 && /no-img-element/.test(lines[i - 1])) return;
      const m = line.match(r.re);
      if (!m) return;
      counts.set(r.id, (counts.get(r.id) ?? 0) + m.length);
      perFile.set(file, (perFile.get(file) ?? 0) + m.length);
      if (VERBOSE) details.push(`${file}:${i + 1} [${r.id}] ${m[0]}`);
    });
  }
}

const uiFiles = [...UI_DIRS.flatMap((d) => walk(d)).filter((f) => /\.tsx?$/.test(f)), ...UI_FILES];
uiFiles.forEach((f) => scan(f, UI_RULES));
const wordFiles = WORD_DIRS.flatMap((d) => walk(d)).filter((f) => !WORD_EXCLUDE.some((x) => f.startsWith(x)));
wordFiles.forEach((f) => scan(f, [WORD_RULE]));
// viewport در layout اصلی
scan("src/app/layout.tsx", UI_RULES.filter((r) => r.id === "no-zoom"));

console.log("== UI lint ==");
for (const r of [...UI_RULES, WORD_RULE]) console.log(`${r.id.padEnd(16)} ${String(counts.get(r.id) ?? 0).padStart(5)}  ${r.msg}`);
const total = [...counts.values()].reduce((a, b) => a + b, 0);
console.log(`total violations: ${total}`);
if (VERBOSE) console.log(details.join("\n"));
else {
  console.log("-- top files --");
  [...perFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([f, n]) => console.log(String(n).padStart(4), f));
}
if (STRICT && total > 0) process.exit(1);
