# انتشار اپ اندروید کندو

## پیش نیازها
- آدرس production در `CAPACITOR_SERVER_URL` یا `NEXT_PUBLIC_SITE_URL` باید **https** باشد (بیلد release بدون آن متوقف می شود).
- keystore امضا در `android/keystore.properties` (فقط محلی؛ هرگز commit نشود). بکاپ امن keystore الزامی است؛ گم شدنش یعنی امکان به روزرسانی اپ از بین می رود.
- `google-services.json` فقط وقتی در `android/app` باشد که پوش FCM فعال شود (`NEXT_PUBLIC_FCM_ENABLED=true`).

## شماره نسخه
هر انتشار باید `versionCode` بزرگ تر از قبلی داشته باشد:

```bash
./gradlew assembleRelease -PkandooVersionCode=2 -PkandooVersionName=1.1
```

## بیلد ریلیز
```bash
CAPACITOR_SERVER_URL=https://kandoochat.com npm run build:apk -- --release
```
خروجی: `android/app/build/outputs/apk/release/app-release.apk` (با R8 و shrink فعال).

## بررسی های قبل از آپلود
- در مانیفست merge شده ریلیز نباید `usesCleartextTraffic` باشد:
  `grep usesCleartextTraffic android/app/build/intermediates/merged_manifests/release/*/AndroidManifest.xml`
- `allowBackup="false"` باشد.
- مجوز `SCHEDULE_EXACT_ALARM` در مانیفست ریلیز نباشد.
- مجوزهای اعلام شده: `INTERNET`، `ACCESS_NETWORK_STATE`، `POST_NOTIFICATIONS`، `RECORD_AUDIO` (ضبط ویس)، `CAMERA` (احراز هویت).

## فرم های Google Play Console
- **Data safety:** جمع آوری پیام ها، عکس ها، صدا (ویس)، عکس کارت ملی و سلفی در احراز هویت، شماره موبایل، نام و اطلاعات پروفایل. موارد رمزگذاری شده در انتقال و امکان درخواست حذف حساب را اعلام کنید.
- **Permission declarations:** `RECORD_AUDIO` برای ضبط پیام صوتی و احراز؛ `CAMERA` برای سلفی احراز هویت؛ `POST_NOTIFICATIONS` برای اعلان لایک و پیام.
- **Target API:** `targetSdk = 36` (Android 16). در اندروید ۱۶ روی تبلت ها قفل حالت عمودی نادیده گرفته می شود؛ برای گوشی ها `screenOrientation="portrait"` اعمال است.

## یادداشت ها
- SDK مرکز عمودی: قفل عمودی در مانیفست برای گوشی ها و در PWA/مرورگر (در صورت پشتیبانی) اعمال است.
- پوش FCM تا زمان وجود `google-services.json` غیرفعال است و کرش نمی کند.
