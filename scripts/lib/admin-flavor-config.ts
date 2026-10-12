// کانفیگ اورراید فلیور admin — از روی capacitor.config.json سینک شده ساخته می شود
// اپ مدیریت مستقیم صفحه ورود پنل را باز می کند و توکن UA جدا دارد
// هم build-apk و هم deploy-apk از همین استفاده می کنند تا آدرس هرگز stale نماند
import fs from "fs";
import path from "path";

export function writeAdminFlavorConfig(root: string, serverUrl: string): void {
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
  console.log(`[admin-flavor] config written -> ${adminConfig.server.url}`);
}
