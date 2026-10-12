// بیلد APK اندروید با یک دستور — sync + آیکون + gradle
// خروجی: دو APK (فلیور user و admin) در android/app/build/outputs/apk/
// پیش نیاز: JDK 17+ و Android SDK (ANDROID_HOME)
import { execFileSync, execSync } from "child_process";
import path from "path";
import fs from "fs";

const isWin = process.platform === "win32";
const root = process.cwd();
const release = process.argv.includes("--release");

const serverUrl =
  process.env.CAPACITOR_SERVER_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://kandoochat.com";

// نسخه ریلیز فقط با آدرس https ساخته می شود — جلوگیری از جاسازی آدرس HTTP در APK عمومی
if (release && !/^https:\/\//.test(serverUrl)) {
  console.error("[build-apk] --release needs an https CAPACITOR_SERVER_URL (or NEXT_PUBLIC_SITE_URL)");
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
// اپ مدیریت مستقیم صفحه ورود پنل را باز می کند و توکن UA جدا دارد
const mainConfigPath = path.join(root, "android", "app", "src", "main", "assets", "capacitor.config.json");
const adminConfigDir = path.join(root, "android", "app", "src", "admin", "assets");
fs.mkdirSync(adminConfigDir, { recursive: true });
const adminConfig = JSON.parse(fs.readFileSync(mainConfigPath, "utf8"));
adminConfig.appId = "com.kandoo.admin";
adminConfig.appName = "مدیریت کندو";
adminConfig.server = {
  ...(adminConfig.server ?? {}),
  url: serverUrl.replace(/\/$/, "") + "/admin-login",
};
adminConfig.android = {
  ...(adminConfig.android ?? {}),
  appendUserAgent: "KandooAdminApp/1.0",
};
adminConfig.plugins = {
  ...(adminConfig.plugins ?? {}),
  SplashScreen: {
    ...(adminConfig.plugins?.SplashScreen ?? {}),
    backgroundColor: "#000000",
  },
};
fs.writeFileSync(path.join(adminConfigDir, "capacitor.config.json"), JSON.stringify(adminConfig, null, 2));
console.log("[build-apk] admin flavor config written");

// ۵) بیلد با gradle — هر دو فلیور با یک دستور
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

const variant = release ? "release" : "debug";
for (const flavor of ["user", "admin"]) {
  console.log(
    `[build-apk] APK ready: ${path.join(androidDir, "app", "build", "outputs", "apk", flavor, variant, `app-${flavor}-${variant}.apk`)}`
  );
}
