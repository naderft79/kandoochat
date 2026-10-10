// بیلد APK + نصب و اجرای خودکار روی گوشی متصل با USB
// گوشی با adb reverse از طریق کابل به dev server وصل می شود — وای فای لازم نیست
// استفاده: npx tsx scripts/deploy-apk.ts
import { execFileSync } from "child_process";
import path from "path";
import os from "os";

const isWin = process.platform === "win32";
const root = process.cwd();
const PACKAGE = "com.kandoo.app";
const PORTS = [3000, 3001]; // ۳۰۰۰ کندو، ۳۰۰۱ کندوپی

function adbPath(): string {
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
    path.join(os.homedir(), "AppData", "Local", "Android", "Sdk");
  return path.join(sdk, "platform-tools", isWin ? "adb.exe" : "adb");
}

function run(cmd: string, args: string[], cwd: string) {
  console.log(`[deploy] $ ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { cwd, stdio: "inherit", shell: isWin });
}

const adb = adbPath();

// ۱) بررسی اتصال گوشی
const devices = execFileSync(adb, ["devices"], { encoding: "utf8" });
const connected = devices.split("\n").some((l) => l.trim().endsWith("\tdevice"));
if (!connected) {
  console.error("[deploy] no device connected — enable USB debugging and connect the phone");
  process.exit(1);
}

// ۲) تونل — localhost گوشی به پورت های سیستم وصل می شود
for (const p of PORTS) {
  try { execFileSync(adb, ["reverse", `tcp:${p}`, `tcp:${p}`]); } catch { /* ignore */ }
}

// ۳) سینک با آدرس localhost — داخل وب ویو گوشی به سیستم می رسد
process.env.CAPACITOR_SERVER_URL = "http://localhost:3000";
run("npx", ["cap", "sync", "android"], root);

// ۴) بیلد
const gradlew = path.join(root, "android", isWin ? "gradlew.bat" : "gradlew");
run(gradlew, ["assembleDebug"], path.join(root, "android"));

// ۵) نصب + اجرا
const apk = path.join(root, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");
run(adb, ["install", "-r", apk], root);
run(adb, ["shell", "monkey", "-p", PACKAGE, "-c", "android.intent.category.LAUNCHER", "1"], root);

console.log("\n[deploy] done — app installed and launched on the phone");
