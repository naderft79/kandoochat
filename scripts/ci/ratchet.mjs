// سقف کیفیت (ratchet): تعداد خطاهای فعلی ESLint و تخلفات UI نباید بیشتر از baseline شود
// استفاده: node scripts/ci/ratchet.mjs eslint | ui
// با کاهش خطاها عدد .github/ci-baseline.json را پایین بیاورید تا سقف قفل شود
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const mode = process.argv[2];
const baselinePath = ".github/ci-baseline.json";
const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const shell = process.platform === "win32";

function run(args) {
  try {
    return execFileSync("npx", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, shell });
  } catch (err) {
    // ESLint و check-ui با خطا کد خروج غیر صفر برمی گردانند ولی خروجی معتبر دارند
    return err.stdout ?? "";
  }
}

let current;
let key;
if (mode === "eslint") {
  key = "eslintErrors";
  const results = JSON.parse(run(["eslint", ".", "-f", "json"]));
  current = results.reduce((sum, file) => sum + file.errorCount, 0);
} else if (mode === "ui") {
  key = "uiViolations";
  const out = run(["tsx", "scripts/check-ui.ts"]);
  const match = out.match(/total violations:\s*(\d+)/);
  if (!match) {
    console.error("[ratchet] could not read UI violation count");
    process.exit(1);
  }
  current = Number(match[1]);
} else {
  console.error("[ratchet] usage: ratchet.mjs eslint | ui");
  process.exit(1);
}

const limit = baseline[key];
console.log(`[ratchet] ${key}: current=${current} baseline=${limit}`);
if (current > limit) {
  console.error(`[ratchet] FAILED: ${key} increased from ${limit} to ${current}`);
  process.exit(1);
}
if (current < limit) {
  console.log(`[ratchet] improved — lower ${baselinePath} ${key} to ${current} to lock the gain`);
}
