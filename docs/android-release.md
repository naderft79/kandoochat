# انتشار اپ اندروید کندو

## دو خروجی APK

هر بیلد دو APK می سازد (Gradle flavors):

| فلیور | پکیج | نام | توکن UA | مسیر شروع |
|---|---|---|---|---|
| `user` | `com.kandoo.app` | کندو | `KandooApp/1.0` | `/` |
| `admin` | `com.kandoo.admin` | مدیریت کندو | `KandooAdminApp/1.0` | `/admin-login` |

- خروجی: `android/app/build/outputs/apk/{user,admin}/{debug,release}/app-{flavor}-{variant}.apk`
- **اپ مدیریت:** آیکون مشکی + K طلایی، اسپلش مشکی، چرخش آزاد، بدون مجوز دوربین/میکروفون و بدون FCM. کانفیگ آن (`src/admin/assets/capacitor.config.json`) در هر بیلد توسط `scripts/build-apk.ts` تولید می شود و در git نیست.
- **جداسازی ورود در سرور:** ورود مدیر با توکن `KandooApp` و ورود کاربر عادی با `KandooAdminApp` در `/api/auth/login` با همان پاسخ «رمز اشتباه» رد می شود. ورود مدیر از مرورگر آزاد است.
- `npm run deploy:apk` هر دو APK را روی گوشی نصب می کند و پیش فرض اپ کاربر را اجرا می کند؛ با `--admin` اپ مدیریت اجرا می شود.

## پیش نیازها
- آدرس production در `CAPACITOR_SERVER_URL` یا `NEXT_PUBLIC_SITE_URL` باید **https** باشد (بیلد release بدون آن متوقف می شود).
- keystore امضا در `android/keystore.properties` (فقط محلی؛ هرگز commit نشود). بکاپ امن keystore الزامی است؛ گم شدنش یعنی امکان به روزرسانی اپ از بین می رود.
- `google-services.json` باید در `android/app/src/user/` باشد تا فقط فلیور کاربر پوش بگیرد (در ریشه ماژول بیلد فلیور admin خطا می خورد چون `com.kandoo.admin` در Firebase نیست).

## شماره نسخه
هر انتشار باید `versionCode` بزرگ تر از قبلی داشته باشد:

```bash
./gradlew assembleRelease -PkandooVersionCode=2 -PkandooVersionName=1.1
```

## بیلد ریلیز
```bash
CAPACITOR_SERVER_URL=https://kandoochat.top npm run build:apk -- --release
```
خروجی: `android/app/build/outputs/apk/user/release/app-user-release.apk` و `.../admin/release/app-admin-release.apk` (با R8 و shrink فعال).

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
