// بیلد APK اندروید با یک دستور — sync + آیکون + gradle
// پیش نیاز: JDK 17+ و Android SDK (ANDROID_HOME)
import { execFileSync, execSync } from "child_process";
import path from "path";
import fs from "fs";

const isWin = process.platform === "win32";
const root = process.cwd();
const release = process.argv.includes("--release");
// نسخه ریلیز فقط با آدرس https ساخته می شود — جلوگیری از جاسازی آدرس HTTP در APK عمومی
if (release && !/^https:\/\//.test(process.env.CAPACITOR_SERVER_URL || process.env.NEXT_PUBLIC_SITE_URL || "")) {
  console.error("[build-apk] --release needs an https CAPACITOR_SERVER_URL (or NEXT_PUBLIC_SITE_URL)");
  process.exit(1);
}

function run(cmd: string, args: string[], cwd: string) {
  console.log(`[build-apk] $ ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { cwd, stdio: "inherit", shell: isWin });
}

// ۱) تولید آیکون ها
execSync("npx tsx scripts/generate-icons.ts", { cwd: root, stdio: "inherit" });

// ۲) سینک capacitor
run("npx", ["cap", "sync", "android"], root);

// ۳) تولید آیکون های اندروید
run("npx", ["capacitor-assets", "generate", "--android"], root);

// ۴) بیلد با gradle
const androidDir = path.join(root, "android");
if (!fs.existsSync(androidDir)) {
  console.error("[build-apk] android project not found — run `npx cap add android` first");
  process.exit(1);
}

const gradlew = isWin
  ? path.join(androidDir, "gradlew.bat")
  : path.join(androidDir, "gradlew");
const task = release ? "assembleRelease" : "assembleDebug";
run(gradlew, [task], androidDir);

const apkPath = path.join(
  androidDir,
  "app", "build", "outputs", "apk",
  release ? "release" : "debug",
  release ? "app-release.apk" : "app-debug.apk"
);
console.log(`\n[build-apk] APK ready: ${apkPath}`);
