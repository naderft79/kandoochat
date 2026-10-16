// بیلد APK/AAB اندروید با یک دستور — sync + آیکون + gradle
// خروجی APK: دو فلیور (user و admin) در android/app/build/outputs/apk/
// خروجی AAB (فقط فلیور user — برای گوگل پلی): android/app/build/outputs/bundle/userRelease/
// پیش نیاز: JDK 17+ و Android SDK (ANDROID_HOME)
import { execFileSync, execSync } from "child_process";
import path from "path";
import fs from "fs";
import { writeAdminFlavorConfig } from "./lib/admin-flavor-config";

const isWin = process.platform === "win32";
const root = process.cwd();
const release = process.argv.includes("--release");
const aab = process.argv.includes("--aab");

// شماره نسخه از آرگومان — مثال: --versionCode=2 --versionName=1.1
function argValue(name: string, fallback: string): string {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] : fallback;
}
const versionCode = argValue("versionCode", "1");
const versionName = argValue("versionName", "1.0");

const serverUrl =
  process.env.CAPACITOR_SERVER_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://kandoochat.top";

// نسخه ریلیز فقط با آدرس https ساخته می شود — جلوگیری از جاسازی آدرس HTTP در APK/AAB عمومی
if ((release || aab) && !/^https:\/\//.test(serverUrl)) {
  console.error("[build-apk] --release/--aab needs an https CAPACITOR_SERVER_URL (or NEXT_PUBLIC_SITE_URL)");
  process.exit(1);
}

function run(cmd: string, args: string[], cwd: string) {
  console.log(`[build-apk] $ ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { cwd, stdio: "inherit", shell: isWin });
}

// ۱) تولید آیکون ها (کاربر + مدیریت)
execSync("npx tsx scripts/generate-icons.ts", { cwd: root, stdio: "inherit" });
execSync("npx tsx scripts/generate-admin-icons.ts", { cwd: root, stdio: "inherit" });

// ۲) سینک capacitor
run("npx", ["cap", "sync", "android"], root);

// ۳) تولید آیکون های اندروید فلیور user
run("npx", ["capacitor-assets", "generate", "--android"], root);

// ۴) کانفیگ اورراید فلیور admin — از روی JSON سینک شده ساخته می شود
writeAdminFlavorConfig(root, serverUrl);

// ۵) بیلد با gradle — هر دو فلیور با یک دستور
const androidDir = path.join(root, "android");
if (!fs.existsSync(androidDir)) {
  console.error("[build-apk] android project not found — run `npx cap add android` first");
  process.exit(1);
}

const gradlew = isWin
  ? path.join(androidDir, "gradlew.bat")
  : path.join(androidDir, "gradlew");
const versionArgs = [
  `-PkandooVersionCode=${versionCode}`,
  `-PkandooVersionName=${versionName}`,
];

if (aab) {
  // AAB فقط برای فلیور user — فایل انتشار گوگل پلی
  run(gradlew, ["bundleUserRelease", ...versionArgs], androidDir);
  console.log(
    `[build-apk] AAB ready: ${path.join(androidDir, "app", "build", "outputs", "bundle", "userRelease", "app-user-release.aab")}`
  );
  console.log(`[build-apk] version: ${versionName} (${versionCode}) — upload to Play Console closed testing`);
} else {
  const task = release ? "assembleRelease" : "assembleDebug";
  run(gradlew, [task, ...versionArgs], androidDir);

  const variant = release ? "release" : "debug";
  for (const flavor of ["user", "admin"]) {
    console.log(
      `[build-apk] APK ready: ${path.join(androidDir, "app", "build", "outputs", "apk", flavor, variant, `app-${flavor}-${variant}.apk`)}`
    );
  }
}
