#!/usr/bin/env node
// بیلد همه خروجی ها: کندو + مدیریت + هر برند برای بازار و مایکت — APK و AAB برای هر کدام
// اجرا: node scripts/build-brands.mjs [variant1 variant2 ...]  (بدون آرگومان = همه)
//   npm run build:brands            → همه خروجی ها
//   npm run build:brands -- nafsBazaar  → فقط یک خروجی
import { readFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = path.join(root, "android");
const outDir = path.join(root, "dist/android");

// ابتدا سورس ست ها و brands.gradle را تازه کن
const gen = spawnSync("node", [path.join(root, "scripts/brands-generate.mjs")], {
  cwd: root,
  stdio: "inherit",
});
if (gen.status !== 0) process.exit(gen.status ?? 1);

const config = JSON.parse(readFileSync(path.join(root, "src/config/brands.json"), "utf8"));
const brands = config.brands ?? [];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

const allVariants = [
  "userDirect",
  "adminDirect",
  ...brands.flatMap((b) => [`${b.id}Bazaar`, `${b.id}Myket`]),
];

const requested = process.argv.slice(2);
const variants = requested.length ? requested : allVariants;
const invalid = variants.filter((v) => !allVariants.includes(v));
if (invalid.length) {
  console.error("[build] unknown variant(s):", invalid.join(", "));
  console.error("[build] available:", allVariants.join(", "));
  process.exit(1);
}

const isWin = process.platform === "win32";
// روی ویندوز مسیر مطلق + shell لازم است تا فایل bat پیدا شود
const gradlew = isWin ? path.join(androidDir, "gradlew.bat") : "./gradlew";
mkdirSync(outDir, { recursive: true });

const results = [];
for (const variant of variants) {
  for (const kind of ["assemble", "bundle"]) {
    const task = `${kind}${variant}Release`;
    console.log(`\n[build] ── ${task} ──`);
    const r = spawnSync(gradlew, [task], { cwd: androidDir, stdio: "inherit", shell: isWin });
    if (r.status !== 0) {
      results.push({ variant, kind, ok: false });
      console.error(`[build] FAILED: ${task}`);
      continue;
    }
    // کپی خروجی به dist/android با نام فلیور
    const ext = kind === "assemble" ? "apk" : "aab";
    // خروجی APK در apk/<variant>/release و AAB در bundle/<variant>Release قرار می گیرد
    const srcDir = path.join(
      androidDir,
      "app/build/outputs",
      kind === "assemble" ? path.join("apk", variant, "release") : path.join("bundle", `${variant}Release`)
    );
    let copied = null;
    if (existsSync(srcDir)) {
      const file = readdirSync(srcDir).find((f) => f.endsWith(`.${ext}`));
      if (file) {
        copied = path.join(outDir, `${variant}-release.${ext}`);
        copyFileSync(path.join(srcDir, file), copied);
      }
    }
    results.push({ variant, kind, ok: true, file: copied });
  }
}

console.log("\n[build] ── summary ──");
for (const r of results) {
  console.log(`${r.ok ? "OK " : "ERR"} ${r.variant} ${r.kind}${r.file ? " → " + path.relative(root, r.file) : ""}`);
}
if (results.some((r) => !r.ok)) process.exit(1);
console.log(`\n[build] artifacts in ${path.relative(root, outDir)}/`);
