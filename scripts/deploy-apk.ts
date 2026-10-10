// بیلد APK + نصب و اجرای خودکار روی گوشی — از طریق وای فای (adb وایرلس)
// گوشی و سیستم باید روی یک شبکه باشند — dev server روی IP شبکه سرو می شود
// استفاده: npx tsx scripts/deploy-apk.ts [ip-goshi]
import { execFileSync } from "child_process";
import path from "path";
import os from "os";

const isWin = process.platform === "win32";
const root = process.cwd();
const PACKAGE = "com.kandoo.app";
const ADB_PORT = 5555;

function adbPath(): string {
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ||
    path.join(os.homedir(), "AppData", "Local", "Android", "Sdk");
  return path.join(sdk, "platform-tools", isWin ? "adb.exe" : "adb");
}

function run(cmd: string, args: string[], cwd: string) {
  console.log(`[deploy] $ ${cmd} ${args.join(" ")}`);
  execFileSync(cmd, args, { cwd, stdio: "inherit", shell: isWin });
}

function out(cmd: string, args: string[]): string {
  return execFileSync(cmd, args, { encoding: "utf8" }).trim();
}

// IP شبکه سیستم — اگر IP گوشی معلوم باشد، همان ساب نت انتخاب می شود
function hostLanIp(peerIp?: string): string {
  const all: string[] = [];
  for (const infos of Object.values(os.networkInterfaces())) {
    for (const i of infos || []) {
      if (i.family === "IPv4" && !i.internal) all.push(i.address);
    }
  }
  if (peerIp) {
    const prefix = peerIp.split(".").slice(0, 3).join(".");
    const same = all.find((a) => a.startsWith(prefix + "."));
    if (same) return same;
  }
  const lan = all.find((a) => a.startsWith("192.168.") || a.startsWith("10.") || a.startsWith("172."));
  if (lan) return lan;
  if (all.length) return all[0];
  throw new Error("no LAN IP found");
}

const adb = adbPath();

// ۱) پیدا کردن گوشی — وایرلس یا USB
function deviceTargets(): string[] {
  return out(adb, ["devices"])
    .split("\n").slice(1)
    .filter((l) => l.trim().endsWith("\tdevice"))
    .map((l) => l.split("\t")[0].trim());
}

let targets = deviceTargets();
if (targets.length === 0) {
  // تلاش برای اتصال وایرلس — IP گوشی به عنوان آرگومان یا از adb connect
  const phoneIp = process.argv[2];
  if (phoneIp) {
    try { out(adb, ["connect", `${phoneIp}:${ADB_PORT}`]); } catch { /* ignore */ }
    targets = deviceTargets();
  }
}
if (targets.length === 0) {
  console.error("[deploy] no device — connect wirelessly first:");
  console.error("[deploy]   adb connect <phone-ip>:5555");
  console.error("[deploy] or pass the phone IP: npx tsx scripts/deploy-apk.ts 192.168.1.102");
  process.exit(1);
}
// ترجیح اتصال وایرلس — با -s مشخص می کنیم روی کدام دستگاه نصب شود
const target = targets.find((t) => t.includes(":")) || targets[0];
const phoneIp = target.split(":")[0];
const lanIp = target.includes(":") ? hostLanIp(phoneIp) : hostLanIp();
const serverUrl = `http://${lanIp}:3000`;
console.log(`[deploy] device: ${target} | server: ${serverUrl}`);

// ۲) سینک با IP شبکه — گوشی از طریق وای فای به dev server می رسد
process.env.CAPACITOR_SERVER_URL = serverUrl;
run("npx", ["cap", "sync", "android"], root);

// ۳) بیلد
const gradlew = path.join(root, "android", isWin ? "gradlew.bat" : "gradlew");
run(gradlew, ["assembleDebug"], path.join(root, "android"));

// ۴) نصب + اجرا روی همان دستگاه
const apk = path.join(root, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk");
run(adb, ["-s", target, "install", "-r", apk], root);
run(adb, ["-s", target, "shell", "monkey", "-p", PACKAGE, "-c", "android.intent.category.LAUNCHER", "1"], root);

console.log("\n[deploy] done — app installed and launched on the phone");
